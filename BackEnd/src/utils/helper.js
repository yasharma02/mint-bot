const getDate = (dateString) => {
  const txnTimeUTC = new Date(dateString);
  console.log(txnTimeUTC.toString());
  const txnTimeLocal = new Date(txnTimeUTC.toString());
  return txnTimeLocal;
};

module.exports = { getDate };
