import { MAX_SELECTED_MODES } from '../constants';
import type { FetchResult, ModeData, ProductDetail } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// Sentinel error message for missing products. Upper layers can match on
// `error.message === PRODUCT_NOT_FOUND` to render a dedicated empty state.
export const PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND';

export async function getProductDetail(
  productId: string,
  tuningMode?: string,
): Promise<ProductDetail> {
  const query = tuningMode ? `?tuning_mode=${encodeURIComponent(tuningMode)}` : '';
  const res = await fetch(`${API_BASE}/api/products/${productId}${query}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(PRODUCT_NOT_FOUND);
    }
    throw new Error(`Get product detail failed: ${res.statusText}`);
  }
  return res.json() as Promise<ProductDetail>;
}

// Fetch a product across one or more tuning modes and merge the results.
// - `requestedModes === null` → use the API default (first available mode).
// - otherwise → keep only modes present in `availableTuningModes`, cap at
//   MAX_SELECTED_MODES, silently drop unknown entries. If filtering produces
//   an empty list, fall back to the default mode.
//
// The first network call doubles as the source of `availableTuningModes` and
// is reused for whichever mode the API returned, avoiding a duplicate fetch.
export async function fetchProductWithModes(
  productId: string,
  requestedModes: string[] | null,
): Promise<FetchResult> {
  const initial = await getProductDetail(productId);
  const available = initial.availableTuningModes;

  let targetModes: string[];
  if (requestedModes === null) {
    targetModes = [available[0]];
  } else {
    const filtered = requestedModes
      .filter((m) => available.includes(m))
      .slice(0, MAX_SELECTED_MODES);
    targetModes = filtered.length > 0 ? filtered : [available[0]];
  }

  const cache = new Map<string, ModeData>();
  cache.set(initial.tuningMode, {
    tuningMode: initial.tuningMode,
    scores: initial.scores,
  });

  const missing = targetModes.filter((m) => !cache.has(m));
  const fetched = await Promise.all(
    missing.map(async (mode) => {
      const detail = await getProductDetail(productId, mode);
      return {
        tuningMode: detail.tuningMode,
        scores: detail.scores,
      } satisfies ModeData;
    }),
  );
  for (const item of fetched) {
    cache.set(item.tuningMode, item);
  }

  const modes: ModeData[] = targetModes
    .map((m) => cache.get(m))
    .filter((m): m is ModeData => m !== undefined);

  return {
    product: {
      uuid: initial.uuid,
      title: initial.title,
      brand: initial.brand,
      categoryName: initial.categoryName,
      availableTuningModes: available,
    },
    modes,
  };
}
