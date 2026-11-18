interface SelectableDeck {
  id: string;
  kind: string;
  playableIds: string[];
}

function universe(decks: readonly SelectableDeck[]): string[] {
  return [
    ...new Set(decks.filter((deck) => deck.kind === 'brand').flatMap((deck) => deck.playableIds)),
  ].sort();
}
export function brandCardIds(decks: readonly SelectableDeck[], brand: string): string[] {
  const group = decks.find((deck) => deck.id === `brand:${brand}`);
  if (!group) throw new Error('ブランドの構成がありません');
  return group.playableIds;
}
export function selectedCardIds(decks: readonly SelectableDeck[], value: string): string[] {
  if (!value.startsWith('cards:')) {
    const preset = decks.find((deck) => deck.id === value);
    if (!preset) throw new Error('出題範囲がありません');
    return preset.playableIds;
  }
  const ids = universe(decks);
  const bits = value.slice(6);
  if (!/^[0-9a-f]+$/u.test(bits) || bits.length !== Math.ceil(ids.length / 4))
    throw new Error('出題範囲の形式が不正です');
  const tail = ids.length % 4;
  if (tail && Number.parseInt(bits.at(-1)!, 16) >= 2 ** tail)
    throw new Error('出題範囲に存在しない札があります');
  return ids.filter(
    (_, index) => (Number.parseInt(bits[Math.floor(index / 4)]!, 16) & (1 << (index % 4))) !== 0,
  );
}
export function encodeSelection(
  decks: readonly SelectableDeck[],
  selected: ReadonlySet<string>,
): string {
  const ids = universe(decks);
  const available = new Set(ids);
  if ([...selected].some((id) => !available.has(id)))
    throw new Error('出題範囲に存在しない札があります');
  const preset = decks.find(
    (deck) =>
      deck.kind !== 'brand' &&
      deck.playableIds.length === selected.size &&
      deck.playableIds.every((id) => selected.has(id)),
  );
  if (preset) return preset.id;
  let bits = '';
  for (let index = 0; index < ids.length; index += 4) {
    let nibble = 0;
    for (let offset = 0; offset < 4; offset++)
      if (selected.has(ids[index + offset]!)) nibble |= 1 << offset;
    bits += nibble.toString(16);
  }
  return `cards:${bits}`;
}
export function replaceBrandSelection(
  decks: readonly SelectableDeck[],
  value: string,
  brand: string,
  selected: ReadonlySet<string>,
): string {
  const group = new Set(brandCardIds(decks, brand));
  if ([...selected].some((id) => !group.has(id))) throw new Error('別の分類の札が含まれています');
  return encodeSelection(
    decks,
    new Set([...selectedCardIds(decks, value).filter((id) => !group.has(id)), ...selected]),
  );
}
export function emptySelection(decks: readonly SelectableDeck[]): string {
  return encodeSelection(decks, new Set());
}
export function allSelection(decks: readonly SelectableDeck[]): string {
  return encodeSelection(decks, new Set(universe(decks)));
}
