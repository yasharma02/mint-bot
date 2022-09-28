// this script has to be scheduled to run once every minute in cron job
const Web3 = require("web3");
const config = require("./utils/config");
const { connectDB } = require("./utils/connectDB.js");
const { CompletedTxnsModel } = require("./models/completedTxns.js");
const { TxnDetailsModel } = require("./models/txnDetails.js");
const {
  // mint,
  // transferETHToUser,
  // transferNFT,
  mintPerWallet,
  transferETHToUserPerWallet,
  transferNFTPerWallet,
  getAccounts,
} = require("./Web3Service.js");

const chainMap = config.CHAIN_MAP;

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

    for (var txn of txnsDue) {
      var web3;
      var accounts;
      var executionRes = [];
      var nftTransferToUserRes = [];
      var ethTransferToUserRes = [];

      if (chainMap.has(txn.chainID)) {
        web3 = new Web3(chainMap.get(txn.chainID));
      } else {
        web3 = new Web3(txn.rpcURL);
      }

      // get accounts
      accounts = getAccounts(txn.accountsObject, web3);
      console.log("Accounts: " + accounts.length);

      // tasks per wallet
      for (var accNum = 1; accNum <= accounts.length; accNum++) {
        var acc = accounts[accNum - 1];
        var mintRes;
        var ethTransferRes;
        var nftTransferRes;

        if (accNum != accounts.length) {
          mintRes = await mintPerWallet(txn, acc, web3);
          console.log(`NFT mint for account ${accNum}: ` + mintRes);
          executionRes.push(mintRes);

          nftTransferRes = await transferNFTPerWallet(txn, acc, mintRes, web3);
          console.log(`NFT transfer from account ${accNum}: ` + nftTransferRes);
          nftTransferToUserRes.push(nftTransferRes);
        }
        ethTransferRes = await transferETHToUserPerWallet(txn, acc, web3);
        console.log(`ETH transfer from account ${accNum}: ` + ethTransferRes);
        ethTransferToUserRes.push(ethTransferRes);
      }

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

      // save all details to CompletedTxnsModel
      await CompletedTxnsModel.create({
        ethToAccountsTransferReceiptObj: txn.ethToAccountsTransferReceiptObj,
        ethFromAccountsTransferReceiptObj: ethTransferToUserRes,
        txnExecutionReceiptObj: executionRes,
        nftFromAccountsTransferReceiptObj: nftTransferToUserRes,
        accountsObject: txn.accountsObject,
        userPublicAddress: txn.userPublicAddress,
        contractAddress: txn.contractAddress,
        time: txn.time,
        rpcURL: txn.rpcURL,
        chainID: txn.chainID,
      });
      console.log("successfully added to CompletedTxnsModel");
    }
  } catch (error) {
    console.log("something other than ethereum txns broke: ", error.message);
    console.log(error);
  }
  console.log("the end!");
  // console.log(process.pid);
  process.exit(1);
})();
