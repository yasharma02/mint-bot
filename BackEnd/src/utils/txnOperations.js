process.on("message", async (message) => {
  await executeTransaction(message.txnNumber, message.txn);
  // console.log("response received", jsonResponse);
  // process.send(jsonResponse);
  // console.log("response sent");
  process.exit();
});

async function executeTransaction(txnNumber, txn) {
  const Web3 = require("web3");
  const { fork } = require("child_process");
  const { getAccounts } = require("../Web3Service.js");

  const config = require("./config");

  const chainMap = config.CHAIN_MAP;

  console.log(`${txnNumber} - Entering child process for txn ${txn._id}...`);

  var web3;
  var accounts = [];
  var executionRes = [];
  var nftTransferToUserRes = [];
  var ethTransferToUserRes = [];
  // var processResponse;

  try {
    if (chainMap.has(txn.chainID)) {
      web3 = new Web3(chainMap.get(txn.chainID));
    } else {
      web3 = new Web3(txn.rpcURL);
    }

    // get accounts
    accounts = getAccounts(txn.accountsObject, web3);
    console.log(
      `${txnNumber} - txn ${txn._id}... Accounts: ` + accounts.length
    );

    var grandChildProcesses = new Array(accounts.length);
    // tasks per wallet
    for (var accNum = 0; accNum < accounts.length; accNum++) {
      console.log(
        `${txnNumber} - starting grand child process for txn ${txn._id}... for account ${accNum}`
      );
      grandChildProcesses[accNum] = fork("./src/utils/walletOperations.js");
      grandChildProcesses[accNum].send({
        txnNumber: txnNumber,
        txn: txn,
        accNum: accNum,
        accounts: accounts,
      });
      grandChildProcesses[accNum].on("message", (message) => {
        var mintRes = message.mintRes;
        var ethTransferRes = message.ethTransferRes;
        var nftTransferRes = message.nftTransferRes;
        if (mintRes != "") {
          executionRes.push(mintRes);
        }
        if (nftTransferRes != "") {
          nftTransferToUserRes.push(nftTransferRes);
        }
        ethTransferToUserRes.push(ethTransferRes);

        process.send({
          mintRes: mintRes,
          ethTransferRes: ethTransferRes,
          nftTransferRes: nftTransferRes,
          success: true,
          count: txnNumber,
        });
        console.log(
          // fix accNum in console log below
          `${txnNumber} - got result from grand child for txn ${txn._id}... for account ${message.accNum}, ${message}`
        );
      });
      console.log(
        `${txnNumber} - grand child process for txn ${txn._id} started... for account ${accNum}, moving on`
      );
    }
    var pro = new Promise(async (resolve, reject) => {
      var grandChildsDone = ethTransferToUserRes.length;
      while (grandChildsDone != accounts.length) {
        console.log(
          `${txnNumber} - child process ${txn._id}... waiting for grand childs to finish`
        );
        console.log(
          `${txnNumber} - txn ${txn._id}... wallet processes completed: `,
          grandChildsDone
        );
        await sleep(10000);
        grandChildsDone = ethTransferToUserRes.length;
      }
      resolve();
    });

    await pro;

    // send txn for each account to SendTxnService
    // executionRes = await mint(txn, accounts, web3);
    console.log("Number of NFT mint txns " + executionRes.length);

    // transfer nft from all accounts created to user public address
    // nftTransferToUserRes = await transferNFT(
    //   txn,
    //   accounts,
    //   executionRes,
    //   web3
    // );
    console.log(
      "Number of NFTs transferred to user " + nftTransferToUserRes.length
    );

    // transfer dust from user main account and all accounts created to user public address
    // ethTransferToUserRes = await transferETHToUser(txn, accounts, web3);
    console.log(
      "Number of ETH dust transfers to user " + ethTransferToUserRes.length
    );

    // processResponse = {
    //   ethFromAccountsTransferReceiptObj: JSON.stringify(ethTransferToUserRes),
    //   txnExecutionReceiptObj: JSON.stringify(executionRes),
    //   nftFromAccountsTransferReceiptObj: JSON.stringify(nftTransferToUserRes),
    //   success: true,
    //   count: txnNumber,
    // };
  } catch (error) {
    console.log(
      `${txnNumber} - error in child process land for txn ${txn._id}: `,
      error
    );
    // processResponse = {
    //   ethFromAccountsTransferReceiptObj: JSON.stringify(ethTransferToUserRes),
    //   txnExecutionReceiptObj: JSON.stringify(executionRes),
    //   nftFromAccountsTransferReceiptObj: JSON.stringify(nftTransferToUserRes),
    //   success: false,
    //   count: txnNumber,
    // };
    // return processResponse;
  }

  console.log(`${txnNumber} - Exiting child process for txn ${txn._id}...`);

  // return all details for CompletedTxnsModel entry
  // return processResponse;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
