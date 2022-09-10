const mint = async (txn, accounts, web3) => {
  const txnReceipts = [];
  const contract = new web3.eth.Contract(
    JSON.parse(txn.contractABIJSON),
    txn.contractAddress
  );
  for (var accNum = 1; accNum <= accounts.length - 1; accNum++) {
    var acc = accounts[accNum - 1];
    var gasEstimate;
    var txnReceipt = { receipt: null, message: "" };
    // assuming standard erc721 mint function definition having 1 parameter i.e. number of tokens to mint
    var data = contract.methods[`${txn.methodName}`](1).encodeABI();

    try {
      await contract.methods[`${txn.methodName}`](1)
        .estimateGas({
          from: acc.address,
          value: web3.utils.toWei(`${txn.costPerMint}`, "ether"),
        })
        .then((gasAmount) => {
          gasEstimate = gasAmount;
        });
      const signed = await web3.eth.accounts.signTransaction(
        {
          from: acc.address,
          to: txn.contractAddress,
          gas: gasEstimate, // make gas calculation precise
          value: web3.utils.toWei(`${txn.costPerMint}`, "ether"),
          data: data, // exact name of function for mint
        },
        acc.privateKey
      );
      await web3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .on("receipt", function (receipt) {
          txnReceipt.receipt = receipt;
          txnReceipt.message = "success";
        });
    } catch (error) {
      console.log("Mint txn execution error", error.message);
      txnReceipt.receipt = null;
      txnReceipt.message = error.message;
    }
    txnReceipts.push(JSON.stringify(txnReceipt));
  }
  //console.log(txnReceipts);
  return txnReceipts;
};

const createAccounts = (txn, web3) => {
  const accounts = [];
  for (var accNum = 1; accNum <= txn.numOfMints; accNum++) {
    var acc = web3.eth.accounts.create();
    accounts.push(acc);
  }
  const userMainAcc = JSON.parse(txn.userMainAcc);
  accounts.push(userMainAcc);
  //console.log(accounts);
  return accounts;
};

const createAccountStrings = (accounts, web3) => {
  var accStrings = [];
  for (acc of accounts) {
    var accEncrypt = web3.eth.accounts.encrypt(acc.privateKey, "password");
    accStrings.push(JSON.stringify(accEncrypt));
  }
  return accStrings;
};

const calculateAccountBalance = async (accountAddress, web3) => {
  var accBalance;
  accBalance = await web3.eth.getBalance(accountAddress);
  return web3.utils.fromWei(`${accBalance}`, "ether");
};

const transferETHToAccounts = async (txn, accounts, web3) => {
  const txnReceipts = [];
  var balance = await calculateAccountBalance(
    accounts[accounts.length - 1].address
  );
  var gasPerAcc =
    ((balance - txn.numOfMints * txn.costPerMint) / txn.numOfMints) * 0.85; // balance -> total balance in main acc
  for (var accNum = 1; accNum <= accounts.length - 1; accNum++) {
    var acc = accounts[accNum - 1];

    const signed = await web3.eth.accounts.signTransaction(
      {
        from: accounts[accounts.length - 1].address,
        to: acc.address,
        gas: 21000,
        value: web3.utils.toWei(`${txn.costPerMint + gasPerAcc}`, "ether"), // add gas for mint, transfer nft and eth
      },
      accounts[accounts.length - 1].privateKey
    );
    var txnReceipt = { receipt: null, message: "" };
    try {
      await web3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .on("receipt", function (receipt) {
          txnReceipt.receipt = receipt;
          txnReceipt.message = "success";
        });
    } catch (error) {
      console.log(
        "Internal ETH transfer between accounts error",
        error.message
      );
      txnReceipt.receipt = null;
      txnReceipt.message = error.message;
    }
    txnReceipts.push(JSON.stringify(txnReceipt));
  }
  //console.log(txnReceipts);
  return txnReceipts;
};

const transferETHToUser = async (txn, accounts, web3) => {
  const txnReceipts = [];
  for (var accNum = 1; accNum <= accounts.length; accNum++) {
    try {
      var acc = accounts[accNum - 1];
      var balance = await calculateAccountBalance(acc.address);
      var gasPrice = await web3.eth.getGasPrice();
      var balanceToTransfer =
        web3.utils.toWei(`${balance}`, "ether") - gasPrice * 21000;

      const signed = await web3.eth.accounts.signTransaction(
        {
          from: acc.address,
          to: txn.userPublicAddress,
          gas: 21000,
          value: `${balanceToTransfer}`, // calculate balance in account
        },
        acc.privateKey
      );
      var txnReceipt = { receipt: null, message: "" };
      await web3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .on("receipt", function (receipt) {
          txnReceipt.receipt = receipt;
          txnReceipt.message = "success";
        });
    } catch (error) {
      console.log("ETH dust transfer to user error", error.message);
      txnReceipt.receipt = null;
      txnReceipt.message = error.message;
    }
    txnReceipts.push(JSON.stringify(txnReceipt));
  }
  //console.log(txnReceipts);
  return txnReceipts;
};

const transferNFT = async (txn, accounts, executionRes, web3) => {
  const txnReceipts = [];
  const contract = new web3.eth.Contract(
    JSON.parse(txn.contractABIJSON),
    txn.contractAddress
  );
  for (var accNum = 1; accNum <= accounts.length - 1; accNum++) {
    var acc = accounts[accNum - 1];
    var transferMethodDefinition = "transferFrom(address,address,uint256)"; // safeTransferFrom(address,address,uint256)
    var txnReceipt = { receipt: null, message: "" };
    var gasEstimate;

    try {
      var tokenId = web3.utils.hexToNumber(
        JSON.parse(executionRes[accNum - 1]).receipt.logs[0].topics[3]
      ); // uint256
      console.log("tokenId: " + tokenId);
      var data = contract.methods[`${transferMethodDefinition}`](
        acc.address,
        txn.userPublicAddress,
        tokenId
      ).encodeABI();
      await contract.methods[`${transferMethodDefinition}`](
        acc.address,
        txn.userPublicAddress,
        tokenId
      )
        .estimateGas({ from: acc.address })
        .then((gasAmount) => {
          gasEstimate = gasAmount;
        });
      const signed = await web3.eth.accounts.signTransaction(
        {
          from: acc.address,
          to: txn.userPublicAddress,
          gas: gasEstimate, // precise gas calculation
          data: data, // exact name of function for nft transfer
        },
        acc.privateKey
      );
      await web3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .on("receipt", function (receipt) {
          txnReceipt.receipt = receipt;
          txnReceipt.message = "success";
        });
    } catch (error) {
      console.log("NFT transfer error", error.message);
      txnReceipt.receipt = null;
      txnReceipt.message = error.message;
    }
    txnReceipts.push(JSON.stringify(txnReceipt));
  }
  //console.log(txnReceipts);
  return txnReceipts;
};

module.exports = {
  mint,
  transferETHToAccounts,
  transferETHToUser,
  transferNFT,
  createAccounts,
  createAccountStrings,
};
