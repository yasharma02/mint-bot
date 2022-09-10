// this script has to be scheduled to run once every minute in cron job
const Web3 = require("web3");
const config = require("./utils/config");
const { connectDB } = require("./utils/connectDB.js");
const { CompletedTxnsModel } = require("./models/completedTxns.js");
const { TxnDetailsModel } = require("./models/txnDetails.js");
const {
  mint,
  transferETHToAccounts,
  transferETHToUser,
  transferNFT,
  createAccounts,
  createAccountStrings,
} = require("./Web3Service.js");

const chainMap = new Map([
  ["0x5", config.ALCHEMY_NODE_GOERLI],
  ["0x1", config.ALCHEMY_NODE_MAINNET],
  ["0x38", config.BINANCE_SMART_CHAIN],
  ["0x89", config.Polygon_Mainnet],
  ["0xa86a", config.Avalanche_Network],
  ["0x13881", config.Mumbai_Testnet],
  ["0x3", config.Ropsten_Test_Network],
  ["0x4", config.Rinkeby_Test_Network],
  ["0x2a", config.Kovan_Test_Network],
]);

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
      if (chainMap.has(txn.chainID)) {
        web3 = new Web3(chainMap.get(txn.chainID));
      } else {
        web3 = new Web3(txn.rpcURL);
      }

      // create accounts
      var accounts = createAccounts(txn, web3);
      console.log("Total accounts created " + accounts.length);

      // send eth to each account from user main account
      var ethTransferToAccountsRes = await transferETHToAccounts(
        txn,
        accounts,
        web3
      );
      console.log(
        "Number of Internal ETH transfers between accounts " +
          ethTransferToAccountsRes.length
      );

      // send txn for each account to SendTxnService
      var executionRes = await mint(txn, accounts, web3);
      console.log("Number of NFT mint txns " + executionRes.length);

      // transfer nft from all accounts created to user public address
      var nftTransferToUserRes = await transferNFT(
        txn,
        accounts,
        executionRes,
        web3
      );
      console.log(
        "Number of NFTs transferred to user " + nftTransferToUserRes.length
      );

      // transfer dust from user main account and all accounts created to user public address
      var ethTransferToUserRes = await transferETHToUser(txn, accounts, web3);
      console.log(
        "Number of ETH dust transfers to user " + ethTransferToUserRes.length
      );

      // save all details to CompletedTxnsModel
      var accStrings = createAccountStrings(accounts, web3);
      console.log("Account strings are ", accStrings);

      await CompletedTxnsModel.create({
        ethToAccountsTransferReceiptObj: ethTransferToAccountsRes,
        ethFromAccountsTransferReceiptObj: ethTransferToUserRes,
        txnExecutionReceiptObj: executionRes,
        nftFromAccountsTransferReceiptObj: nftTransferToUserRes,
        accountsObject: accStrings,
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
  }
  console.log("the end!");
})();
