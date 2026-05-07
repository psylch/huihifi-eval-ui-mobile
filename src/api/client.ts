import { MAX_PAIRS } from '../constants';
import type { ProductInput } from '../bridge/types';
import type { FetchResult, PairData, ProductDetail } from '../types';

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

// Fetch one (product, mode) pair, reusing a shared per-product cache so
// the first call for each product doubles as the source of truth for
// `availableTuningModes` and the default mode.
async function resolveProductModes(
  product: ProductInput,
  productCache: Map<string, ProductDetail>,
  pairs: PairData[],
  remainingBudgetRef: { value: number },
): Promise<void> {
  if (remainingBudgetRef.value <= 0) return;

  const initial =
    productCache.get(product.productId) ??
    (await getProductDetail(product.productId));
  productCache.set(product.productId, initial);
  const available = initial.availableTuningModes;

  const requested = product.modes.length > 0 ? product.modes : null;
  let targetModes: string[];
  if (requested === null) {
    targetModes = [available[0]];
  } else {
    const filtered = requested.filter((m) => available.includes(m));
    targetModes = filtered.length > 0 ? filtered : [available[0]];
  }

  // Honor the global pair budget — earlier products may have already
  // consumed slots.
  targetModes = targetModes.slice(0, remainingBudgetRef.value);

  // Per-mode fetch cache so repeated mode names don't double-fetch.
  const modeCache = new Map<string, ProductDetail>();
  modeCache.set(initial.tuningMode, initial);

  for (const mode of targetModes) {
    if (!modeCache.has(mode)) {
      const detail = await getProductDetail(product.productId, mode);
      modeCache.set(detail.tuningMode, detail);
    }
    const detail = modeCache.get(mode);
    if (!detail) continue;
    pairs.push({
      productId: initial.uuid,
      productTitle: initial.title,
      brand: initial.brand,
      tuningMode: detail.tuningMode,
      scores: detail.scores,
      availableTuningModes: available,
    });
    remainingBudgetRef.value -= 1;
  }
}

// Resolve a list of `ProductInput` groups into a flat array of
// `PairData`. Total pair count is capped at MAX_PAIRS even if upstream
// caps got bypassed.
export async function fetchPairs(
  products: ProductInput[],
): Promise<FetchResult> {
  const pairs: PairData[] = [];
  const productCache = new Map<string, ProductDetail>();
  const remainingBudgetRef = { value: MAX_PAIRS };

  for (const product of products) {
    if (remainingBudgetRef.value <= 0) break;
    await resolveProductModes(product, productCache, pairs, remainingBudgetRef);
  }

  return { pairs };
}
