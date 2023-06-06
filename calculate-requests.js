const NormalSdk = require("@normalframework/applications-sdk");

// adds all requests and sets a variable that represents total of all requests

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, sdk, update }) => {
  const totalRequests = points.reduce(
    (acc, curr) => acc + Number(curr.latestValue.value),
    0
  );

  await sdk.groupVariables.write("SUMCLREQ", totalRequests);
};
