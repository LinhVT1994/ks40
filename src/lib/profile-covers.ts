// Gradients fade to the same color at alpha 0 (not `transparent`) so Satori's OG render doesn't mix in black.

/**
 * Profile cover ("wall") values stored in `User.coverImage`:
 *   - null                → default preset
 *   - "preset:<id>"       → one of COVER_PRESETS below
 *   - "/uploads/covers/…" or an https URL → uploaded image
 */

const dots = (color: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E")`;

export const COVER_PRESETS = [
  {
    id: 'paper',
    label: 'Giấy kem',
    background: `${dots('rgba(166,81,54,0.18)')}, radial-gradient(circle at 15% 20%, #f6e3d6 0%, rgba(246,227,214,0) 55%), radial-gradient(circle at 85% 30%, #efe6d8 0%, rgba(239,230,216,0) 50%), linear-gradient(135deg, #faf3ea, #f1e7da)`,
  },
  {
    id: 'terracotta',
    label: 'Đất nung',
    background: 'radial-gradient(circle at 20% 30%, #e7a383 0%, rgba(231,163,131,0) 55%), radial-gradient(circle at 80% 70%, #8c3f28 0%, rgba(140,63,40,0) 60%), linear-gradient(135deg, #c8694a, #a65136)',
  },
  {
    id: 'sage',
    label: 'Xô thơm',
    background: 'radial-gradient(circle at 25% 25%, #dfe8d3 0%, rgba(223,232,211,0) 55%), radial-gradient(circle at 80% 75%, #8fa98a 0%, rgba(143,169,138,0) 55%), linear-gradient(135deg, #c2d1b6, #9fb596)',
  },
  {
    id: 'dusk',
    label: 'Hoàng hôn',
    background: 'radial-gradient(circle at 15% 80%, #f3b58c 0%, rgba(243,181,140,0) 50%), radial-gradient(circle at 85% 20%, #b58ab0 0%, rgba(181,138,176,0) 55%), linear-gradient(160deg, #e9a3a0, #8e6c9c)',
  },
  {
    id: 'ocean',
    label: 'Biển lặng',
    background: 'radial-gradient(circle at 20% 20%, #cfe6ec 0%, rgba(207,230,236,0) 55%), radial-gradient(circle at 80% 80%, #4f7d95 0%, rgba(79,125,149,0) 60%), linear-gradient(135deg, #8fb8c8, #5b8aa3)',
  },
  {
    id: 'night',
    label: 'Đêm đọc sách',
    background: `${dots('rgba(255,236,210,0.22)')}, radial-gradient(circle at 75% 25%, #5a4636 0%, rgba(90,70,54,0) 55%), linear-gradient(135deg, #2b2724, #1c1a18)`,
  },
] as const;

export type CoverPresetId = (typeof COVER_PRESETS)[number]['id'];

export const DEFAULT_COVER_PRESET: CoverPresetId = 'paper';

export function isCoverPresetValue(value: string) {
  return value.startsWith('preset:') && COVER_PRESETS.some(p => `preset:${p.id}` === value);
}

/** Resolve a stored value into either a preset background or an image URL. */
export function resolveCover(value: string | null | undefined):
  | { kind: 'preset'; id: CoverPresetId; background: string }
  | { kind: 'image'; url: string } {
  if (value && !value.startsWith('preset:')) return { kind: 'image', url: value };
  const preset = COVER_PRESETS.find(p => `preset:${p.id}` === value)
    ?? COVER_PRESETS.find(p => p.id === DEFAULT_COVER_PRESET)!;
  return { kind: 'preset', id: preset.id, background: preset.background };
}

export const DEFAULT_COVER_BACKGROUND = COVER_PRESETS.find(p => p.id === DEFAULT_COVER_PRESET)!.background;
