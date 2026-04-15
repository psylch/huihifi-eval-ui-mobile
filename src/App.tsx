import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchProductWithModes,
  getProductDetail,
  PRODUCT_NOT_FOUND,
} from './api/client';
import { BarChart } from './components/BarChart';
import { ErrorState } from './components/ErrorState';
import { IndicatorDot } from './components/IndicatorDot';
import { LoadingState } from './components/LoadingState';
import { SubTabBar } from './components/SubTabBar';
import { TuningModeSelector } from './components/TuningModeSelector';
import { INDICATOR_STYLES, SUB_TABS, type SubTabId } from './constants';
import { useTheme } from './hooks/useTheme';
import { useUrlParams } from './hooks/useUrlParams';
import type { ErrorKind, FetchResult, ModeData, ScoreItem } from './types';

interface AppError {
  kind: ErrorKind;
  message?: string;
}

function toAppError(e: unknown): AppError {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === PRODUCT_NOT_FOUND) return { kind: 'not-found' };
  return { kind: 'network', message: msg };
}

export default function App() {
  const params = useUrlParams();
  useTheme(params.theme);

  // `data.modes` accumulates every mode we've ever fetched for this session,
  // so switching back to a previously-loaded mode is instant. `selectedModes`
  // is the projection currently rendered (subset & order, length 1..3).
  const [data, setData] = useState<FetchResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<SubTabId>(params.category);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  const initialLoad = useCallback(async () => {
    if (!params.productId) {
      setError({ kind: 'missing-param' });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchProductWithModes(params.productId, params.modes);
      setData(result);
      setSelectedModes(result.modes.map((m) => m.tuningMode));
    } catch (e: unknown) {
      setError(toAppError(e));
    } finally {
      setIsLoading(false);
    }
  }, [params.productId, params.modes]);

  useEffect(() => {
    void initialLoad();
  }, [initialLoad]);

  const handleConfirmModes = async (newModes: string[]) => {
    if (!data) return;
    const haveCache = new Set(data.modes.map((m) => m.tuningMode));
    const missing = newModes.filter((m) => !haveCache.has(m));

    if (missing.length === 0) {
      setSelectedModes(newModes);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetched = await Promise.all(
        missing.map((m) => getProductDetail(params.productId, m)),
      );
      const newModeData: ModeData[] = fetched.map((d) => ({
        tuningMode: d.tuningMode,
        scores: d.scores,
      }));
      setData({
        ...data,
        modes: [...data.modes, ...newModeData],
      });
      setSelectedModes(newModes);
    } catch (e: unknown) {
      setError(toAppError(e));
    } finally {
      setIsLoading(false);
    }
  };

  // Per-category presence flag based only on currently selected modes.
  const availability = useMemo<Partial<Record<SubTabId, boolean>>>(() => {
    if (!data || selectedModes.length === 0) return {};
    const selected = selectedModes
      .map((name) => data.modes.find((m) => m.tuningMode === name))
      .filter((m): m is ModeData => m !== undefined);

    const result: Partial<Record<SubTabId, boolean>> = {};
    for (const tab of SUB_TABS) {
      result[tab.id] = selected.some((m) => {
        const arr = m.scores[tab.sheetKey];
        return Array.isArray(arr) && arr.length > 0;
      });
    }
    return result;
  }, [data, selectedModes]);

  // Active category dimensions, joined across selected modes via Map lookups
  // so the inner loop is O(1) per (dim, mode) cell.
  const dimensions = useMemo(() => {
    if (!data) return [];
    const sheetKey = SUB_TABS.find((t) => t.id === activeCategory)?.sheetKey;
    if (!sheetKey) return [];

    const modeIndex = new Map(data.modes.map((m) => [m.tuningMode, m]));
    const perMode = selectedModes
      .map((name) => modeIndex.get(name))
      .filter((m): m is ModeData => m !== undefined)
      .map((m) => ({
        tuningMode: m.tuningMode,
        byName: new Map<string, ScoreItem>(
          (m.scores[sheetKey] ?? []).map((s) => [s.name, s]),
        ),
      }));

    if (perMode.length === 0) return [];

    const canonical = perMode.find((p) => p.byName.size > 0);
    if (!canonical) return [];

    // Use the canonical mode's source list to preserve dimension order.
    const canonicalMode = data.modes.find((m) => m.tuningMode === canonical.tuningMode);
    const canonicalDims = canonicalMode?.scores[sheetKey] ?? [];

    return canonicalDims.map((canon) => ({
      name: canon.name,
      range: canon.range,
      modeScores: perMode.map(({ tuningMode, byName }) => ({
        tuningMode,
        score: byName.get(canon.name)?.score ?? 0,
      })),
    }));
  }, [data, activeCategory, selectedModes]);

  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return (
      <ErrorState
        kind={error.kind}
        message={error.message}
        onRetry={error.kind === 'network' ? () => void initialLoad() : undefined}
      />
    );
  }
  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <div className="mb-4 animate-fade-in">
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {data.product.title}
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {data.product.brand.title} · {data.product.categoryName}
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-4 mb-4 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <span
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              当前调音模式
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {selectedModes.map((mode, idx) => {
                const shape = INDICATOR_STYLES[idx]?.shape ?? 'filled';
                return (
                  <div key={mode} className="flex items-center gap-1.5">
                    <IndicatorDot shape={shape} />
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {mode}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSelector(true)}
            className="px-4 py-2 rounded-full text-[13px] font-semibold tap-depth shrink-0"
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFFFF',
            }}
          >
            切换
          </button>
        </div>
      </div>

      <SubTabBar
        activeTab={activeCategory}
        onChange={setActiveCategory}
        availability={availability}
      />

      <div className="glass-panel rounded-2xl p-5 mt-4 animate-fade-in-up">
        {dimensions.length === 0 ? (
          <p
            className="text-center text-sm py-12"
            style={{ color: 'var(--text-tertiary)' }}
          >
            该产品暂无此类别数据
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {dimensions.map((dim) => (
              <BarChart
                key={dim.name}
                dimensionName={dim.name}
                freqRange={dim.range}
                modeScores={dim.modeScores}
              />
            ))}
          </div>
        )}
      </div>

      <TuningModeSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        availableModes={data.product.availableTuningModes}
        selectedModes={selectedModes}
        onConfirm={handleConfirmModes}
      />
    </div>
  );
}
