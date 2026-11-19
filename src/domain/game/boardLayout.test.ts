import { expect, it } from 'vite-plus/test';
import { fitKarutaBoard } from './boardLayout.js';

it('6・12・20・30枚を領域内へ収め、ALYの縦横比を保つ', () => {
  for (const [width, height] of [
    [780, 490],
    [1100, 560],
    [1650, 840],
  ]) {
    for (const count of [6, 12, 20, 30]) {
      const layout = fitKarutaBoard(count, width!, height!, 10);
      if (!layout) throw new Error('札を配置できません');
      expect(layout.columns * layout.rows).toBeGreaterThanOrEqual(count);
      expect(layout.columns * layout.cardWidth + (layout.columns - 1) * 10).toBeLessThanOrEqual(
        width! + 0.0001,
      );
      expect(layout.rows * layout.cardHeight + (layout.rows - 1) * 10).toBeLessThanOrEqual(
        height! + 0.0001,
      );
      expect(layout.cardWidth / layout.cardHeight).toBeCloseTo(55 / 91);
      expect(layout.cardWidth).toBeGreaterThan(60);
    }
  }
});

it('札や表示領域がない状態では配置を作らない', () => {
  expect(fitKarutaBoard(0, 1000, 500, 10)).toBeNull();
  expect(fitKarutaBoard(12, 0, 500, 10)).toBeNull();
});
