// Sub-tab order mirrors the prototype HTML
// (docs/huihifi-app-handoff/l2_product_detail.html `renderSubTabs`),
// with "游戏" appended because our data has it and the prototype
// didn't enumerate it. `sheetKey` stays as the full Chinese name from
// huihifi-eval-api data_store.INSTRUMENT_SHEETS — that's the real key
// into the API response `scores` dict. `label` is short-form UI copy.
export const SUB_TABS = [
  { id: 'frequency', sheetKey: '频段', label: '频段' },
  { id: 'vocal', sheetKey: '人声', label: '人声' },
  { id: 'percussion', sheetKey: '打击乐器', label: '打击乐' },
  { id: 'guitar', sheetKey: '吉他类', label: '吉他' },
  { id: 'strings', sheetKey: '弦乐器', label: '弦乐' },
  { id: 'bass', sheetKey: '贝斯', label: '贝斯' },
  { id: 'woodwind', sheetKey: '木管乐器', label: '木管' },
  { id: 'brass', sheetKey: '铜管乐器', label: '铜管' },
  { id: 'keyboard', sheetKey: '键盘乐器', label: '键盘' },
  { id: 'ethnic', sheetKey: '民族乐器', label: '民族' },
  { id: 'gaming', sheetKey: '游戏', label: '游戏' },
] as const;

export type SubTabId = (typeof SUB_TABS)[number]['id'];

// position% = 50 + (score / SCORE_RANGE) * 50
// score = ±SCORE_RANGE → 0% / 100%; score = 0 → 50% (VDSF baseline).
// Aligned with the ranking zone axis (±6 dB — `excessive_high` upper edge
// at +6 and `excessive_low` lower edge at −6). See ZONES below and
// docs/decisions/D008 (9-tier severity scheme).
export const SCORE_RANGE = 6;

// Preference zones mirror the ranking backend (formula_parser.py
// ZONE_CENTERS, 9-tier severity scheme — see docs/decisions/D008). Each zone
// is an absolute dB band on the relative-to-VDSF scale, used to render a mini
// color ruler under every BarChart so users can see which severity bucket an
// indicator falls into.
//
// Magnitude bands: 中性 ±0.75 / 轻度 ±1.5 / 明显 ±2.5 / 重度 ±3.5 / 过度 >±3.5.
// Signed → 9 zones. Colors match huihifi-eval-ui RankingPage ZONES so
// cross-feature semantics stay consistent: warm = 偏高, cool = 偏低.
export const ZONES = [
  { key: 'excessive_low', label: '过度(低)', min: -SCORE_RANGE, max: -3.5, color: '#60A5FA' },
  { key: 'severe_low', label: '重度(低)', min: -3.5, max: -2.5, color: '#38BDF8' },
  { key: 'obvious_low', label: '明显(低)', min: -2.5, max: -1.5, color: '#22D3EE' },
  { key: 'mild_low', label: '轻度(低)', min: -1.5, max: -0.75, color: '#67E8F9' },
  { key: 'neutral', label: '中性', min: -0.75, max: 0.75, color: '#9CA3AF' },
  { key: 'mild_high', label: '轻度(高)', min: 0.75, max: 1.5, color: '#FBBF24' },
  { key: 'obvious_high', label: '明显(高)', min: 1.5, max: 2.5, color: '#FB923C' },
  { key: 'severe_high', label: '重度(高)', min: 2.5, max: 3.5, color: '#F97316' },
  { key: 'excessive_high', label: '过度(高)', min: 3.5, max: SCORE_RANGE, color: '#F87171' },
] as const;

export type ZoneKey = (typeof ZONES)[number]['key'];

// Indicator shape per selection slot. Color lives in src/index.css
// under `.bar-indicator.{filled,outline,diamond}` via `--accent-primary`
// and `--accent-secondary`.
export const INDICATOR_STYLES = [
  { shape: 'filled' as const },
  { shape: 'outline' as const },
  { shape: 'diamond' as const },
  { shape: 'square' as const },
  { shape: 'square-outline' as const },
] as const;

export type IndicatorShape = (typeof INDICATOR_STYLES)[number]['shape'];

// Maximum number of (product, mode) pairs the WebView will render at once.
// Aligned with the PC microapp contract (huihifi-eval-ui) so a single
// integration doc covers both. Each pair gets one INDICATOR_STYLES slot.
export const MAX_PAIRS = 5;

// Legacy alias — kept temporarily so any old call sites keep compiling.
// New code should use MAX_PAIRS.
export const MAX_SELECTED_MODES = MAX_PAIRS;
