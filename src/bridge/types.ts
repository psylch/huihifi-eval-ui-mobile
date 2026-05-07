// Bridge message protocol — unified with aituning-fe-mobile.
// All messages use the same envelope: { type: string, data?: any }.
// Host uses `window.ReactNativeWebView?.postMessage(JSON.stringify(msg))`
// for outbound and `window.addEventListener('message')` for inbound.

export type ThemeMode = 'light' | 'dark';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// A (product, modes) group — one product with one-or-more tuning modes.
// Mirrors huihifi-eval-ui `ProductInput` so PC and mobile share one schema.
export interface ProductInput {
  productId: string;
  modes: string[];
}

// ====== Inbound (RN host → WebView) ======

export interface InitPayload {
  userToken: string | null;
  theme: ThemeMode;
  safeAreaInsets: SafeAreaInsets;
  // Eval-specific. `products` is the canonical form (aligned with PC
  // microapp). `productId` + `modes` are accepted as a legacy single-
  // product shortcut and converted on receipt.
  products?: ProductInput[];
  productId?: string;
  modes?: string[];
  category?: string;
}

export interface SharedDataUpdatePayload {
  theme?: ThemeMode;
  safeAreaInsets?: SafeAreaInsets;
}

export type InboundMessage =
  | { type: 'init'; data: InitPayload }
  | { type: 'shared-data-update'; data: SharedDataUpdatePayload }
  | { type: 'close-request' };

// ====== Outbound (WebView → RN host) ======

export type OutboundMessage =
  | { type: 'ready' }
  | { type: 'navigate-back' }
  | { type: 'auth-required' };
