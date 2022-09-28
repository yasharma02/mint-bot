export const checkInputs = (
  contractAddress,
  time,
  contractABI,
  methodName,
  numOfMints,
  costPerMint,
  rpcURL
) => {
  try {
    console.log(time);
    if (
      contractAddress.trim() == "" ||
      time.trim() == "" ||
      contractABI.trim() == "" ||
      methodName.trim() == "" ||
      numOfMints.trim() == "" ||
      costPerMint.trim() == "" ||
      time == "Invalid Date"
    ) {
      return {
        validationSuccess: false,
        validationStatus: "Please make sure all fields are completed",
      };
    }

    if (!document.getElementById("rpcURL").disabled && rpcURL.trim() == "") {
      return {
        validationSuccess: false,
        validationStatus: "RPC URL required since chain is unknown",
      };
    }

    if (numOfMints < 1 || costPerMint < 0) {
      return {
        validationSuccess: false,
        validationStatus:
          "Please make sure numOfMints >= 1 and costPerMint >= 0",
      };
    }
  } catch (error) {
    return {
      validationSuccess: false,
      validationStatus: "Unexpected error: " + error.message,
    };
  }

  return {
    validationSuccess: true,
    validationStatus: "Nailed it!",
  };
};
