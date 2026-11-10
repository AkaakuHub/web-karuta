import { describe, expect, it } from 'vite-plus/test';
import { playbackPosition } from './playback.js';

describe('音声の再生位置', () => {
  it('シークした位置からの経過時間を加算する', () => {
    expect(playbackPosition(30, 100, 105, 200)).toBe(35);
  });
  it('停止中と再生開始前には位置を進めない', () => {
    expect(playbackPosition(30, null, 200, 300)).toBe(30);
    expect(playbackPosition(0, 101, 100, 300)).toBe(0);
  });
  it('再生位置を曲の長さの範囲に収める', () => {
    expect(playbackPosition(190, 100, 120, 200)).toBe(200);
    expect(playbackPosition(-10, null, 0, 200)).toBe(0);
  });
});
