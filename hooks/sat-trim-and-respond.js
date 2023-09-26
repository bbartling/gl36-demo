const NormalSdk = require("@normalframework/applications-sdk");
const { interpolate, limit } = require("../helpers");

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, groupVariables, sdk }) => {
  const minClgSAT = 65;
  const maxClgSAT = 55;
  const OATMin = 60;
  const OATMax = 70;

  const logEvent = (message) => {
    console.log(message);
    sdk.event(message);
  };

  const totalRequests = points
    .where((p) => p.attrs.label === "Total SP Requests")
    .first();
  const R = totalRequests.latestValue.value;

  console.log(sdk.groupKey, totalRequests.latestValue.value);

  const SATSetpoint = groupVariables.byLabel("SAT_Setpoint");
  // TODO: is this a good tag?
  const outsideAirTemp = points.byLabel("air-temp-sensor").first()
    ?.latestValue.value;
  if (!outsideAirTemp) {
    return {
      result: "error",
      message: "Missing required point 'air-temp-sensor'",
    };
  }

  const SP0 = maxClgSAT;
  const SPmin = minClgSAT;
  const SPmax = maxClgSAT;
  const Td = "10m";
  const T = "2m";
  const I = 2;
  const SPtrim = 0.2;
  const SPres = -0.3;
  const SPResMax = -1.0;

  const systemStatus = points.byLabel("fan-run-cmd").first();
  const resetToInitial =
    systemStatus?.latestValue.value === 1 &&
    systemStatus.latestValue.ts.getTime() === systemStatus.changeTime.getTime();

  if (resetToInitial) {
    logEvent("resetting to initial");
    await SATSetpoint.write(SP0);
    return;
  }

  const runTandRLoop = await systemStatus.trueFor(Td, (v) => v.value === 1);

  //   logEvent(`Run TandR Loop: ${runTandRLoop}`);
  logEvent(
    JSON.stringify(
      {
        minClgSAT,
        maxClgSAT,
        OATMin,
        OATMax,
        SP0,
        SPmin,
        SPmax,
        Td,
        T,
        I,
        SPtrim,
        SPres,
        SPResMax,
        runTandRLoop,
        outsideAirTemp,
        totalRequests,
      },
      null,
      2
    )
  );

  const getProportionalSetpoint = (tMax) => {
    return interpolate(
      outsideAirTemp,
      [
        { x: OATMin, y: tMax },
        { x: OATMax, y: minClgSAT },
      ],
      { min: OATMin, max: OATMax }
    );
  };

  if (runTandRLoop) {
    // trim
    if (R <= I) {
      const tMax = limit(
        SATSetpoint.latestValue?.value ?? 0 + SPtrim,
        SPmin,
        SPmax
      );
      const newSetpoint = getProportionalSetpoint(tMax);
      logEvent(`Trimming to ${newSetpoint}`);
      await SATSetpoint.write(newSetpoint);
    }
    // respond
    else {
      const respondAmount = Math.min(SPres * (R - I), SPResMax);
      const tMax = limit(
        SATSetpoint.latestValue?.value ?? 0 + respondAmount,
        SPmin,
        SPmax
      );
      const newSetpoint = getProportionalSetpoint(tMax);
      logEvent(`Responding to ${newSetpoint}`);
      await SATSetpoint.write(newSetpoint);
    }
  }
};
