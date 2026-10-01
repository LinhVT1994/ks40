import { describe, expect, it } from 'vitest';
import { cellsToWindows, gridRange, windowsToCells } from '@/features/consultations/lib/availability-grid';

describe('availability grid', () => {
  it('round-trips windows through cells', () => {
    const windows = [{ day: 2, start: '20:00', end: '22:00' }, { day: 4, start: '09:00', end: '09:30' }];
    expect(cellsToWindows(windowsToCells(windows))).toEqual(windows);
  });
  it('merges adjacent cells and splits gaps', () => {
    const cells = new Set(['1-1140', '1-1170', '1-1260', '0-540']);
    expect(cellsToWindows(cells)).toEqual([
      { day: 0, start: '09:00', end: '09:30' },
      { day: 1, start: '19:00', end: '20:00' },
      { day: 1, start: '21:00', end: '21:30' },
    ]);
  });
  it('rounds partial cells outward', () => {
    expect([...windowsToCells([{ day: 3, start: '10:15', end: '10:45' }])]).toEqual(['3-600', '3-630']);
  });
  it('ends the last cell of the day at 24:00', () => {
    expect(cellsToWindows(new Set(['5-1410']))).toEqual([{ day: 5, start: '23:30', end: '24:00' }]);
  });
  it('widens the visible range to fit existing availability', () => {
    expect(gridRange(new Set())).toEqual({ from: 420, to: 1380 });
    expect(gridRange(new Set(['1-360', '1-1410']))).toEqual({ from: 360, to: 1440 });
  });
});
