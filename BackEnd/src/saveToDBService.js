const { connectDB } = require("./utils/connectDB.js");
const Web3 = require("web3");
const { TxnDetailsModel } = require("./models/txnDetails.js");
const {
  transferETHToAccount,
  createAccounts,
  createAccountStrings,
  gasPerAcc,
} = require("./Web3Service.js");
const config = require("./utils/config");

const chainMap = config.CHAIN_MAP;

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

    var web3;
    if (chainMap.has(chainID)) {
      web3 = new Web3(chainMap.get(chainID));
    } else {
      web3 = new Web3(rpcURL);
    }

    // create accounts
    var accounts = createAccounts(Number(numOfMints), userMainAcc, web3);
    console.log("Total accounts created " + accounts.length);

    var accStrings = createAccountStrings(accounts, web3);
    console.log("Account strings are ", accStrings);

    console.log(userMainTxnHash);

    var gasEthPerAcc = await gasPerAcc(
      accounts[accounts.length - 1],
      Number(numOfMints),
      Number(costPerMint),
      web3
    );
    console.log("Gas per account: ", gasEthPerAcc);

    const ethTransferToAccountsRes = [];

    // send eth to each account from user main account
    for (var accNum = 1; accNum <= accounts.length - 1; accNum++) {
      var acc = accounts[accNum - 1];
      var txnReceipt = await transferETHToAccount(
        Number(costPerMint),
        acc,
        gasEthPerAcc,
        accounts[accounts.length - 1],
        web3
      );
      // console.log(`ETH transferred for account ${accNum}: `, txnReceipt);
      ethTransferToAccountsRes.push(txnReceipt);
    }

    console.log(
      "Number of Internal ETH transfers between accounts " +
        ethTransferToAccountsRes.length
    );

    await TxnDetailsModel.create({
      contractAddress: contractAddress,
      contractABIJSON: contractABIJSON,
      userPublicAddress: userPublicAddress,
      time: txnTime,
      methodName: methodName,
      numOfMints: Number(numOfMints),
      costPerMint: Number(costPerMint),
      accountsObject: accStrings,
      rpcURL: rpcURL,
      chainID: chainID,
      ethToAccountsTransferReceiptObj: ethTransferToAccountsRes,
    });
  } catch (error) {
    res.success = false;
    res.message = error.message;
    return res;
  }
  res.success = true;
  res.message = "Saved to database";
  return res;
};

module.exports = { saveTxnToDB };
