//require("dotenv").config();
const config = require("./config.js");
const apiURL = config.API_URL;
const axios = require("axios");

// call server post api
export const txnInputsToServer = async (JSONBody) => {
  const url = apiURL;
  try {
    const response = await axios.post(url, JSONBody);
    return {
      responseSuccess: true,
      responseMessage: response.data.message,
      responseCode: response.data.code,
    };
  } catch (error) {
    console.log(error);
    return {
      responseSuccess: false,
      responseMessage: error.message,
      responseCode: "null",
    };
  }
};
