export interface BoardLayout {
  columns: number;
  rows: number;
  cardWidth: number;
  cardHeight: number;
}

export const boardCapacity = 21;

export function fitKarutaBoard(
  count: number,
  width: number,
  height: number,
  gap: number,
  fixedColumns?: number,
): BoardLayout | null {
  if (count === 0 || width <= 0 || height <= 0) return null;
  let best: BoardLayout | null = null;
  for (let columns = fixedColumns ?? 1; columns <= (fixedColumns ?? count); columns++) {
    const rows = Math.ceil(count / columns);
    const cardWidth = Math.min(
      (width - gap * (columns - 1)) / columns,
      (((height - gap * (rows - 1)) / rows) * 55) / 91,
    );
    if (cardWidth <= 0 || (best && cardWidth <= best.cardWidth)) continue;
    best = { columns, rows, cardWidth, cardHeight: (cardWidth * 91) / 55 };
  }
  return best;
}
