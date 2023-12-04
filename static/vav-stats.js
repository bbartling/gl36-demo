const { ref, watchEffect } = Vue;

export default {
  props: ["equipRef"],
  setup(props) {
    const { equipRef } = props;
    const gridRef = ref(null);

    watchEffect(async () => {
      let points = await sdk.getPoints(
        {
          or: [
            {
              field: {
                property: "class",
                text: "zone-air-temp-sensor",
              },
            },
            {
              field: {
                property: "class",
                text: "damper-sensor",
              },
            },
            {
              field: {
                property: "class",
                text: "discharge-air-flow-sensor",
              },
            },
            {
              field: {
                property: "class",
                text: "discharge-air-flow-sp",
              },
            },
            {
              field: {
                property: "class",
                text: "zone-air-temp-occ-cooling-sp",
              },
            },
            {
              field: {
                property: "class",
                text: "cool-cmd",
              },
            },
          ],
        },
        [
          {
            fieldName: "airRef",
            layer: "model",
            path: [
              {
                sourceProperty: "equipRef",
                targetProperty: "id",
                valueProperty: "airRef",
              },
            ],
          },
        ]
      );

      points = points.filter((p) => p.attrs.airRef === equipRef);
      const grouped = sdk.groupPoints(points, ["equipRef"]);

      const columnDefs = [
        { field: "vav", sortable: true },
        { field: "zone-air-temp-sensor", sortable: true },
        { field: "damper-sensor", sortable: true },
        { field: "discharge-air-flow-sensor", sortable: true },
        { field: "discharge-air-flow-sp", sortable: true },
        { field: "zone-air-temp-occ-cooling-sp", sortable: true },
        { field: "cool-cmd", sortable: true },
      ];

      const rowData = [];

      const selectValue = (points, className) => {
        return points.find((v) => v.attrs.class === className)?.latestValue
          .valueType.double;
      };

      grouped.forEach((values, group) => {
        rowData.push({
          vav: group,
          "damper-sensor": selectValue(values, "damper-sensor"),
          "zone-air-temp-sensor": selectValue(values, "zone-air-temp-sensor"),
          "discharge-air-flow-sp": selectValue(values, "discharge-air-flow-sp"),
          "discharge-air-flow-sensor": selectValue(
            values,
            "discharge-air-flow-sensor"
          ),
          "zone-air-temp-occ-cooling-sp": selectValue(
            values,
            "zone-air-temp-occ-cooling-sp"
          ),
          "cool-cmd": selectValue(values, "cool-cmd"),
        });
      });

      const gridOptions = {
        columnDefs: columnDefs,
        rowData: rowData,
      };

      new agGrid.Grid(gridRef.value, gridOptions);
    });

    return { gridRef };
  },
  template: `
    <div
        style="
            font-family: Helvetica, Arial, sans-serif;
            font-size: 14px;
            font-weight: 900;
            padding: 5px 0px 10px 5px;
        "
    >
        Vav Stats - {{equipRef}}
    </div>
    <div
        ref="gridRef"
        style="height: 500px; width: 100%"
        class="ag-theme-alpine"
    ></div>
    `,
};
