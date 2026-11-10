export function kWeighting(sampleRate: number) {
  // https://github.com/jiixyj/libebur128/blob/master/ebur128/ebur128.c
  const shelfK = Math.tan((Math.PI * 1681.974450955533) / sampleRate);
  const shelfQ = 0.7071752369554196;
  const high = 10 ** (3.999843853973347 / 20);
  const middle = high ** 0.4996667741545416;
  const divisor = 1 + shelfK / shelfQ + shelfK * shelfK;
  const shelf = {
    b0: (high + (middle * shelfK) / shelfQ + shelfK * shelfK) / divisor,
    b1: (2 * (shelfK * shelfK - high)) / divisor,
    b2: (high - (middle * shelfK) / shelfQ + shelfK * shelfK) / divisor,
    a1: (2 * (shelfK * shelfK - 1)) / divisor,
    a2: (1 - shelfK / shelfQ + shelfK * shelfK) / divisor,
  };
  const highPassK = Math.tan((Math.PI * 38.13547087602444) / sampleRate);
  const highPassQ = 0.5003270373238773;
  const highPassDivisor = 1 + highPassK / highPassQ + highPassK * highPassK;
  return {
    shelf,
    highPass: {
      a1: (2 * (highPassK * highPassK - 1)) / highPassDivisor,
      a2: (1 - highPassK / highPassQ + highPassK * highPassK) / highPassDivisor,
    },
  };
}
