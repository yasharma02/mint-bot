process.on("message", async (message) => {
  const jsonResponse = await createAndSaveAccounts(message);
  process.send(jsonResponse);
  process.exit();
});

async function createAndSaveAccounts(message) {
  const Web3 = require("web3");
  const {
    transferETHToAccount,
    createAccounts,
    createAccountStrings,
    gasPerAcc,
  } = require("../Web3Service.js");
  const config = require("./config");

  const chainMap = config.CHAIN_MAP;

  console.log("Entering child process");
  var web3;
  var accounts = [];
  var accStrings = [];
  var gasEthPerAcc;
  var ethTransferToAccountsRes = [];

  try {
    if (chainMap.has(message.chainID)) {
      web3 = new Web3(chainMap.get(message.chainID));
    } else {
      web3 = new Web3(message.rpcURL);
    }

    // create accounts
    accounts = createAccounts(
      Number(message.numOfMints),
      message.userMainAcc,
      web3
    );
    console.log("Total accounts created " + accounts.length);

    accStrings = createAccountStrings(accounts, web3);
    console.log("Account strings are ", accStrings);

    console.log(message.userMainTxnHash);

    gasEthPerAcc = await gasPerAcc(
      accounts[accounts.length - 1],
      Number(message.numOfMints),
      Number(message.costPerMint),
      web3
    );
    console.log("Gas per account: ", gasEthPerAcc);

    // send eth to each account from user main account
    for (var accNum = 1; accNum <= accounts.length - 1; accNum++) {
      var acc = accounts[accNum - 1];
      var txnReceipt = await transferETHToAccount(
        Number(message.costPerMint),
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
  } catch (error) {
    console.log("error in child process land: ", error);
    return {
      accountsObject: accStrings,
      ethToAccountsTransferReceiptObj: ethTransferToAccountsRes,
      error: true,
    };
  }
  console.log("Exiting child process");
  return {
    accountsObject: accStrings,
    ethToAccountsTransferReceiptObj: ethTransferToAccountsRes,
    error: false,
  };
}
