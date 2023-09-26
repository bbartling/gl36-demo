const NormalSdk = require("@normalframework/applications-sdk");
import { limit } from "../helpers";

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, sdk, groupVariables }) => {
  const logEvent = (message) => {
    console.log(message);
    sdk.event(message);
  };

  const totalRequests = points
    .where((p) => p.attrs.label === "Total SAP Requests")
    .first();
  const R = totalRequests.latestValue.value;

  console.log(sdk.groupKey, totalRequests.latestValue.value);

  const SPSetpoint = groupVariables.byLabel("SP_Setpoint");

  const SP0 = 120;
  const SPmin = 25;
  const SPmax = 200; // TODO: what should this actually be?
  const Td = "10m";
  const T = "2m";
  const I = 2;
  const SPtrim = -12;
  const SPres = 15;
  const SPResMax = 32;

  const systemStatus = points.byLabel("fan-run-cmd").first();

  const resetToInitial =
    systemStatus?.latestValue.value === 1 &&
    systemStatus.latestValue.ts.getTime() === systemStatus.changeTime.getTime();

  if (resetToInitial) {
    logEvent("resetting to original");
    await SPSetpoint.write(SP0);
    return;
  }

  const runTandRLoop = await systemStatus.trueFor(Td, (v) => v.value === 1);

  logEvent(`Run TandR Loop: ${runTandRLoop}`);

  if (runTandRLoop) {
    // trim
    if (R <= I) {
      const newSetpoint = limit(
        DischargeAirTempSp.latestValue?.value ?? 0 + SPtrim,
        SPmin,
        SPmax
      );
      logEvent(`Trimming to ${newSetpoint}`);
      await SPSetpoint.write(newSetpoint);
    }
    // respond
    else {
      const respondAmount = Math.min(SPres * (R - I), SPResMax);
      const newSetpoint = limit(
        DischargeAirTempSp.latestValue?.value ?? 0 + respondAmount,
        SPmin,
        SPmax
      );
      logEvent(`Responding to ${newSetpoint}`);
      await SPSetpoint.write(newSetpoint);
    }
  }
};
