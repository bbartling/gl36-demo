const { interpolate } = require("../helpers");

test("test1", () => {
  const result = interpolate(4, [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
  ]);
  expect(result).toBe(4);
});

test("test2", () => {
  const result = interpolate(4, [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
  ]);
  expect(result).toBe(8);
});

test("max works", () => {
  const result = interpolate(
    6,
    [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ],
    { max: 10 }
  );
  expect(result).toBe(10);
});

test("min works", () => {
  const result = interpolate(
    1,
    [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ],
    { min: 5 }
  );
  expect(result).toBe(5);
});

test("min max works", () => {
  const coords = [
    { x: 1, y: 2 },
    { x: 2, y: 10 },
  ];

  const result = interpolate(1.1, coords, { min: 5, max: 7 });
  const result2 = interpolate(1.3, coords, { min: 0, max: 70 });
  const result3 = interpolate(5, coords, { min: 5, max: 7 });

  expect(result).toBe(5);
  expect(result2).toBe(4.4);
  expect(result3).toBe(7);
});
