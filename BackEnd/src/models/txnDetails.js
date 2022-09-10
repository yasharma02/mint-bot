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
    required: true,
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
  userMainAccPubAddress: {
    type: String,
    required: true,
  },
  userMainAcc: {
    type: String,
    required: true,
  },
});

const TxnDetailsModel = mongoose.model("TxnDetails", TxnDetailsSchema);

module.exports = { TxnDetailsModel };
