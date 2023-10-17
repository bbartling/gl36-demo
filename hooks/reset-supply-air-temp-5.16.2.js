const NormalSdk = require("@normalframework/applications-sdk");
const { trimAndRespond } = NormalSdk;

// From ASHRAE Guideline 36_2021, §5.16.2 Supply Air Temperature Control
// See also: 5.1.14. Trim & Respond Set-Point Reset Logic

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, sdk, groupVariables }) => {
  const values = points.map((x) => x.latestValue.value ?? 0);
  console.log(values);
  const requests = values.reduce((a, b) => a + b, 0);
  console.log(sdk.groupKey, requests);

  const RequestVariable = groupVariables.byLabel("Total SAT Requests");
  await RequestVariable.write(requests);
};
