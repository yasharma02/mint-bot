const mongoose = require("mongoose");

const TxnDetailsSchema = new mongoose.Schema({
  contractAddress: {
    type: String,
    required: true,
  },
  contractABIJSON: {
    type: String,
    required: true,
  },
  userPublicAddress: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  methodName: {
    type: String,
    required: true,
  },
  rpcURL: {
    type: String,
    required: false,
  },
  chainID: {
    type: String,
    required: true,
  },
  numOfMints: {
    type: Number,
    required: true,
  },
  costPerMint: {
    type: Number,
    required: true,
  },
  accountsObject: {
    type: [String], // contains public and encrypted private keys of user main account and all new accounts created
    required: false,
  },
  ethToAccountsTransferReceiptObj: {
    type: [String], // from user main account to all new accounts created
    required: false,
  },
});

const TxnDetailsModel = mongoose.model("TxnDetails", TxnDetailsSchema);

module.exports = { TxnDetailsModel };
