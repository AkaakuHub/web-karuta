export function sampleHelpCards<T extends { id: string }>(cards: readonly T[]): T[] {
  const result = [...cards].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  let seed = 0x4b415255;
  for (let index = result.length - 1; index > 0; index--) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const other = Math.floor(((seed >>> 0) / 2 ** 32) * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result.slice(0, 30);
}
