const express = require("express");
const { PORT } = require("./utils/config.js");
const { saveTxnToDB } = require("./saveToDBService");
const { getDate } = require("./utils/helper.js");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/txn/schedule", (req, res) => {
  const body = req.body;
  const txnTime = getDate(body.time);
  saveTxnToDB(
    body.contractAddress,
    body.contractABIJSON,
    body.userPublicAddress,
    txnTime,
    body.methodName,
    body.numOfMints,
    body.costPerMint,
    body.userMainAccPubAddress,
    body.userMainAcc,
    body.rpcURL,
    body.chainID
  ).then((resp) => {
    console.log(resp);
    if (resp.success) {
      return res.json({
        message: resp.message,
        success: resp.success,
        code: "200",
      });
    } else {
      return res.json({
        message: resp.message,
        success: resp.success,
        code: "500",
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`App Started on port ${PORT}`);
});
