import { useEffect, useState } from "react";
import {
  connectWallet,
  getCurrentWalletConnected,
  scheduleTxns,
  checkCurrentChainId,
  inputOperations,
  createUserMainAccount,
  requestFunds,
  awaitConfirmation,
} from "./utils/service";
const Web3 = require("web3");

const ScheduleTxn = (props) => {
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [chainStatus, setChainStatus] = useState("");
  const chainMap = new Map([
    ["0x5", "GOERLI_TESTNET"],
    ["0x1", "ETH_MAINNET"],
    //["0x38", "BINANCE_SMART_CHAIN"],
    ["0x89", "POLYGON_MAINNET"],
    //["0xa86a", "AVALANCHE_NETWORK"],
    ["0x13881", "MUMBAI_TESTNET"],
    ["0x3", "ROPSTEN_TESTNET"],
    ["0x4", "RINKEBY_TESTNET"],
    ["0x2a", "KOVAN_TESTNET"],
  ]);

  const [contractAddress, setContractAddress] = useState("");
  const [rpcURL, setRPCURL] = useState("");
  const [contractABI, setContractABI] = useState("");
  const [time, setTime] = useState("");
  const [methodName, setMethodName] = useState("");
  const [numOfMints, setNumOfMints] = useState(0);
  const [costPerMint, setCostPerMint] = useState(0);
  const gasPerMint = 0.005;

  useEffect(() => {
    async function fetchData() {
      const { address, status } = await getCurrentWalletConnected();
      // check chain id
      const chainId = await checkCurrentChainId();
      var chainStatusString;
      if (chainMap.has(chainId)) {
        chainStatusString = `Chain: ${chainMap.get(
          chainId
        )} | ChainId: ${chainId}`;
        document.getElementById("rpcURL").disabled = true;
        setRPCURL("");
      } else {
        chainStatusString = `Chain: Unknown chain | ChainId: ${chainId}`;
        document.getElementById("rpcURL").disabled = false;
      }
      setChainStatus(chainStatusString);

      setWallet(address);
      setStatus(status);

      addWalletListener();
      addChainListener();
    }
    fetchData();
  }, []);

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("👆🏽 Write a message in the text-field above.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    } else {
      setStatus(
        <p>
          {" "}
          🦊{" "}
          <a target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
    }
  }

  function addChainListener() {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", (chainId) => {
        var chainStatusString;
        if (chainMap.has(chainId)) {
          chainStatusString = `Chain: ${chainMap.get(
            chainId
          )} | ChainId: ${chainId}`;
          document.getElementById("rpcURL").disabled = true;
          setRPCURL("");
        } else {
          chainStatusString = `Chain: Unknown chain | ChainId: ${chainId}`;
          document.getElementById("rpcURL").disabled = false;
        }
        setChainStatus(chainStatusString);
      });
    }
  }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const onSchedulePressed = async () => {
    document.getElementById("scheduleButton").disabled = true;
    const timeUTC = new Date(time).toUTCString();

    if (walletAddress != "" && window.ethereum) {
      const web3 = new Web3(window.ethereum);

      const inputOpsResult = inputOperations(
        contractAddress,
        time,
        contractABI,
        methodName,
        numOfMints,
        costPerMint,
        rpcURL,
        chainStatus
      );
      setStatus(inputOpsResult.status);
      console.log(inputOpsResult.success);

      if (inputOpsResult.success) {
        const createAccResult = createUserMainAccount(web3);
        setStatus(createAccResult.status);
        console.log(createAccResult.success);

        if (createAccResult.success) {
          const requestFundsResult = await requestFunds(
            numOfMints,
            costPerMint,
            contractAddress,
            createAccResult.userAccount,
            contractABI,
            methodName,
            walletAddress,
            web3
          );
          setStatus(requestFundsResult.status);
          console.log(requestFundsResult.success);

          if (requestFundsResult.success) {
            setStatus("Waiting for user eth transfer txn to get mined");
            const confirmResult = await awaitConfirmation(
              requestFundsResult.txHash,
              web3
            );
            setStatus(confirmResult.status);
            console.log(confirmResult.success);

            if (confirmResult.success) {
              const scheduleResult = await scheduleTxns(
                contractAddress,
                timeUTC,
                contractABI,
                methodName,
                walletAddress,
                numOfMints,
                costPerMint,
                rpcURL,
                inputOpsResult.chainID,
                createAccResult.userAccount,
                requestFundsResult.txHash
              );
              setStatus(scheduleResult.status);
              console.log(scheduleResult.success);

              if (scheduleResult.success) {
                // setContractAddress("");
                // setContractABI("");
                // setMethodName("");
                // setTime("");
                // setNumOfMints(0);
                // setCostPerMint(0);
                // setRPCURL("");
                document.getElementById("contractAddress").value = "";
                document.getElementById("dateTime").value = "";
                document.getElementById("contractABI").value = "";
                document.getElementById("methodDefinition").value = "";
                document.getElementById("numMints").value = 0;
                document.getElementById("costMint").value = 0;
                document.getElementById("rpcURL").value = "";
              }
            }
          }
        }
      }
    } else {
      setStatus(
        "Please make sure Metamask is installed and ethereum wallet is connected"
      );
    }
    console.log("end");
    document.getElementById("scheduleButton").disabled = false;
  };

  return (
    <div className="ScheduleTxn">
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      <p id="chainStatus" style={{ color: "red" }}>
        {chainStatus}
      </p>

      <br></br>
      <h1 id="title">🧙‍♂️ NFT Mint Bot</h1>
      <p>
        Input the following txn parameters then press "Schedule" to schedule
        your NFT Mint.
      </p>
      <form>
        <h2>🖼 Contract Address: </h2>
        <input
          type="text"
          id="contractAddress"
          placeholder="Address of the contract you wish to interact with."
          onChange={(event) => setContractAddress(event.target.value)}
        />
        <h2>🤔 Txn Schedule Time (Local Time): </h2>
        <input
          type="datetime-local"
          id="dateTime"
          // placeholder="UTC Timezone (YYYY-MM-DDTHH:mm:ssZ) ex: 2020-04-10T10:20:30Z"
          onChange={(event) => setTime(event.target.value)}
        />
        <h2>✍️ Contract ABI: </h2>
        <input
          type="text"
          id="contractABI"
          placeholder="Contract address on etherscan -> Search Contract ABI under Contract section"
          onChange={(event) => setContractABI(event.target.value)}
        />
        <h2>🥸 Method definition of function you wish to call: </h2>
        <input
          type="text"
          id="methodDefinition"
          placeholder="e.g. mint(uint256)"
          onChange={(event) => setMethodName(event.target.value)}
        />
        <h2>🫵🏻 Number of mints you want to schedule: </h2>
        <input
          type="number"
          id="numMints"
          step="1"
          placeholder="e.g. 5"
          min="1"
          onChange={(event) => setNumOfMints(event.target.value)}
        />
        <h2>💰 Cost per mint in ETH: </h2>
        <input
          type="number"
          id="costMint"
          step="any"
          min="0.01"
          placeholder="e.g. 0.1"
          onChange={(event) => setCostPerMint(event.target.value)}
        />
        <p id="totalCostStatus" style={{ color: "green" }}>
          Total cost: {numOfMints * costPerMint} ETH + Gas
        </p>
        <h2>🐼 RPC URL (required when chain unknown) : </h2>
        <input
          type="text"
          id="rpcURL"
          placeholder="enabled when chain unknown"
          onChange={(event) => setRPCURL(event.target.value)}
        />
      </form>
      <button id="scheduleButton" onClick={onSchedulePressed}>
        Schedule
      </button>
      <p id="status" style={{ color: "red" }}>
        {status}
      </p>
    </div>
  );
};

export default ScheduleTxn;
