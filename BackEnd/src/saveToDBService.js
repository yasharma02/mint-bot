const { connectDB } = require("./utils/connectDB.js");
const { TxnDetailsModel } = require("./models/txnDetails.js");
const { fork } = require("child_process");

const saveTxnToDB = async (
  contractAddress,
  contractABIJSON,
  userPublicAddress,
  txnTime,
  methodName,
  numOfMints,
  costPerMint,
  userMainTxnHash,
  userMainAcc,
  rpcURL,
  chainID
) => {
  const res = new Object();
  res.success = false;
  res.message = "";

  try {
    const conn = await connectDB();
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const doc = await TxnDetailsModel.create({
      contractAddress: contractAddress,
      contractABIJSON: contractABIJSON,
      userPublicAddress: userPublicAddress,
      time: txnTime,
      methodName: methodName,
      numOfMints: Number(numOfMints),
      costPerMint: Number(costPerMint),
      accountsObject: [],
      rpcURL: rpcURL,
      chainID: chainID,
      ethToAccountsTransferReceiptObj: [],
    });
    console.log(doc);

    const childProcess = fork("./src/utils/accountOperations.js");
    childProcess.send({
      chainID: chainID,
      rpcURL: rpcURL,
      numOfMints: numOfMints,
      userMainAcc: userMainAcc,
      userMainTxnHash: userMainTxnHash,
      costPerMint: costPerMint,
    });
    childProcess.on("message", async (message) => {
      console.log("child process result: ", message);
      var ethToAccountsTransferReceiptObj =
        message.ethToAccountsTransferReceiptObj;
      var accountsObject = message.accountsObject;
      var docId = doc._id;
      const oldEntry = await TxnDetailsModel.findByIdAndUpdate(docId, {
        accountsObject: accountsObject,
        ethToAccountsTransferReceiptObj: ethToAccountsTransferReceiptObj,
      });
      // console.log("oldEntry: ", oldEntry);
      const newEntry = await TxnDetailsModel.findById(docId);
      // console.log("newEntry: ", newEntry);
    });
  } catch (error) {
    console.log(error);
    res.success = false;
    res.message = error.message;
    return res;
  }
  res.success = true;
  res.message = "Saved to database";
  return res;
};

module.exports = { saveTxnToDB };
