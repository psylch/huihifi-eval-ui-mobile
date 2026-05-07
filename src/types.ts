// Types for mobile WebView — aligned with huihifi-eval-api Pydantic schemas.

export type ErrorKind = 'missing-param' | 'not-found' | 'network';

export interface Brand {
  title: string;
}

export interface ScoreItem {
  name: string;
  range: string;
  score: number;
}

export interface ProductDetail {
  uuid: string;
  title: string;
  brand: Brand;
  categoryName: string;
  tuningMode: string;
  availableTuningModes: string[];
  scores: Record<string, ScoreItem[]>;
}

export type Theme = 'light' | 'dark';

import type { SubTabId } from './constants';
import type { ProductInput } from './bridge/types';

export interface UrlParams {
  // Canonical (product, modes) groups parsed from URL. Empty `modes` for
  // a product means "use API default mode" (consumes one pair slot).
  // Already capped to MAX_PAIRS pair slots in total.
  products: ProductInput[];
  category: SubTabId;
  theme: Theme;
}

// One resolved (product, mode) data point — what the BarChart row maps to.
export interface PairData {
  productId: string;
  productTitle: string;
  brand: Brand;
  tuningMode: string;
  scores: Record<string, ScoreItem[]>;
  // Per-product available modes — kept on each pair for convenience even
  // though it's the same for sibling pairs of the same product.
  availableTuningModes: string[];
}

export interface FetchResult {
  pairs: PairData[];
}
