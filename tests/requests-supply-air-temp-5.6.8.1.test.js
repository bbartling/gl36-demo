const hook = require("../hooks/requests-supply-air-temp-5.6.8.1.js");

test("Calculate requests for supply air temperature with 10 VAV boxes", async () => {
    const mockSdk = {
        logEvent: jest.fn((message) => console.log("LogEvent:", message)),
        groupKey: "AHU-1",
    };

    const writeMock = jest.fn((value) => console.log("Write Call:", value));

    const groupVariables = {
        byLabel: jest.fn((label) => {
            if (label === "Cooling_SAT_Requests") {
                return { write: writeMock };
            }
            return {};
        }),
        find: jest.fn(() => ({
            latestValue: { value: 1 },
            write: jest.fn(),
        })),
    };

    const vavBoxes = [
        { airRef: "VAV-1", temp: 85, tempSetpoint: 75, coolingLoop: 100 }, // Way above setpoint, CoolingLoop high
        { airRef: "VAV-2", temp: 84, tempSetpoint: 75, coolingLoop: 99 },  // Way above setpoint, CoolingLoop high
        { airRef: "VAV-3", temp: 83, tempSetpoint: 75, coolingLoop: 98 },  // Way above setpoint, CoolingLoop high
        { airRef: "VAV-4", temp: 82, tempSetpoint: 75, coolingLoop: 97 },  // Way above setpoint, CoolingLoop high
        { airRef: "VAV-5", temp: 81, tempSetpoint: 75, coolingLoop: 96 },  // Way above setpoint, CoolingLoop high
        { airRef: "VAV-6", temp: 70, tempSetpoint: 75, coolingLoop: 0 },  // Way below setpoint, CoolingLoop 0%
        { airRef: "VAV-7", temp: 69, tempSetpoint: 75, coolingLoop: 0 },  // Way below setpoint, CoolingLoop 0%
        { airRef: "VAV-8", temp: 68, tempSetpoint: 75, coolingLoop: 0 },  // Way below setpoint, CoolingLoop 0%
        { airRef: "VAV-9", temp: 67, tempSetpoint: 75, coolingLoop: 0 },  // Way below setpoint, CoolingLoop 0%
        { airRef: "VAV-10", temp: 66, tempSetpoint: 75, coolingLoop: 0 }, // Way below setpoint, CoolingLoop 0%
    ];

    for (const vav of vavBoxes) {
        const mockPoints = {
            map: jest.fn(() => [
                { attrs: { airRef: vav.airRef }, latestValue: { value: vav.temp } },
            ]),
            byLabel: jest.fn((label) => {
                switch (label) {
                    case "vav":
                        return { first: () => ({ attrs: { importanceMultiplier: 1 } }) };
                    case "zone-air-temp-sensor":
                        return { 
                            first: () => ({
                                latestValue: { value: vav.temp },
                                trueFor: async (duration, predicate) => predicate({ value: vav.temp })
                            })
                        };
                    case "zone-air-temp-occ-cooling-sp":
                        return { 
                            first: () => ({
                                latestValue: { value: vav.tempSetpoint },
                                isChanged: () => false 
                            }) 
                        };
                    case "cool-cmd":
                        return { first: () => ({ latestValue: { value: vav.coolingLoop } }) };
                    default:
                        return { first: () => ({ latestValue: { value: 0 } }) };
                }
            }),
        };

        await hook({
            groupVariables,
            points: mockPoints,
            sdk: mockSdk,
        });
    }

    // Expectations
    expect(writeMock).toHaveBeenCalledTimes(5); // 5 VAVs way above setpoint trigger requests
    expect(writeMock).toHaveBeenCalledWith({ real: expect.any(Number) }); // Ensure requests were sent
});
