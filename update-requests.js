const NormalSdk = require("@normalframework/applications-sdk");

/**
 * Invoke hook function
 * @param {NormalSdk.InvokeParams} params
 * @returns {NormalSdk.InvokeResult}
 */
module.exports = async ({ points, sdk }) => {
  const DATCLSP = points.byLabel("DATCLSP")[0];
  const DAT = points.byLabel("DAT")[0];
  const CHWVCMD = points.byLabel("CHWVCMD")[0];
  const HWVCMD = points.byLabel("HWVCMD")[0];
  const DATHTSP = points.byLabel("DATHTSP")[0];

  const checkDAT = async (minVal) => {
    return await DAT.trueFor(
      "PT30S",
      (v) => {
        return !!v.value && v.value > minVal;
      },
      "hpl:bacnet:1"
    );
  };

  if (CHWVCMD?.latestValue.value && CHWVCMD.latestValue.value > 2) {
    sdk.groupVariables?.write("CLREQ", 0);
  } else if (await checkDAT((DATCLSP.latestValue?.value ?? 0) + 5)) {
    sdk.groupVariables?.write("CLREQ", 6);
  } else if (checkDAT((DATCLSP.latestValue?.value ?? 0) + 3)) {
    sdk.groupVariables?.write("CLREQ", 4);
  } else if (CHWVCMD.value && CHWVCMD.value > 5) {
    sdk.groupVariables?.write("CLREQ", 1);
  }
};
