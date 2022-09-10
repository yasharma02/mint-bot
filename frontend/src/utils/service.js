import { txnInputsToServer } from "./sendRequests.js";
import { checkInputs } from "./helper";
const Web3 = require("web3");

export const scheduleTxns = async (
  contractAddress,
  time,
  contractABI,
  methodName,
  walletAddress,
  numOfMints,
  costPerMint,
  gasPerMint,
  rpcURL,
  chainStatus
) => {
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
    };
  }

  const inputParameters = new Object();
  // check if wallet connected and metamask rpc available
  if (walletAddress != "" && window.ethereum) {
    try {
      window.web3 = new Web3(window.ethereum);
      const contractABIJSON = JSON.parse(contractABI);

      // create new account
      var userMainAccount = window.web3.eth.accounts.create();

      // transfer user funds
      // can try to make gas computation more precise with estimateGas and getGasPrice
      const totalFunds = numOfMints * costPerMint + numOfMints * gasPerMint; // hardcoded total gas required per mint
      const transactionParameters = {
        to: userMainAccount.address,
        from: window.ethereum.selectedAddress, // must match user's active address
        gasPrice: window.web3.utils.toHex(
          window.web3.utils.toWei("10", "gwei")
        ),
        gas: window.web3.utils.toHex(21000),
        value: window.web3.utils.toHex(
          window.web3.utils.toWei(`${totalFunds}`, "ether")
        ),
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });
      console.log("Txn Hash is " + txHash);

      // create input JSON body
      inputParameters.contractAddress = contractAddress;
      inputParameters.time = time;
      inputParameters.contractABIJSON = JSON.stringify(contractABIJSON);
      inputParameters.userPublicAddress = walletAddress;
      inputParameters.methodName = methodName;
      inputParameters.numOfMints = numOfMints;
      inputParameters.costPerMint = costPerMint;
      inputParameters.rpcURL = rpcURL;
      inputParameters.chainID = chainID;
      inputParameters.userMainAccPubAddress = userMainAccount.address;
      inputParameters.userMainAcc = JSON.stringify(userMainAccount);

      userMainAccount = null;
    } catch (error) {
      return {
        success: false,
        status: "😥 " + error.message,
      };
    }
  } else {
    return {
      success: false,
      status:
        "Please make sure Metamask is installed and ethereum wallet is connected",
    };
  }

  // send request to server
  const { responseSuccess, responseMessage, responseCode } =
    await txnInputsToServer(inputParameters);
  console.log(
    "response message is " +
      responseMessage +
      " response code is " +
      responseCode
  );
  if (!responseSuccess) {
    return {
      success: false,
      status:
        "Something went wrong while sending your txn, " +
        responseMessage.slice(0, 100),
    };
  } else {
    if (responseCode != 200) {
      return {
        success: false,
        status:
          "Something went wrong while scheduling your txn at backend, " +
          responseMessage.slice(0, 100),
      };
    } else {
      return {
        success: true,
        status: `Success, ${responseMessage}`,
      };
    }
  }
};

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
