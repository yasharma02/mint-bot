process.on("message", async (message) => {
  const jsonResponse = await executeTransaction(
    message.txnNumber,
    message.txn,
    message.accNum,
    message.accounts
  );
  process.send(jsonResponse);
  process.exit();
});

async function executeTransaction(txnNumber, txn, accNum, accounts) {
  const Web3 = require("web3");
  const {
    mintPerWallet,
    transferETHToUserPerWallet,
    transferNFTPerWallet,
  } = require("../Web3Service.js");

  const config = require("./config");

  const chainMap = config.CHAIN_MAP;

  console.log(
    `${txnNumber} - Entering grand child process for txn ${txn._id}... for account ${accNum}`
  );

  var web3;
  var mintRes = "";
  var ethTransferRes = "";
  var nftTransferRes = "";
  var acc = accounts[accNum];
  try {
    if (chainMap.has(txn.chainID)) {
      web3 = new Web3(chainMap.get(txn.chainID));
    } else {
      web3 = new Web3(txn.rpcURL);
    }

    if (accNum != accounts.length - 1) {
      mintRes = await mintPerWallet(txn, acc, web3);
      //   console.log(
      //     `${txnNumber} - txn ${txn._id}... NFT mint for account ${accNum}: ` +
      //       mintRes
      //   );

      nftTransferRes = await transferNFTPerWallet(txn, acc, mintRes, web3);
      //   console.log(
      //     `${txnNumber} - txn ${txn._id}... NFT transfer from account ${accNum}: ` +
      //       nftTransferRes
      //   );
    }
    ethTransferRes = await transferETHToUserPerWallet(txn, acc, web3);
    // console.log(
    //   `${txnNumber} - txn ${txn._id}... ETH transfer from account ${accNum}: ` +
    //     ethTransferRes
    // );
  } catch (error) {
    console.log(
      `${txnNumber} - error in grand child process land for txn ${txn._id}... for account ${accNum}: `,
      error
    );
    return {
      mintRes: mintRes,
      ethTransferRes: ethTransferRes,
      nftTransferRes: nftTransferRes,
      success: false,
      accNum: accNum,
    };
  }

  console.log(
    `${txnNumber} - Exiting grand child process for txn ${txn._id}... for account ${accNum}`
  );

  // return all details for CompletedTxnsModel entry
  return {
    mintRes: mintRes,
    ethTransferRes: ethTransferRes,
    nftTransferRes: nftTransferRes,
    success: true,
    accNum: accNum,
  };
}
