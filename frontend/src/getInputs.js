import { useEffect, useState } from "react";
import {
  connectWallet,
  getCurrentWalletConnected,
  scheduleTxns,
  checkCurrentChainId,
} from "./utils/service";

const ScheduleTxn = (props) => {
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [chainStatus, setChainStatus] = useState("");
  const chainMap = new Map([
    ["0x5", "Goerli Testnet"],
    ["0x1", "Ethereum mainnet"],
    ["0x38", "BINANCE_SMART_CHAIN"],
    ["0x89", "Polygon_Mainnet"],
    ["0xa86a", "Avalanche_Network"],
    ["0x13881", "Mumbai_Testnet"],
    ["0x3", "Ropsten_Test_Network"],
    ["0x4", "Rinkeby_Test_Network"],
    ["0x2a", "Kovan_Test_Network"],
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
    const { success, status } = await scheduleTxns(
      contractAddress,
      timeUTC,
      contractABI,
      methodName,
      walletAddress,
      numOfMints,
      costPerMint,
      gasPerMint,
      rpcURL,
      chainStatus
    );
    setStatus(status);
    if (success) {
      setContractAddress("");
      setContractABI("");
      setMethodName("");
      setTime("");
      setNumOfMints(0);
      setCostPerMint(0);
      setRPCURL("");
    }
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
          placeholder="Address of the contract you wish to interact with."
          onChange={(event) => setContractAddress(event.target.value)}
        />
        <h2>🤔 Txn Schedule Time (Local Time): </h2>
        <input
          type="datetime-local"
          // placeholder="UTC Timezone (YYYY-MM-DDTHH:mm:ssZ) ex: 2020-04-10T10:20:30Z"
          onChange={(event) => setTime(event.target.value)}
        />
        <h2>✍️ Contract ABI: </h2>
        <input
          type="text"
          placeholder="Contract address on etherscan -> Search Contract ABI under Contract section"
          onChange={(event) => setContractABI(event.target.value)}
        />
        <h2>🥸 Method definition of function you wish to call: </h2>
        <input
          type="text"
          placeholder="e.g. mint(uint256)"
          onChange={(event) => setMethodName(event.target.value)}
        />
        <h2>🫵🏻 Number of mints you want to schedule: </h2>
        <input
          type="number"
          step="1"
          placeholder="e.g. 5"
          min="1"
          onChange={(event) => setNumOfMints(event.target.value)}
        />
        <h2>💰 Cost per mint in ETH: </h2>
        <input
          type="number"
          step="any"
          min="0.01"
          placeholder="e.g. 0.1"
          onChange={(event) => setCostPerMint(event.target.value)}
        />
        <p id="totalCostStatus" style={{ color: "green" }}>
          Total cost: {numOfMints * costPerMint} ETH + Gas (
          {gasPerMint * numOfMints} ETH)
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
