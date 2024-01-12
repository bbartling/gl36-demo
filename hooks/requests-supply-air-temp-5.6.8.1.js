const NormalSdk = require("@normalframework/applications-sdk");

const limit = (value, min, max) => {
  if (value > max) return max;
  if (value < min) return min;
  return value;
};

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
module.exports = async ({ points, sdk, groupVariables }) => {
  const logEvent = async (message) => {
    console.log(message);
    await sdk.event(message);
  };

  const CoolingBackOff = groupVariables.byLabel("CoolingLoopBackOff");
  const isInCoolingBackOffLoop = Boolean(CoolingBackOff.latestValue?.value);

  const setIsInCoolingBackOffLoop = async (status) => {
    await CoolingBackOff.write(status ? 1 : 0);
  };

  const ZoneTemperature = points.byLabel("zone-air-temp-sensor").first();
  const ZoneTemperatureSetpoint = points
    .byLabel("zone-air-temp-occ-cooling-sp")
    .first();
  const CoolingLoop = points.byLabel("cool-cmd").first();

  if (!ZoneTemperature || !ZoneTemperatureSetpoint || !CoolingLoop) {
    console.log(
      `Missing required points. Group: ${
        sdk.groupKey
      } ${!!ZoneTemperature} ${!!ZoneTemperatureSetpoint} ${!!CoolingLoop}`
    );
    return {
      result: "error",
      message: `Missing required points. Group: ${
        sdk.groupKey
      } ${!!ZoneTemperature} ${!!ZoneTemperatureSetpoint} ${!!CoolingLoop}`,
    };
  }

  console.log(CoolingLoop.changeTime, CoolingLoop.latestValue.ts);
  console.log(
    ZoneTemperatureSetpoint.changeTime,
    ZoneTemperatureSetpoint.latestValue.ts
  );

  async function sendRequest(count) {
    logEvent(`Sending Cooling_SAT_Requests request for ${count}`);
    await groupVariables.byLabel("Cooling_SAT_Requests").write(count);
  }

  // handle the inner loop created by condition (c) from 5.6.8.1
  if (isInCoolingBackOffLoop) {
    if (CoolingLoop.latestValue?.value && CoolingLoop.latestValue.value < 85) {
      await setIsInCoolingBackOffLoop(false);
    } else {
      await sendRequest(1);
      return {
        result: "success",
        message: "Sent 1 request. Staying in CoolingLoop Back Off.",
      };
    }
  }

  const getSuppressedUntilTime = () => {
    // how long should it be suppressed
    const supressionMinutes = limit(
      Math.abs(
        ZoneTemperatureSetpoint.latestValue.value -
          ZoneTemperatureSetpoint.latestValue.value
      ) * 5,
      0,
      30
    );
    return new Date().getTime() + supressionMinutes * 60 * 1000;
  };

  const suppressedUntil = getSuppressedUntilTime() ?? 0;

  if (ZoneTemperatureSetpoint.isChanged()) {
    await logEvent(
      `zone temperature is changed. Writing suppression time ${new Date(
        suppressedUntil
      ).toISOString()} minutes`
    );
    await groupVariables.byLabel("SuppressedUntilTime").write(suppressedUntil);
    return;
  } else if (suppressedUntil > new Date().getTime()) {
    await logEvent("is suppressed");
    return;
  }

  await logEvent("Not suppressed. Proceeding to calculate requests.");

  if (
    ZoneTemperatureSetpoint?.latestValue?.value &&
    (await ZoneTemperature.trueFor(
      "2m",
      (v) => v.value > ZoneTemperatureSetpoint.latestValue.value + 5
    ))
  ) {
    await sendRequest(3);
    return { result: "success", message: "Sent 3 requests" };
  } else if (
    ZoneTemperatureSetpoint?.latestValue?.value &&
    (await ZoneTemperature.trueFor(
      "2m",
      (v) => v.value > ZoneTemperatureSetpoint.latestValue.value + 3
    ))
  ) {
    await sendRequest(2);
    return { result: "success", message: "Sent 2 requests" };
  } else if (
    CoolingLoop.latestValue?.value &&
    CoolingLoop.latestValue.value > 95
  ) {
    await sendRequest(1);
    return {
      result: "success",
      message: "Sent 1 request. Entering Damper Position Loop.",
    };
  } else if (
    CoolingLoop.latestValue?.value &&
    CoolingLoop.latestValue.value < 95
  ) {
    await sendRequest(0);
    return { result: "success", message: "Send 0 requests" };

    // else if the Cooling Loop is less than 95%, send 0 requests.
  }

  return { result: "success", message: "Did not send any requests" };
};
