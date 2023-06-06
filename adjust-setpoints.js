const NormalSdk = require("@normalframework/applications-sdk");

// adds all requests and sets a variable that represents total of all requests

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, sdk, update }) => {
  console.log("========== adjust setpoint points =======", points);
};
