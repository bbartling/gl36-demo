const NormalSdk = require("@normalframework/applications-sdk");

// From ASHRAE Guideline 36_2021, §5.6.8.2 Static Pressure Reset Requests

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
  const isInDamperLoop = Boolean(
    (await sdk.groupVariables.get("inDamperLoop")).latestValue.value
  );

  const setIsInDamperLoop = async (status) => {
    await sdk.groupVariables.write("inDamperLoop", status ? 1 : 0);
  };

  const logEvent = (message) => {
    console.log(message);
    sdk.event(message);
  };

  logEvent(
    `AirFlowSP ${AirFlowSetpoint.latestValue.value} | MeasuredAirflow ${MeasuredAirflow.latestValue.value} | DamperPos ${DamperPosition.latestValue.value}`
  );

  async function sendRequest(count) {
    logEvent(`Sending CLSRPREQ request for ${count}`);
    await sdk.groupVariables.write("CLSPREQ", count);
  }

  // Damper Loop
  if (
    isInDamperLoop &&
    DamperPosition.latestValue.value &&
    DamperPosition.latestValue.value > 85
  ) {
    await sendRequest(1);
    return;
  } else {
    await setIsInDamperLoop(false);
  }

  if (
    (await MeasuredAirflow.trueFor(
      "1m",
      (value) =>
        value.value != null &&
        Number(AirFlowSetpoint.latestValue.value) > 0 &&
        getPercentage(value.value, AirFlowSetpoint.latestValue.value) < 50
    )) &&
    (await DamperPosition.trueFor("1m", (v) => Number(v.value) > 95))
  ) {
    // If the measured airflow is less than 50% of setpoint while setpoint is greater than zero and the damper position is greater than 95% for 1 minute, send 3 requests.
    // send 3 requests
    await sendRequest(3);
  } else if (
    (await MeasuredAirflow.trueFor(
      "1m",
      (value) =>
        value.value != null &&
        Number(AirFlowSetpoint.latestValue.value) > 0 &&
        getPercentage(value.value, AirFlowSetpoint.latestValue.value) < 70
    )) &&
    (await DamperPosition.trueFor("1m", (v) => Number(v.value) > 95))
  ) {
    await sendRequest(2);
    // Else if the measured airflow is less than 70% of setpoint while setpoint is greater than zero and the damper position is greater than 95% for 1 minute, send 2 requests.
  } else if (Number(DamperPosition.latestValue.value) > 95) {
    // Else if the damper position is greater than 95%, send 1 request until the damper position is less than 85%.
    await setIsInDamperLoop(true);
    await sendRequest(1);
    // send 1 request
  } else if (Number(DamperPosition.latestValue.value) < 95) {
    await sendRequest(0);
    // else if the Cooling Loop is less than 95%, send 0 requests.
  }
};
