
module.exports = function() {
  console.log("WARNING: All mldb functions are asynchronous. Like they should be in node.js baby. If you need to ensure your code runs after this mldb call, then pass in a callback.");
};
