const NormalSdk = require("@normalframework/applications-sdk");
const { trimAndRespond } = NormalSdk;

// From ASHRAE Guideline 36_2021, §5.16.2 Supply Air Temperature Control
// See also: 5.1.14. Trim & Respond Set-Point Reset Logic

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points }) => {
  const allRequests = points.reduce(
    (acc, point) => (point.latestValue.value ?? 0) + acc,
    0
  );
  const SP0 = points.byLabel("sp-initial-setpoint-class").first()
    .latestValue.value;
  const Td = "2m";
  const systemStatus = points.byLabel("system-status-class").first();
  const Setpoint = points.byLabel("sp-setpoint-class").first();

  const resetToInitial = await systemStatus.ifOnce("off");
  const runTandRLoop = await systemStatus.trueFor(
    Td,
    (v) => v.valueString === "on"
  );

  // await trimAndRespond({
  //   I: 5,
  //   R: allRequests,
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
