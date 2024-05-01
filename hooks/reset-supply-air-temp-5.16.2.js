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
  
  points.forEach(p => {
    if(p.latestValue.value < 0) {
      sdk.logEvent("Negative value")
      sdk.logEvent(JSON.stringify({uuid: p.uuid, attrs: p.attrs}))
    }
  })
  const values = points.map((x) => x.latestValue.value ?? 0);
  sdk.logEvent(sdk.groupKey)
  sdk.logEvent(values.join(","));
  const requests = values.reduce((a, b) => a + b, 0);
  console.log(sdk.groupKey || "<empty>", requests);

  const RequestVariable = groupVariables.byLabel("Total SAT Requests");
  await RequestVariable.write(requests);
  return {result: "success", message: `Request Total: ${requests}`}
};
