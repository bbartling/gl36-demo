export const createAhuChart = async (ahuId, rootElementId) => {
  const setPoints = await sdk.getPoints({
    and: [
      {
        field: {
          property: "equipRef",
          text: ahuId,
        },
      },
      {
        or: [
          {
            field: {
              property: "class",
              text: "discharge-air-pressure-sp",
            },
          },
          {
            field: {
              property: "class",
              text: "discharge-air-pressure-sensor",
            },
          },
        ],
      },
    ],
  });

  console.log("setPoints", setPoints);

  const request = await sdk.getPoints({
    and: [
      {
        field: {
          property: "label",
          text: "Total SP Requests",
        },
      },
      {
        field: {
          property: "equipRef",
          text: ahuId,
        },
      },
    ],
  });

  const start = new Date();
  start.setHours(start.getHours() - 24);
  const end = new Date();

  const getTimeSeries = async (point, startDate, endDate, name) => {
    const data = await sdk.getData([point.uuid], startDate, endDate);

    return {
      name,
      data: data[0].values.map((v) => ({
        x: v.ts.seconds * 1000,
        y: v.valueType.double,
      })),
    };
  };

  const fetchSeries = async (start, end) => {
    return await Promise.all([
      getTimeSeries(request[0], start, end, "request"),
      getTimeSeries(
        setPoints.find((p) => p.attrs.class === "discharge-air-pressure-sp"),
        start,
        end,
        "sp"
      ),
      getTimeSeries(
        setPoints.find(
          (p) => p.attrs.class === "discharge-air-pressure-sensor"
        ),
        start,
        end,
        "sensor"
      ),
    ]);
  };

  const series = await fetchSeries(start, end);
  var chart;

  var options = {
    series,
    chart: {
      height: 700,
      type: "line",
      events: {
        zoomed: function (chartContext, { xaxis, yaxis }) {
          const start = new Date(xaxis.min);
          const end = new Date(xaxis.max);
          fetchSeries(start, end).then((d) => {
            chart.updateSeries(d);
          });
        },
      },
      zoom: {
        enabled: true,
      },
      stroke: {
        curve: "straight",
      },
      animations: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "straight",
    },
    title: {
      text: `AHU Static Pressure - ${ahuId}`,
      align: "left",
    },
    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"],
        opacity: 0.5,
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        hideOverlappingLabels: true,
        rotate: 0,
        formatter: function (value, timestamp) {
          const date = new Date(timestamp);
          return (
            date.toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            }) +
            " " +
            date.toLocaleTimeString("en-US", { hour12: false })
          );
        },
      },
    },
    yaxis: [
      {
        seriesName: "sp",
        title: {
          text: "SP Setpoint",
        },
        labels: {
          formatter: (v) => v.toFixed(0),
        },
      },
      {
        seriesName: "sensor",
        title: {
          text: "SP Sensor",
        },
        labels: {
          formatter: (v) => v.toFixed(0),
        },
      },
      {
        seriesName: "requests",
        opposite: true,
        title: {
          text: "Requests",
        },
        labels: {
          formatter: (v) => v.toFixed(0),
        },
      },
    ],
    markers: {
      size: 6,
      strokeWidth: 0,
      hover: {
        size: 9,
      },
    },
  };

  chart = new ApexCharts(document.querySelector(rootElementId), options);

  chart.render();
};
