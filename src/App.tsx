import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPairs, PRODUCT_NOT_FOUND } from './api/client';
import { useBridge } from './bridge';
import { BarChart } from './components/BarChart';
import { ErrorState } from './components/ErrorState';
import { LoadingState } from './components/LoadingState';
import { SubTabBar } from './components/SubTabBar';
import { SUB_TABS, type SubTabId } from './constants';
import type { ErrorKind, FetchResult, PairData, ScoreItem } from './types';

interface AppError {
  kind: ErrorKind;
  message?: string;
}

function toAppError(e: unknown): AppError {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === PRODUCT_NOT_FOUND) return { kind: 'not-found' };
  return { kind: 'network', message: msg };
}

function pairKey(p: { productId: string; tuningMode: string }): string {
  return `${p.productId}::${p.tuningMode}`;
}

export default function App() {
  const bridge = useBridge();

  const [data, setData] = useState<FetchResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<SubTabId>(bridge.category);

  const loadData = useCallback(async () => {
    if (bridge.products.length === 0) {
      setError({ kind: 'missing-param' });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPairs(bridge.products);
      if (result.pairs.length === 0) {
        setError({ kind: 'not-found' });
      } else {
        setData(result);
      }
    } catch (e: unknown) {
      setError(toAppError(e));
    } finally {
      setIsLoading(false);
    }
  }, [bridge.products]);

  // Fetch when bridge becomes ready (init received or URL fallback)
  useEffect(() => {
    if (!bridge.isReady) return;
    void loadData();
  }, [bridge.isReady, loadData]);

  // Sync category if bridge sends a new one (e.g. re-init)
  useEffect(() => {
    if (bridge.isReady) setActiveCategory(bridge.category);
  }, [bridge.isReady, bridge.category]);

  const availability = useMemo<Partial<Record<SubTabId, boolean>>>(() => {
    if (!data) return {};
    const result: Partial<Record<SubTabId, boolean>> = {};
    for (const tab of SUB_TABS) {
      result[tab.id] = data.pairs.some((p) => {
        const arr = p.scores[tab.sheetKey];
        return Array.isArray(arr) && arr.length > 0;
      });
    }
    return result;
  }, [data]);

  const dimensions = useMemo(() => {
    if (!data) return [];
    const sheetKey = SUB_TABS.find((t) => t.id === activeCategory)?.sheetKey;
    if (!sheetKey) return [];

    const perPair = data.pairs.map((p) => ({
      pair: p,
      byName: new Map<string, ScoreItem>(
        (p.scores[sheetKey] ?? []).map((s) => [s.name, s]),
      ),
    }));

    if (perPair.length === 0) return [];

    // Pick the first pair with non-empty data as the dimension template
    // (so axis labels and freq ranges come from real data).
    const canonical = perPair.find((p) => p.byName.size > 0);
    if (!canonical) return [];

    const canonicalDims = canonical.pair.scores[sheetKey] ?? [];

    return canonicalDims.map((canon) => ({
      name: canon.name,
      range: canon.range,
      pairScores: perPair.map(({ pair, byName }) => ({
        key: pairKey(pair),
        score: byName.get(canon.name)?.score ?? 0,
      })),
    }));
  }, [data, activeCategory]);

  // Wait for bridge to be ready before showing anything
  if (!bridge.isReady || isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return (
      <ErrorState
        kind={error.kind}
        message={error.message}
        onRetry={error.kind === 'network' ? () => void loadData() : undefined}
      />
    );
  }
  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen px-5 pt-5 pb-10">
      <SubTabBar
        activeTab={activeCategory}
        onChange={setActiveCategory}
        availability={availability}
      />

      <div
        className="glass-panel p-1 mt-4 animate-fade-in-up"
        style={{ borderRadius: '28px' }}
      >
        <div
          className="p-5 border"
          style={{
            background: 'var(--bg-inner-well)',
            borderColor: 'var(--border-inner-well)',
            borderRadius: '24px',
          }}
        >
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
                  pairScores={dim.pairScores}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Re-exported for any external consumer that imports types alongside App.
export type { PairData };
