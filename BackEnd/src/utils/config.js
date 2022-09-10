require("dotenv").config();

const DB_URI =
  "mongodb+srv://alpha-zero:UDoPac41XlFuZFKE@cluster0.aolxcqx.mongodb.net/?retryWrites=true&w=majority";
const PORT = 8000;
const ALCHEMY_NODE_MAINNET =
  "https://eth-mainnet.g.alchemy.com/v2/8XQRCLTYdnjXh2xUhba1Rt-k1Y5mVD0c";
const ALCHEMY_NODE_GOERLI =
  "https://eth-goerli.g.alchemy.com/v2/XbxHrL2ipAARaptUD4PycccoYnO-Zy3j";
const BINANCE_SMART_CHAIN = "https://bsc-dataseed.binance.org/";
const Polygon_Mainnet = "https://polygon-rpc.com/";
const Avalanche_Network = "https://api.avax.network/ext/bc/C/rpc";
const Mumbai_Testnet =
  "https://polygon-mumbai.g.alchemy.com/v2/ApW1c28OhCSdPvc-6rq9MBzsXDk84DL4";
const Ropsten_Test_Network = "https://ropsten.infura.io/v3/";
const Rinkeby_Test_Network = "https://rinkeby.infura.io/v3/";
const Kovan_Test_Network = "https://kovan.infura.io/v3/";

module.exports = {
  PORT: process.env.PORT || PORT,
  DB_URI: DB_URI,
  ALCHEMY_NODE_MAINNET:
    process.env.ALCHEMY_NODE_MAINNET || ALCHEMY_NODE_MAINNET,
  ALCHEMY_NODE_GOERLI: ALCHEMY_NODE_GOERLI,
  BINANCE_SMART_CHAIN: BINANCE_SMART_CHAIN,
  Polygon_Mainnet: Polygon_Mainnet,
  Avalanche_Network: Avalanche_Network,
  Mumbai_Testnet: Mumbai_Testnet,
  Ropsten_Test_Network: Ropsten_Test_Network,
  Rinkeby_Test_Network: Rinkeby_Test_Network,
  Kovan_Test_Network: Kovan_Test_Network,
};
