const NormalSdk = require("@normalframework/applications-sdk");

// From ASHRAE Guideline 36_2021, §5.6.8.1 Cooling SAT Reset Requests

// a. If the zone temperature exceeds the zone’s cooling setpoint by 3°C (5°F)
//      for 2 minutes and after suppression period due to setpoint change per Section 5.1.20, send 3 requests.

// b. Else if the zone temperature exceeds the zone’s cooling setpoint by 2°C (3°F) for 2 minutes
//      and after suppression period due to setpoint change per Section 5.1.20, send 2 requests.

// c. Else if the Cooling Loop is greater than 95%, send 1 request until the Cooling Loop is less than 85%.

// d. Else if the Cooling Loop is less than 95%, send 0 requests.

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, sdk }) => {
  const ZoneTemperature = points.byLabel("zone-air-temp-sensor").first();
  const ZoneTemperatureSetpoint = points
    .byLabel("zone-air-temp-occ-cooling-sp")
    .first();
  const CoolingLoop = points.byLabel("cooling-loop-class").first();
  const suppressionPt = points
    .where(
      (p) =>
        p.attrs.label === "SUPPRESSED_UNTIL" &&
        p.attrs.equipRef === sdk.groupKey
    )
    .first();

  async function sendRequest(count) {
    logEvent(`Sending Cooling_SAT_Requests request for ${count}`);
    await sdk.groupVariables.write("Cooling_SAT_Requests", count);
  }

  const isSuppressed =
    suppressionPt?.latestValue?.value != null &&
    new Date(suppressionPt.latestValue.value) > new Date();

  // TODO: check for celcius or fahrenheit
  if (
    !isSuppressed &&
    ZoneTemperatureSetpoint?.latestValue?.value(
      await ZoneTemperature.trueFor(
        "2m",
        (v) => v.value > ZoneTemperatureSetpoint.latestValue.value + 5
      )
    )
  ) {
    await sendRequest(3);
  } else if (
    !isSuppressed &&
    ZoneTemperatureSetpoint?.latestValue?.value(
      await ZoneTemperature.trueFor(
        "2m",
        (v) => v.value > ZoneTemperatureSetpoint.latestValue.value + 3
      )
    )
  ) {
    await sendRequest(2);
  } else if (CoolingLoop.latestValue.value > 95) {
    await sendRequest(1);
    //Else if the Cooling Loop is greater than 95%, send 1 request until the Cooling Loop is less than 85%
  } else if (CoolingLoop.latestValue.value < 95) {
    await sendRequest(0);
    // else if the Cooling Loop is less than 95%, send 0 requests.
  }
};

// Questions:
// ZoneTemperature.lt(ZoneTemperatureSetpoint.value + 3, 5m)
// Suppression - how do?
// How to calculate and set the cooling loop value?
