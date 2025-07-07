export const math = (function () {
  return {
    clamp: function (x: number, a: number, b: number) {
      return Math.min(Math.max(x, a), b);
    },
  };
})();
