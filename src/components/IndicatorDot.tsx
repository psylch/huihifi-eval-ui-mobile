import type { IndicatorShape } from '../constants';

// Inline-positioned wrapper around the absolutely-positioned `.bar-indicator`
// CSS class. Used wherever an indicator needs to render inside flow layout
// (mode tag list, selector list) — the `.bar-axis` host case in BarChart
// uses the absolute form directly.
export function IndicatorDot({ shape }: { shape: IndicatorShape }) {
  return (
    <span className="relative inline-block w-3 h-3 align-middle">
      <span
        className={`bar-indicator ${shape}`}
        style={{ left: '50%', top: '50%' }}
      />
    </span>
  );
}
