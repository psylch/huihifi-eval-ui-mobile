import { INDICATOR_STYLES, SCORE_RANGE } from '../constants';

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

// Clamp first so out-of-range scores pin to 0%/100% instead of overflowing.
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
      className="flex flex-col gap-2 pb-6 last:pb-0 last:border-b-0"
      style={{ borderBottom: '1px solid var(--border-inner-well)' }}
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

      <div className="flex flex-col gap-2 mt-2">
        {modeScores.map((ms, index) => {
          const style = INDICATOR_STYLES[index] ?? INDICATOR_STYLES[0];
          const position = scoreToPosition(ms.score);

          return (
            <div
              key={ms.tuningMode}
              className="flex items-center gap-2"
            >
              <span
                className="text-[10px] font-medium select-none w-3 text-center"
                style={{ color: 'var(--text-tertiary)' }}
                aria-hidden="true"
              >
                {'\u2212'}
              </span>

              <div className="bar-axis flex-1 rounded-full">
                <span
                  className="absolute top-1/2 left-1/2 w-px h-2 -translate-x-1/2 -translate-y-1/2"
                  style={{ background: 'var(--text-tertiary)', opacity: 0.5 }}
                />
                <span
                  className={`bar-indicator ${style.shape}`}
                  style={{ left: `${position}%` }}
                />
              </div>

              <span
                className="text-[10px] font-medium select-none w-3 text-center"
                style={{ color: 'var(--text-tertiary)' }}
                aria-hidden="true"
              >
                {'\u002B'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
