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

  const RequestVariable = groupVariables.find(
    (v) => v.attrs.label === "Total Requests"
  );

  await RequestVariable.write(requests);
  // TODO: enable below when ready to implement resets

  // const SP0 = points.byLabel("some-setpoint-class").first().latestValue.value;
  // const Td = "2m";
  // const systemStatus = points.byLabel("system-status-class").first();
  // const Setpoint = points.byLabel("").first();

  // const resetToInitial = await systemStatus.ifOnce("off");
  // const runTandRLoop = await systemStatus.trueFor(
  //   Td,
  //   (v) => v.valueString === "on"
  // );

  // await trimAndRespond({
  //   I: 5,
  //   R: 10,
  //   SPtrim: -1,
  //   SPResMax: 4,
  //   SP0,
  //   SPmin: 0,
  //   SPmax: 20,
  //   Setpoint,
  //   SPres: 2,
  //   resetToInitial,
  //   runTandRLoop,
  // });
};
