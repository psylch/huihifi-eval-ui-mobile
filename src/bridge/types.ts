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

// ====== Inbound (RN host → WebView) ======

export interface InitPayload {
  userToken: string | null;
  theme: ThemeMode;
  safeAreaInsets: SafeAreaInsets;
  // Eval-specific (replaces URL ?product_id=&modes=&category=)
  productId: string;
  modes: string[];
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
