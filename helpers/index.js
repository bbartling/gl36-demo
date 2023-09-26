const createSlopeInterceptFn = (first, second) => {
  const a = (second.y - first.y) / (second.x - first.x); // slope
  const b = first.y - a * first.x; // intercept
  return (val) => a * val + b;
};

const limit = (value, min, max) => {
  if (value > max) return max;
  if (value < min) return min;
  return value;
};

const interpolate = (value, points, options = {}) => {
  const fn = createSlopeInterceptFn(points[0], points[1]);
  const result = fn(value);
  const { max, min } = options;

  if (max && result > max) return max;
  if (min && result < min) return min;

  return result;
};

module.exports = { limit, interpolate };
