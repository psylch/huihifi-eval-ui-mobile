import { INDICATOR_STYLES, SCORE_RANGE, ZONES } from '../constants';

interface ModeScore {
  tuningMode: string;
  score: number;
}

interface BarChartProps {
  dimensionName: string;
  freqRange: string;
  // Order matches `selectedModes` / `INDICATOR_STYLES` so index N always
  // gets the Nth indicator style.
  modeScores: ModeScore[];
}

const clamp = (x: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, x));

// Map a dB score on [-SCORE_RANGE, +SCORE_RANGE] into a visual
// percentage on [0, 100]. Clamp first so out-of-range scores pin to
// the axis edges instead of overflowing.
function scoreToPosition(score: number): number {
  const clamped = clamp(score, -SCORE_RANGE, SCORE_RANGE);
  return 50 + (clamped / SCORE_RANGE) * 50;
}

export function BarChart({
  dimensionName,
  freqRange,
  modeScores,
}: BarChartProps) {
  return (
    <div
      className="flex flex-col gap-2 pb-6 last:pb-0 last:border-b-0 border-b"
      style={{ borderColor: 'var(--border-inner-well)' }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p
            className="text-[14px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {dimensionName}
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {freqRange}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mt-2">
        {modeScores.map((ms, index) => {
          const style = INDICATOR_STYLES[index] ?? INDICATOR_STYLES[0];
          const position = scoreToPosition(ms.score);

          return (
            <div
              key={ms.tuningMode}
              className="bar-axis rounded-full"
            >
              <span
                className="absolute top-1/2 left-1/2 w-px h-2 -translate-x-1/2 -translate-y-1/2"
                style={{ background: 'var(--text-tertiary)', opacity: 0.5 }}
              />
              <span
                className={`bar-indicator ${style.shape}`}
                style={{ left: `${position}%` }}
              />
            </div>
          );
        })}
      </div>

      <ZoneRuler />
    </div>
  );
}

// Mini 5-segment color ruler that mirrors ranking v3's zone axis.
// Rendered once per dimension — the position of every indicator above
// can be visually matched against the zone it falls into. Segment
// widths are proportional to dB span on the same ±SCORE_RANGE scale
// used by `scoreToPosition`, so indicators and segments align exactly.
function ZoneRuler() {
  return (
    <div className="mt-2 select-none" aria-hidden="true">
      <div className="flex h-1.5 rounded-full overflow-hidden">
        {ZONES.map((zone) => {
          const widthPct = ((zone.max - zone.min) / (2 * SCORE_RANGE)) * 100;
          return (
            <div
              key={zone.key}
              style={{
                width: `${widthPct}%`,
                backgroundColor: zone.color,
                opacity: 0.55,
              }}
            />
          );
        })}
      </div>
      <div className="flex mt-1">
        {ZONES.map((zone) => {
          const widthPct = ((zone.max - zone.min) / (2 * SCORE_RANGE)) * 100;
          return (
            <div
              key={zone.key}
              className="text-[9px] font-medium text-center"
              style={{
                width: `${widthPct}%`,
                color: zone.color,
              }}
            >
              {zone.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
