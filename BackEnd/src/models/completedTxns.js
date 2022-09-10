const mongoose = require("mongoose");

const CompletedTxnSchema = new mongoose.Schema({
  ethToAccountsTransferReceiptObj: {
    type: [String], // from user main account to all new accounts created
    required: true,
  },
  ethFromAccountsTransferReceiptObj: {
    type: [String], // from user main account and all new accounts created to user public address
    required: true,
  },
  txnExecutionReceiptObj: {
    type: [String], // for mint txn execution from all new accounts created to contract address
    required: true,
  },
  nftFromAccountsTransferReceiptObj: {
    type: [String], // for nft transfer from all new accounts created to user public address
    required: true,
  },
  accountsObject: {
    type: [String], // contains public and encrypted private keys of user main account and all new accounts created
    required: true,
  },
  userPublicAddress: {
    type: String,
    required: true,
  },
  contractAddress: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
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
});

const CompletedTxnsModel = mongoose.model(
  "CompletedTxnDetails",
  CompletedTxnSchema
);

module.exports = { CompletedTxnsModel };
