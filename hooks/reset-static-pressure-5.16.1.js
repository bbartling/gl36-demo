const NormalSdk = require("@normalframework/applications-sdk");
const { trimAndRespond } = NormalSdk;

// From ASHRAE Guideline 36_2021, §5.16.1.2 Static Pressure Set-Point Reset
// See also: 5.1.14. Trim & Respond Set-Point Reset Logic

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, groupVariables, sdk }) => {
  console.log(points.map((x) => x.latestValue.value));
  const requests = points
    .byLabel("Cooling_SP_Requests")
    .map((x) => x.latestValue.value)
    .reduce((a, b) => a + b, 0);
  console.log(sdk.groupKey, requests);

  const RequestVariable = groupVariables.byLabel("Total SP Requests");
  console.log(RequestVariable);
  await RequestVariable.write(requests);
};
