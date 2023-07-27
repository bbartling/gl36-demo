const NormalSdk = require("@normalframework/applications-sdk");

// From ASHRAE Guideline 36_2021, §5.6.8.2 Static Pressure Reset Requests

let isInDamperLoop = false;

const getPercentage = (numerator, denominator) => {
  return (numerator / denominator) * 100;
};

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, sdk }) => {
  const AirFlowSetpoint = points.byLabel("air-flow-sp").first(); // Desired Airflow
  const MeasuredAirflow = points.byLabel("discharge-air-flow-sensor").first(); // VAV Airflow
  const DamperPosition = points.byLabel("damper-sensor").first(); // Damper Position

  sdk.event(
    `AirFlowSP ${AirFlowSetpoint.latestValue.value} | MeasuredAirflow ${MeasuredAirflow.latestValue.value} | DamperPos ${DamperPosition.latestValue.value}`
  );

  async function sendRequest(count) {
    sdk.event(`Sending CLSRPREQ request for ${count}`);
    await sdk.groupVariables.write("CLSPREQ", count);
  }

  if (isInDamperLoop && DamperPosition.latestValue.value > 85) {
    await sendRequest(1);
    return;
  }

  if (
    (await MeasuredAirflow.trueFor(
      "1m",
      (value) => {
        return (
          getPercentage(value.value ?? 0, AirFlowSetpoint.latestValue.value) <
          50
        );
      },
      "hpl:bacnet:1"
    )) &&
    (await DamperPosition.trueFor("1m", (v) => v.value > 95, "hpl:bacnet:1"))
  ) {
    await sendRequest(3);
    // If the measured airflow is less than 50% of setpoint while setpoint is greater than zero and the damper position is greater than 95% for 1 minute, send 3 requests.
    // send 3 requests
  } else if (
    (await MeasuredAirflow.trueFor(
      "1m",
      (value) => {
        return (
          AirFlowSetpoint.latestValue.value > 0 &&
          value.value <
            MeasuredAirflow.latestValue.value /
              AirFlowSetpoint.latestValue.value <
            70
        );
      },
      "hpl:bacnet:1"
    )) &&
    (await DamperPosition.trueFor("1m", (v) => v.value > 95), "hpl:bacnet:1")
  ) {
    await sendRequest(2);
    // Else if the measured airflow is less than 70% of setpoint while setpoint is greater than zero and the damper position is greater than 95% for 1 minute, send 2 requests.
  } else if (DamperPosition.latestValue.value > 95) {
    // Else if the damper position is greater than 95%, send 1 request until the damper position is less than 85%.
    await sendRequest(1);
    // send 1 request
  } else if (DamperPosition.latestValue.value < 95) {
    await sendRequest(0);
    // else if the Cooling Loop is less than 95%, send 0 requests.
  }
};

// Questions:
// ZoneTemperature.lt(ZoneTemperatureSetpoint.value + 3, 5m)
// Suppression - how do?
// How to calculate and set the cooling loop value?
// Is in damper loop needs to persist - should we make a automation variable? Or maybe leverage the database?
