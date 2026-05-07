import { useMemo } from 'react';
import { MAX_PAIRS, SUB_TABS, type SubTabId } from '../constants';
import type { ProductInput } from '../bridge/types';
import type { Theme, UrlParams } from '../types';

const VALID_CATEGORY_IDS = new Set<string>(SUB_TABS.map((t) => t.id));
const DEFAULT_CATEGORY: SubTabId = SUB_TABS[0].id;

function splitModes(raw: string | null): string[] {
  if (raw === null) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseCategory(raw: string | null): SubTabId {
  if (raw && VALID_CATEGORY_IDS.has(raw)) {
    return raw as SubTabId;
  }
  return DEFAULT_CATEGORY;
}

function parseTheme(raw: string | null): Theme {
  return raw === 'dark' ? 'dark' : 'light';
}

// Parse a `URLSearchParams` into the canonical `ProductInput[]` form.
// Recognizes three formats, in priority order:
//   1. `?p1=<uuid>&m1=<modes>...&pN=<uuid>&mN=<modes>` (PC multi-product)
//   2. `?product=<uuid>&mode=<modes>`                  (PC single)
//   3. `?product_id=<uuid>&modes=<modes>`              (legacy mobile)
// Modes are comma-separated. Returns [] if no recognized params.
//
// Caller is responsible for global pair cap (MAX_PAIRS) via `capPairs` —
// done in BridgeProvider URL fallback. Local callers that don't run
// through the bridge should also cap themselves.
export function parseProductsFromSearch(params: URLSearchParams): ProductInput[] {
  // Format 1: pN/mN (multi-product, also handles N=1)
  const indices: number[] = [];
  for (const key of params.keys()) {
    const m = key.match(/^p(\d+)$/);
    if (m) indices.push(parseInt(m[1], 10));
  }
  if (indices.length > 0) {
    indices.sort((a, b) => a - b);
    const out: ProductInput[] = [];
    for (const i of indices) {
      const productId = params.get(`p${i}`);
      if (!productId) continue;
      out.push({ productId, modes: splitModes(params.get(`m${i}`)) });
    }
    return out;
  }

  // Format 2: ?product=&mode=
  const productAlias = params.get('product');
  if (productAlias) {
    return [{ productId: productAlias, modes: splitModes(params.get('mode')) }];
  }

  // Format 3: legacy ?product_id=&modes=
  const legacyId = params.get('product_id');
  if (legacyId) {
    return [{ productId: legacyId, modes: splitModes(params.get('modes')) }];
  }

  return [];
}

// The WebView is a one-shot entry: parameters are injected once at mount
// and never change during the session, so we intentionally do not subscribe
// to URL changes.
export function useUrlParams(): UrlParams {
  return useMemo<UrlParams>(() => {
    const search = new URLSearchParams(window.location.search);
    const products = parseProductsFromSearch(search).slice(0, MAX_PAIRS);
    return {
      products,
      category: parseCategory(search.get('category')),
      theme: parseTheme(search.get('theme')),
    };
  }, []);
}
