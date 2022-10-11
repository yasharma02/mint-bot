const mintPerWallet = async (txn, acc, web3) => {
  const contract = new web3.eth.Contract(
    JSON.parse(txn.contractABIJSON),
    txn.contractAddress
  );
  var gasEstimate;
  var gasPrice;
  var txnReceipt = { receipt: null, message: "" };
  // assuming standard erc721 mint function definition having 1 parameter i.e. number of tokens to mint
  var data = contract.methods[`${txn.methodName}`](1).encodeABI();

  try {
    gasPrice = await getGasPrice(web3);
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
        gasPrice: gasPrice,
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
  //console.log(txnReceipt);
  return JSON.stringify(txnReceipt);
};

const getGasPrice = async (web3) => {
  var gasPrice = await web3.eth.getGasPrice();
  console.log(gasPrice);
  return +Math.round(gasPrice * 2.5).toFixed(0);
};

const createAccounts = (numOfMints, userMainAcc, web3) => {
  const accounts = [];
  for (var accNum = 1; accNum <= numOfMints; accNum++) {
    var acc = web3.eth.accounts.create();
    accounts.push(acc);
  }
  const mainAcc = JSON.parse(userMainAcc);
  accounts.push(mainAcc);
  //console.log(accounts);
  return accounts;
};

const createAccountStrings = (accounts, web3) => {
  var accStrings = [];
  for (var acc of accounts) {
    var accEncrypt = web3.eth.accounts.encrypt(acc.privateKey, "password");
    accStrings.push(JSON.stringify(accEncrypt));
  }
  return accStrings;
};

const getAccounts = (accStrings, web3) => {
  var accounts = [];
  for (var acc of accStrings) {
    var accDecrypt = web3.eth.accounts.decrypt(JSON.parse(acc), "password");
    accounts.push(accDecrypt);
    // console.log("Account: " + accDecrypt);
  }
  return accounts;
};

const calculateAccountBalance = async (accountAddress, web3) => {
  var accBalance;
  accBalance = await web3.eth.getBalance(accountAddress);
  return web3.utils.fromWei(`${accBalance}`, "ether");
};

const gasPerAcc = async (mainAcc, numOfMints, costPerMint, web3) => {
  var balance = await calculateAccountBalance(mainAcc.address, web3);
  var gasEthPerAcc = ((balance - numOfMints * costPerMint) / numOfMints) * 0.85; // balance -> total balance in main acc
  return gasEthPerAcc;
};

const transferETHToAccount = async (
  costPerMint,
  acc,
  gasEthPerAcc,
  mainAcc,
  web3
) => {
  var txnReceipt = { receipt: null, message: "" };
  var gasPrice;
  try {
    gasPrice = await getGasPrice(web3);
    const signed = await web3.eth.accounts.signTransaction(
      {
        from: mainAcc.address,
        to: acc.address,
        gas: 21000,
        gasPrice: gasPrice,
        value: web3.utils.toWei(`${costPerMint + gasEthPerAcc}`, "ether"), // add gas for mint, transfer nft and eth
      },
      mainAcc.privateKey
    );
    await web3.eth
      .sendSignedTransaction(signed.rawTransaction)
      .on("receipt", function (receipt) {
        txnReceipt.receipt = receipt;
        txnReceipt.message = "success";
      });
  } catch (error) {
    console.log("Internal ETH transfer between accounts error", error.message);
    txnReceipt.receipt = null;
    txnReceipt.message = error.message;
  }
  //console.log(txnReceipt);
  return JSON.stringify(txnReceipt);
};

const transferETHToUserPerWallet = async (txn, acc, web3) => {
  var txnReceipt = { receipt: null, message: "" };
  var gasPrice;
  try {
    gasPrice = await getGasPrice(web3);
    var balance = await calculateAccountBalance(acc.address, web3);
    var balanceToTransfer =
      web3.utils.toWei(`${balance}`, "ether") - gasPrice * 21000;

    const signed = await web3.eth.accounts.signTransaction(
      {
        from: acc.address,
        to: txn.userPublicAddress,
        gasPrice: gasPrice,
        gas: 21000,
        value: `${balanceToTransfer}`, // calculate balance in account
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
    console.log("ETH dust transfer to user error", error.message);
    txnReceipt.receipt = null;
    txnReceipt.message = error.message;
  }

  //console.log(txnReceipt);
  return JSON.stringify(txnReceipt);
};

const transferNFTPerWallet = async (txn, acc, mintExecutionRes, web3) => {
  const contract = new web3.eth.Contract(
    JSON.parse(txn.contractABIJSON),
    txn.contractAddress
  );
  var transferMethodDefinition = "safeTransferFrom(address,address,uint256)"; // transferFrom(address,address,uint256)
  var txnReceipt = { receipt: null, message: "" };
  var gasEstimate;
  var gasPrice;

  try {
    gasPrice = await getGasPrice(web3);
    var tokenId = web3.utils.hexToNumber(
      JSON.parse(mintExecutionRes).receipt.logs[0].topics[3]
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
        gasPrice: gasPrice,
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
  //console.log(txnReceipt);
  return JSON.stringify(txnReceipt);
};

module.exports = {
  mintPerWallet,
  transferETHToAccount,
  transferETHToUserPerWallet,
  transferNFTPerWallet,
  createAccounts,
  createAccountStrings,
  getAccounts,
  gasPerAcc,
};
