const hook = require("../hooks/requests-static-pressure-5.6.8.2.js");

test("Calculate requests for static pressure reset with 10 VAV boxes", async () => {
    const mockSdk = {
        logEvent: jest.fn((message) => console.log("LogEvent:", message)),
        groupKey: "AHU-1",
    };

    const writeMock = jest.fn((value) => console.log("Write Call:", value));

    const groupVariables = {
        byLabel: jest.fn((label) => {
            if (label === "Cooling_SP_Requests") {
                return { write: writeMock };
            }
            return {};
        }),
        find: jest.fn(() => ({
            latestValue: { value: 1 },
            write: jest.fn(),
        })),
    };

    // Mechanical setpoints for easy understanding
    const constantSetpoints = {
        airflowSetpoint: 70, // Desired airflow in CFM
    };

    // VAV box data: readable and mechanically relatable
    const vavBoxes = [
        { airRef: "VAV-1", damper: 100, airflow: 50, airflowSetpoint: 70 }, // Short on air
        { airRef: "VAV-2", damper: 100, airflow: 55, airflowSetpoint: 70 }, // Short on air
        { airRef: "VAV-3", damper: 100, airflow: 45, airflowSetpoint: 70 }, // Short on air
        { airRef: "VAV-4", damper: 100, airflow: 60, airflowSetpoint: 70 }, // Short on air
        { airRef: "VAV-5", damper: 100, airflow: 65, airflowSetpoint: 70 }, // Short on air
        { airRef: "VAV-6", damper: 60, airflow: 80, airflowSetpoint: 70 },  // Meeting setpoint
        { airRef: "VAV-7", damper: 65, airflow: 75, airflowSetpoint: 70 },  // Meeting setpoint
        { airRef: "VAV-8", damper: 50, airflow: 90, airflowSetpoint: 70 },  // Meeting setpoint
        { airRef: "VAV-9", damper: 55, airflow: 85, airflowSetpoint: 70 },  // Meeting setpoint
        { airRef: "VAV-10", damper: 70, airflow: 95, airflowSetpoint: 70 }, // Meeting setpoint
    ];
    
    for (const vav of vavBoxes) {
        const mockPoints = {
            map: jest.fn(() => [
                { attrs: { airRef: vav.airRef }, latestValue: { value: vav.damper } },
            ]),
            byLabel: jest.fn((label) => {
                if (label === "vav") {
                    return { first: () => ({ attrs: { importanceMultiplier: 1 } }) };
                }
                if (label === "damper-sensor") {
                    return { first: () => ({ latestValue: { value: vav.damper } }) };
                }
                if (label === "discharge-air-flow-sp") {
                    return { first: () => ({ latestValue: { value: vav.airflowSetpoint } }) };
                }
                if (label === "discharge-air-flow-sensor") {
                    return { first: () => ({ latestValue: { value: vav.airflow } }) };
                }
                return { first: () => ({ latestValue: { value: 0 } }) };
            }),
        };
    
        await hook({
            groupVariables,
            points: mockPoints,
            sdk: mockSdk,
        });
    }

    // Expectations
    expect(writeMock).toHaveBeenCalledTimes(5); // 5 VAVs short on air trigger requests
    expect(writeMock).toHaveBeenCalledWith({ real: expect.any(Number) }); // Ensure requests were sent
});
