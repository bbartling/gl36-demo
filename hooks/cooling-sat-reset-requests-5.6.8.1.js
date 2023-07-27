const NormalSdk = require("@normalframework/applications-sdk");

// From ASHRAE Guideline 36_2021, §5.6.8.1 Cooling SAT Reset Requests

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, sdk }) => {
  const ZoneTemperature = points.byLabel("").first();
  const ZoneTemperatureSetpoint = points.byLabel("").first();
  const CoolingLoop = points.byLabel("").first();

  if (
    await ZoneTemperature.trueFor(
      "2m",
      () =>
        ZoneTemperatureSetpoint.latestValue.value >
        ZoneTemperatureSetpoint.latestValue.value + 5
    )
  ) {
    // send 3 requests
  } else if (
    await ZoneTemperature.trueFor(
      "2m",
      () =>
        ZoneTemperatureSetpoint.latestValue.value >
        ZoneTemperatureSetpoint.latestValue.value + 5
    )
  ) {
    // send 2 requests
  } else if (CoolingLoop.latestValue.value > 95) {
    //Else if the Cooling Loop is greater than 95%, send 1 request until the Cooling Loop is less than 85%
  } else if (CoolingLoop.latestValue.value < 95) {
    // else if the Cooling Loop is less than 95%, send 0 requests.
  }
};

// Questions:
// ZoneTemperature.lt(ZoneTemperatureSetpoint.value + 3, 5m)
// Suppression - how do?
// How to calculate and set the cooling loop value?
