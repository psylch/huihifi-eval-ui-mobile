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

export interface UrlParams {
  productId: string;
  // null = caller did not specify; fall back to API default tuning mode.
  // non-null = explicit list, already capped to MAX_SELECTED_MODES entries.
  modes: string[] | null;
  category: SubTabId;
  theme: Theme;
}

export interface ModeData {
  tuningMode: string;
  scores: Record<string, ScoreItem[]>;
}

export interface FetchResult {
  product: {
    uuid: string;
    title: string;
    brand: Brand;
    categoryName: string;
    availableTuningModes: string[];
  };
  modes: ModeData[];
}
