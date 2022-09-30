// this script has to be scheduled to run once every minute in cron job
const { connectDB } = require("./utils/connectDB.js");
const { TxnDetailsModel } = require("./models/txnDetails.js");
const { CompletedTxnsModel } = require("./models/completedTxns.js");
const { fork } = require("child_process");

(async () => {
  const conn = await connectDB();
  console.log(`MongoDB Connected: ${conn.connection.host}`);

  const currentDate = new Date();
  console.log(currentDate.toString());
  const txnsDue = [];
  try {
    // compare current date to entries in TxnDetailsModel to check which txns are due
    const queuedTxns = await TxnDetailsModel.find();
    for (var txn of queuedTxns) {
      if (currentDate - txn.time >= 0) {
        txnsDue.push(txn);
        console.log("Txn", txn);
        // remove that entry from TxnDetailsModel
        await TxnDetailsModel.deleteOne({ _id: txn._id });
      }
    }
    console.log("Total txns due " + txnsDue.length);

    var childProcesses = new Array(txnsDue.length);
    var childProcessesResults = [];
    var childProcessResultCount = 0;
    var count = 0;
    for (var txn of txnsDue) {
      console.log(`${count} - starting child process for txn ${txn._id}...`);

      var result = new Object();
      result.ethToAccountsTransferReceiptObj =
        txn.ethToAccountsTransferReceiptObj;
      result.time = txn.time;
      result.accountsObject = txn.accountsObject;
      result.userPublicAddress = txn.userPublicAddress;
      result.contractAddress = txn.contractAddress;
      result.rpcURL = txn.rpcURL;
      result.chainID = txn.chainID;
      result.ethFromAccountsTransferReceiptObj = [];
      result.txnExecutionReceiptObj = [];
      result.nftFromAccountsTransferReceiptObj = [];
      childProcessesResults.push(result);

      childProcesses[count] = fork("./src/utils/txnOperations.js");
      childProcesses[count].send({
        txnNumber: count,
        txn: txn,
      });
      childProcesses[count].on("message", (message) => {
        // console.log("I am here", message);
        var mintRes = message.mintRes;
        var ethTransferRes = message.ethTransferRes;
        var nftTransferRes = message.nftTransferRes;
        console.log(
          `${message.count} - got wallet mint result for child process txn ${txn._id}... ${mintRes}`
        );
        console.log(
          `${message.count} - got wallet eth transfer result for child process txn ${txn._id}... ${ethTransferRes}`
        );
        console.log(
          `${message.count} - got wallet nft transfer result for child process txn ${txn._id}... ${nftTransferRes}`
        );
        if (mintRes != "") {
          childProcessesResults[message.count].txnExecutionReceiptObj.push(
            mintRes
          );
        }
        if (nftTransferRes != "") {
          childProcessesResults[
            message.count
          ].nftFromAccountsTransferReceiptObj.push(nftTransferRes);
        }
        childProcessesResults[
          message.count
        ].ethFromAccountsTransferReceiptObj.push(ethTransferRes);
      });
      childProcesses[count].on("error", function (error) {
        console.log("child process error ", error);
      });
      childProcesses[count].on("exit", function (code, signal) {
        console.log(
          "child process exited with " + `code ${code} and signal ${signal}`
        );
        childProcessResultCount++;
      });
      console.log(
        `${count} - child process for txn ${txn._id} started... moving on`
      );

      count++;
    }
    var pro = new Promise(async (resolve, reject) => {
      while (childProcessResultCount != txnsDue.length) {
        console.log(`waiting for txn processes to finish`);
        console.log("txn processes completed: ", childProcessResultCount);
        await sleep(10000);
      }
      // console.log(childProcessesResults);
      resolve();
    });

    await pro;
    await CompletedTxnsModel.create(childProcessesResults);
    console.log(
      `successfully added ${childProcessesResults.length} txns to CompletedTxnsModel`
    );
  } catch (error) {
    console.log("something other than ethereum txns broke: ", error.message);
    console.log(error);
  }
  console.log("the end!");
  // console.log(process.pid);
  process.exit(1);
})();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
