import { txnInputsToServer } from "./sendRequests.js";
import { checkInputs } from "./helper";

export const inputOperations = (
  contractAddress,
  time,
  contractABI,
  methodName,
  numOfMints,
  costPerMint,
  rpcURL,
  chainStatus
) => {
  try {
    // get chainID
    const chainID = chainStatus.substring(chainStatus.search("ChainId") + 9);
    console.log(chainID);

    // input validation in helper.js
    const { validationSuccess, validationStatus } = checkInputs(
      contractAddress,
      time,
      contractABI,
      methodName,
      numOfMints,
      costPerMint,
      rpcURL
    );
    if (!validationSuccess) {
      return {
        success: false,
        status: validationStatus,
        chainID: chainID,
      };
    } else {
      return {
        success: true,
        status: validationStatus,
        chainID: chainID,
      };
    }
  } catch (error) {
    return {
      success: false,
      status: "😥 " + error.message,
      chainID: null,
    };
  }
};

export const createUserMainAccount = (web3) => {
  try {
    // create new account
    var userMainAccount = web3.eth.accounts.create();
    console.log(userMainAccount);
    return {
      success: true,
      status: "Wallet created",
      userAccount: userMainAccount,
    };
  } catch (error) {
    return {
      success: false,
      status: "😥 " + error.message,
      userAccount: null,
    };
  }
};

const getGasPrice = async (web3) => {
  var gasPrice = await web3.eth.getGasPrice();
  console.log(gasPrice);
  return +Math.round(gasPrice * 2.5).toFixed(0);
};

const getMintGasEstimate = async (
  web3,
  contract,
  costPerMint,
  address,
  methodName
) => {
  var gasEstimate = await contract.methods[`${methodName}`](1).estimateGas({
    from: address,
    value: web3.utils.toWei(`${costPerMint}`, "ether"),
  });

  return +Math.round(gasEstimate * 2.5).toFixed(0);
};

const getTransferNFTGasEstimate = async (contract, address, walletAddress) => {
  const methodName = "safeTransferFrom(address,address,uint256)";
  var gasEstimate = await contract.methods[`${methodName}`](
    address,
    walletAddress,
    1
  ).estimateGas({
    from: address,
  });

  return +Math.round(gasEstimate * 2.5).toFixed(0);
};

export const requestFunds = async (
  numOfMints,
  costPerMint,
  contractAddress,
  userAccount,
  contractABI,
  methodName,
  walletAddress,
  web3
) => {
  try {
    const contractABIJSON = JSON.parse(contractABI);
    const contract = new web3.eth.Contract(contractABIJSON, contractAddress);
    // transfer user funds
    // transfer eth 2*numofmints+1 times, mint numofmints times, transfer nft numofmints times
    const gasPrice = await getGasPrice(web3);
    const mintGasEstimate = await getMintGasEstimate(
      web3,
      contract,
      costPerMint,
      userAccount.address,
      methodName
    );
    // const transferNFTGasEstimate = await getTransferNFTGasEstimate(
    //   contract,
    //   userAccount.address,
    //   walletAddress
    // );
    const gasEstimate =
      (2 * numOfMints + 1) * +Math.round(21000 * 2.5).toFixed(0) +
      mintGasEstimate * numOfMints * 2;

    // const totalFunds = numOfMints * costPerMint + numOfMints * gasPerMint; // hardcoded total gas required per mint
    const totalFunds =
      web3.utils.toWei(`${numOfMints * costPerMint}`, "ether") +
      gasPrice * gasEstimate;
    const transactionParameters = {
      to: userAccount.address,
      from: window.ethereum.selectedAddress, // must match user's active address
      gasPrice: web3.utils.toHex(gasPrice),
      gas: web3.utils.toHex(21000),
      value: web3.utils.toHex(totalFunds),
    };

    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    });
    console.log("Txn Hash is " + txHash);
    // console.log(typeof txHash);
    return {
      success: true,
      status: "Funds transfer request sent",
      txHash: txHash,
    };
  } catch (error) {
    return {
      success: false,
      status: "😥 " + error.message,
      txHash: null,
    };
  }
};

export const awaitConfirmation = async (txHash, web3) => {
  try {
    // use TxnHash to check whether txn mined yet
    var receipt = await getTxnReceipt(web3, txHash);
    for (var count = 1; count <= 4; count++) {
      if (receipt != null) {
        break;
      }
      console.log("Waiting 12 secs for user main txn to get mined");
      await sleep(12000);
      receipt = await getTxnReceipt(web3, txHash);
      if (count == 4) {
        return {
          success: false,
          status: "user eth send txn didn't get mined",
        };
      }
    }
    return {
      success: true,
      status: "user eth send txn mined",
    };
  } catch (error) {
    return {
      success: false,
      status: "😥 " + error.message,
    };
  }
};

export const scheduleTxns = async (
  contractAddress,
  timeUTC,
  contractABI,
  methodName,
  walletAddress,
  numOfMints,
  costPerMint,
  rpcURL,
  chainID,
  userAccount,
  txHash
) => {
  try {
    const inputParameters = new Object();

    // create input JSON body
    const contractABIJSON = JSON.parse(contractABI);
    inputParameters.contractAddress = contractAddress;
    inputParameters.time = timeUTC;
    inputParameters.contractABIJSON = JSON.stringify(contractABIJSON);
    inputParameters.userPublicAddress = walletAddress;
    inputParameters.methodName = methodName;
    inputParameters.numOfMints = numOfMints;
    inputParameters.costPerMint = costPerMint;
    inputParameters.rpcURL = rpcURL;
    inputParameters.chainID = chainID;
    inputParameters.userMainTxnHash = txHash;
    inputParameters.userMainAcc = JSON.stringify(userAccount);

    userAccount = null;

    // send request to server
    var serverResponseSuccess = false;
    var serverResponseStatus = "";
    const { responseSuccess, responseMessage, responseCode } =
      await txnInputsToServer(inputParameters);
    console.log(
      "response message is " +
        responseMessage +
        " response code is " +
        responseCode
    );
    if (!responseSuccess) {
      serverResponseSuccess = false;
      serverResponseStatus =
        "Something went wrong while sending your txn, " +
        responseMessage.slice(0, 100);
    } else {
      if (responseCode != 200) {
        serverResponseSuccess = false;
        serverResponseStatus =
          "Something went wrong while scheduling your txn at backend, " +
          responseMessage.slice(0, 100);
      } else {
        serverResponseSuccess = true;
        serverResponseStatus = `Success, ${responseMessage}`;
      }
    }
    return {
      success: serverResponseSuccess,
      status: serverResponseStatus,
    };
  } catch (error) {
    return {
      success: false,
      status: "😥 " + error.message,
    };
  }
};

const getTxnReceipt = async (web3, txHash) => {
  var receipt = await web3.eth.getTransactionReceipt(txHash);
  console.log(receipt);
  return receipt;
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const obj = {
        status: "👆🏽 Write a message in the text-field above.",
        address: addressArray[0],
      };
      return obj;
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      ),
    };
  }
};

export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (addressArray.length > 0) {
        return {
          address: addressArray[0],
          status: "👆🏽 Write a message in the text-field above.",
        };
      } else {
        return {
          address: "",
          status: "🦊 Connect to Metamask using the top right button.",
        };
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      ),
    };
  }
};

export const checkCurrentChainId = async () => {
  if (window.ethereum) {
    try {
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      // if (currentChainId != targetNetworkId) {
      //   await window.ethereum.request({
      //     method: "wallet_switchEthereumChain",
      //     params: [{ chainId: targetNetworkId }],
      //   });
      // }

      return currentChainId;
    } catch (err) {
      return "none";
    }
  } else {
    return "none";
  }
};
