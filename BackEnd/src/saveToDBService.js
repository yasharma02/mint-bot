const { connectDB } = require("./utils/connectDB.js");

const { TxnDetailsModel } = require("./models/txnDetails.js");

const saveTxnToDB = async (
  contractAddress,
  contractABIJSON,
  userPublicAddress,
  txnTime,
  methodName,
  numOfMints,
  costPerMint,
  userMainAccPubAddress,
  userMainAcc,
  rpcURL,
  chainID
) => {
  const res = new Object();
  res.success = false;
  res.message = "";

  try {
    const conn = await connectDB();
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await TxnDetailsModel.create({
      contractAddress: contractAddress,
      contractABIJSON: contractABIJSON,
      userPublicAddress: userPublicAddress,
      time: txnTime,
      methodName: methodName,
      numOfMints: Number(numOfMints),
      costPerMint: Number(costPerMint),
      userMainAccPubAddress: userMainAccPubAddress,
      userMainAcc: userMainAcc,
      rpcURL: rpcURL,
      chainID: chainID,
    });
  } catch (error) {
    res.success = false;
    res.message = error.message;
    return res;
  }
  res.success = true;
  res.message = "Saved to database";
  return res;
};

module.exports = { saveTxnToDB };
