export const createDamperPositionChart = async (ahuId, elementSelector) => {
  const allPoints = await sdk.getHookPoints({
    applicationId: "gl36-new",
    hookId: "0d73974b-f348-4a83-a05e-da4de852e219",
    additionalQuery: {
      field: { property: "class", text: "damper-sensor" },
    },
  });
  const points = allPoints.filter((p) => p.attrs.airRef === ahuId);

  const start = new Date();
  start.setHours(start.getHours() - 24);
  const end = new Date();

  const getTimeSeries = async (points, startDate, endDate) => {
    const data = await sdk.getData(
      points.map((p) => p.uuid),
      startDate,
      endDate
    );

    return points.map((p, index) => ({
      name: p.attrs.equipRef,
      data: data[index].values.map((v) => ({
        x: v.ts.seconds * 1000,
        y: v.valueType.double,
      })),
    }));
  };

  const series = await getTimeSeries(points, start, end);

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
          getTimeSeries(points, start, end).then((d) => {
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
      text: `VAV damper positions - ${ahuId}`,
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
    yaxis: {
      max: 100,
      ticks: 5,
      labels: {
        formatter: (v) => v.toFixed(0),
      },
    },
    markers: {
      size: 6,
      strokeWidth: 0,
      hover: {
        size: 9,
      },
    },
  };

  chart = new ApexCharts(document.querySelector(elementSelector), options);

  chart.render();
};
