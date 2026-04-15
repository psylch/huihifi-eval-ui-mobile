// Order and `sheetKey` mirror huihifi-eval-api data_store.INSTRUMENT_SHEETS,
// the canonical source of which categories exist and in what order.
// Adding a category requires no other code change — App.tsx and SubTabBar
// iterate this list directly.
export const SUB_TABS = [
  { id: 'vocal', sheetKey: '人声', label: '人声' },
  { id: 'guitar', sheetKey: '吉他类', label: '吉他类' },
  { id: 'strings', sheetKey: '弦乐器', label: '弦乐器' },
  { id: 'percussion', sheetKey: '打击乐器', label: '打击乐器' },
  { id: 'woodwind', sheetKey: '木管乐器', label: '木管乐器' },
  { id: 'ethnic', sheetKey: '民族乐器', label: '民族乐器' },
  { id: 'gaming', sheetKey: '游戏', label: '游戏' },
  { id: 'bass', sheetKey: '贝斯', label: '贝斯' },
  { id: 'brass', sheetKey: '铜管乐器', label: '铜管乐器' },
  { id: 'keyboard', sheetKey: '键盘乐器', label: '键盘乐器' },
  { id: 'frequency', sheetKey: '频段', label: '频段' },
] as const;

export type SubTabId = (typeof SUB_TABS)[number]['id'];

// position% = 50 + (score / SCORE_RANGE) * 50
// score = ±SCORE_RANGE → 0% / 100%; score = 0 → 50% (VDSF baseline).
// Calibrated against real data via the e2e test fixture; raise if outliers
// start clipping at the extremes.
export const SCORE_RANGE = 5;

// Indicator shape per selection slot. Color lives in src/index.css under
// `.bar-indicator.{filled,outline,diamond}` and is centralized via
// `--accent-primary` / `--accent-secondary`.
export const INDICATOR_STYLES = [
  { shape: 'filled' as const },
  { shape: 'outline' as const },
  { shape: 'diamond' as const },
] as const;

export type IndicatorShape = (typeof INDICATOR_STYLES)[number]['shape'];

export const MAX_SELECTED_MODES = 3;
