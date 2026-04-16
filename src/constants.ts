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
// Aligned with the ranking v3 zone axis (±6 dB — `very_high` upper edge
// at +6 and `very_low` lower edge at −6). See ZONES below and
// docs/decisions/D006-five-zone-scoring-modes.md.
export const SCORE_RANGE = 6;

// Preference zones mirror the ranking backend (formula_parser.py
// ZONE_CENTERS). Each zone is an absolute dB range on the relative-to-
// VDSF scale, used to render a mini color ruler under every BarChart so
// users can see which preference bucket an indicator falls into.
//
// Zones are asymmetric in width: neutral is widest (±1.5), the outer
// zones are 2.5 dB wide, middle zones are 2.0 dB wide. Colors match
// huihifi-eval-ui RankingPage ZONES so cross-feature semantics stay
// consistent: red = very_high, blue = very_low.
export const ZONES = [
  { key: 'very_low', label: '很低', min: -SCORE_RANGE, max: -3.5, color: '#60A5FA' },
  { key: 'low', label: '稍低', min: -3.5, max: -1.5, color: '#22D3EE' },
  { key: 'neutral', label: '中性', min: -1.5, max: 1.5, color: '#9CA3AF' },
  { key: 'high', label: '稍高', min: 1.5, max: 3.5, color: '#FB923C' },
  { key: 'very_high', label: '很高', min: 3.5, max: SCORE_RANGE, color: '#F87171' },
] as const;

export type ZoneKey = (typeof ZONES)[number]['key'];

// Indicator shape per selection slot. Color lives in src/index.css
// under `.bar-indicator.{filled,outline,diamond}` via `--accent-primary`
// and `--accent-secondary`.
export const INDICATOR_STYLES = [
  { shape: 'filled' as const },
  { shape: 'outline' as const },
  { shape: 'diamond' as const },
] as const;

export type IndicatorShape = (typeof INDICATOR_STYLES)[number]['shape'];

export const MAX_SELECTED_MODES = 3;
