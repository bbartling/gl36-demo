const NormalSdk = require("@normalframework/applications-sdk");
const { interpolate, limit } = require("../helpers");


/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, groupVariables, sdk }) => {


  if (sdk.groupKey === "") {
    sdk.logEvent(JSON.stringify(points.map(({ attrs, uuid }) => ({ attrs, uuid })), null, 2))
    return { 'result': 'success', message: "Dropping empty group." }
  }
  try {
    const minClgSAT = 55;
    const maxClgSAT = groupVariables.byLabel("maxClgSAT")?.latestValue?.value ?? 70;
    const OATMin = 60;
    const OATMax = 70;

    const totalRequests = points
      .where((p) => p.attrs.label === "Total SAT Requests")
      .first();

    if(!totalRequests) {
      sdk.logEvent(`Total Points`, points.length)
      return {"result": 'error', message: `Total Requests Variable not found. Points: ${points.length} `}
    }

    const R = totalRequests.latestValue.value;

    sdk.logEvent(sdk.groupKey, totalRequests.latestValue.value);

    const SATSetpoint =
      points.byLabel("discharge-air-temp-sp").first();

    const outsideAirTemp = points.byLabel("air-temp-sensor").first()
      ?.latestValue.value;
    if (!outsideAirTemp) {
      return {
        result: "error",
        message: "Missing required point 'air-temp-sensor'",
      };
    }

    sdk.logEvent("ignored requests", groupVariables.byLabel("IgnoredRequests").latestValue.value)

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
      systemStatus.latestValue.ts.getTime() ===
      systemStatus.changeTime.getTime();

    if (resetToInitial) {
      sdk.logEvent("resetting to initial");
      await SATSetpoint.write({ real: SP0 });
      return;
    }

    const runTandRLoop = await systemStatus.trueFor(Td, (v) => v.value === 1);

    //   Un-comment for debugging
    // logEvent(
    //   JSON.stringify(
    //     {
    //       actualSATSetpoint,
    //       minClgSAT,
    //       maxClgSAT,
    //       OATMin,
    //       OATMax,
    //       SP0,
    //       SPmin,
    //       SPmax,
    //       Td,
    //       T,
    //       I,
    //       SPtrim,
    //       SPres,
    //       SPResMax,
    //       runTandRLoop,
    //       outsideAirTemp,
    //       R,
    //     },
    //     null,
    //     2
    //   )
    // );

    const getProportionalSetpoint = (tMax) => {
      return interpolate(
        outsideAirTemp,
        [
          { x: OATMin, y: tMax },
          { x: OATMax, y: minClgSAT },
        ],
        { min: minClgSAT, max: maxClgSAT }
      );
    };

    if (runTandRLoop) {
      sdk.logEvent("running tandr");
      // trim
      if (R <= I) {
        
        sdk.logEvent("trimming");
        const currentSetpoint = SATSetpoint?.latestValue?.value || 0;
        const tMax = limit(currentSetpoint + SPtrim, SPmin, SPmax);
        await groupVariables.byLabel("tMax")?.write(tMax);
        sdk.logEvent(`Tmax: ${tMax}, Test: ${currentSetpoint + SPtrim}`);
        const newSetpoint = getProportionalSetpoint(tMax);
        await SATSetpoint.write({ real: newSetpoint });
        console(`Trimming to ${newSetpoint}`);
        return { result: "success", message: `Trimming to ${newSetpoint}` };
      }
      // respond
      else {
        sdk.logEvent("responding");
        const respondAmount = Math.max(SPres * (R - I), SPResMax);
        const currentSetpoint = SATSetpoint?.latestValue?.value || 0;
        sdk.logEvent("respond amount: " + respondAmount)
        sdk.logEvent("setpoint: " + currentSetpoint)
        const tMax = limit(currentSetpoint + respondAmount, SPmin, SPmax);
        await groupVariables.byLabel("tMax")?.write(tMax);
        const newSetpoint = getProportionalSetpoint(tMax);
        await SATSetpoint.write({ real: newSetpoint });
        sdk.logEvent(`Responding to ${newSetpoint}`);
        return { result: "success", message: `Responding to ${newSetpoint}` };
      }
    }
  } catch (e) {
    sdk.logEvent(e.message)
    throw e;
  }
};