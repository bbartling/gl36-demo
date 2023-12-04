const { ref, watchEffect } = Vue;

const fetchSetpoints = async (equipRef) => {
  return await sdk.getPoints({
    and: [
      {
        field: {
          property: "equipRef",
          text: equipRef,
        },
      },
      {
        or: [
          {
            field: {
              property: "class",
              text: "discharge-air-temp-sp",
            },
          },
          {
            field: {
              property: "class",
              text: "air-temp-sensor",
            },
          },
        ],
      },
    ],
  });
};

const fetchRequestPoints = async (equipRef) => {
  return await sdk.getPoints({
    and: [
      {
        field: {
          property: "label",
          text: "Total SAT Requests",
        },
      },
      {
        field: {
          property: "equipRef",
          text: equipRef,
        },
      },
    ],
  });
};

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

export default {
  props: ["equipRef"],
  setup(props) {
    const { equipRef } = props;
    const count = ref(0);
    const chartRef = ref(null);
    const setPoints = ref(null);
    const requestPoints = ref(null);

    async function fetchSeries(start, end) {
      return await Promise.all([
        getTimeSeries(requestPoints.value[0], start, end, "request"),
        getTimeSeries(
          setPoints.value.find(
            (p) => p.attrs.class === "discharge-air-temp-sp"
          ),
          start,
          end,
          "sp"
        ),
        getTimeSeries(
          setPoints.value.find((p) => p.attrs.class === "air-temp-sensor"),
          start,
          end,
          "sensor"
        ),
      ]);
    }

    const chart = ref(null);
    const series = ref([]);

    watchEffect(async () => {
      setPoints.value = await fetchSetpoints(equipRef);
      requestPoints.value = await fetchRequestPoints(equipRef);
      const start = new Date();
      start.setHours(start.getHours() - 24);
      const end = new Date();

      series.value = await fetchSeries(start, end);

      var options = {
        series: series.value,
        chart: {
          height: 700,
          type: "line",
          events: {
            zoomed: function (chartContext, { xaxis, yaxis }) {
              const start = new Date(xaxis.min);
              const end = new Date(xaxis.max);
              fetchSeries(start, end).then((d) => {
                chart.value.updateSeries(d);
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
          text: `AHU Supply Air Temp - ${equipRef}`,
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
              text: "Air Temp Sensor & SP",
            },
            labels: {
              formatter: (v) => v.toFixed(0),
            },
          },
          {
            seriesName: "sensor",
            show: false,
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

      chart.value = new ApexCharts(chartRef.value, options);
      chart.value.render();
    });

    return { count, chartRef, chart };
  },
  template: `
    <div class="chart-wrapper" >
      <div ref="chartRef" />
    </div>
  `,
};
