require("dotenv").config();

const DB_URI =
  "mongodb+srv://alpha-zero:UDoPac41XlFuZFKE@cluster0.aolxcqx.mongodb.net/?retryWrites=true&w=majority";
const PORT = 8000;
const ETH_MAINNET =
  "https://eth-mainnet.g.alchemy.com/v2/8XQRCLTYdnjXh2xUhba1Rt-k1Y5mVD0c";
const GOERLI_TESTNET =
  "https://eth-goerli.g.alchemy.com/v2/XbxHrL2ipAARaptUD4PycccoYnO-Zy3j";
const BINANCE_SMART_CHAIN = "https://bsc-dataseed.binance.org/";
const POLYGON_MAINNET =
  "https://polygon-mainnet.g.alchemy.com/v2/LfLbumM5LjohWKEA-eFAaThWJlrTiCb0";
const AVALANCHE_NETWORK = "https://api.avax.network/ext/bc/C/rpc";
const MUMBAI_TESTNET =
  "https://polygon-mumbai.g.alchemy.com/v2/ApW1c28OhCSdPvc-6rq9MBzsXDk84DL4";
const ROPSTEN_TESTNET =
  "https://ropsten.infura.io/v3/fe2690d3a01a44d6a273bba167960ae8";
const RINKEBY_TESTNET =
  "https://rinkeby.infura.io/v3/fe2690d3a01a44d6a273bba167960ae8";
const KOVAN_TESTNET =
  "https://kovan.infura.io/v3/fe2690d3a01a44d6a273bba167960ae8";

const CHAIN_MAP = new Map([
  ["0x5", GOERLI_TESTNET],
  ["0x1", ETH_MAINNET],
  //["0x38", BINANCE_SMART_CHAIN],
  ["0x89", POLYGON_MAINNET],
  //["0xa86a", AVALANCHE_NETWORK],
  ["0x13881", MUMBAI_TESTNET],
  ["0x3", ROPSTEN_TESTNET],
  ["0x4", RINKEBY_TESTNET],
  ["0x2a", KOVAN_TESTNET],
]);

module.exports = {
  PORT: process.env.PORT || PORT,
  DB_URI: DB_URI,
  ETH_MAINNET: process.env.ETH_MAINNET || ETH_MAINNET,
  GOERLI_TESTNET: GOERLI_TESTNET,
  BINANCE_SMART_CHAIN: BINANCE_SMART_CHAIN,
  POLYGON_MAINNET: POLYGON_MAINNET,
  AVALANCHE_NETWORK: AVALANCHE_NETWORK,
  MUMBAI_TESTNET: MUMBAI_TESTNET,
  ROPSTEN_TESTNET: ROPSTEN_TESTNET,
  RINKEBY_TESTNET: RINKEBY_TESTNET,
  KOVAN_TESTNET: KOVAN_TESTNET,
  CHAIN_MAP: CHAIN_MAP,
};
