import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MAX_PAIRS, SUB_TABS, type SubTabId } from '../constants';
import { listenForMessages, sendBridgeMessage } from './client';
import type {
  InboundMessage,
  InitPayload,
  ProductInput,
  SafeAreaInsets,
  ThemeMode,
} from './types';
import { parseProductsFromSearch } from '../hooks/useUrlParams';

function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme);
}

function applySafeAreaInsets(insets: SafeAreaInsets): void {
  const s = document.documentElement.style;
  s.setProperty('--sai-top', `${insets.top}px`);
  s.setProperty('--sai-right', `${insets.right}px`);
  s.setProperty('--sai-bottom', `${insets.bottom}px`);
  s.setProperty('--sai-left', `${insets.left}px`);
}

// ====== State ======

export interface BridgeState {
  isReady: boolean;
  userToken: string | null;
  theme: ThemeMode;
  safeAreaInsets: SafeAreaInsets;
  products: ProductInput[];
  category: SubTabId;
}

export interface BridgeActions {
  emitNavigateBack: () => void;
  emitAuthRequired: () => void;
}

type BridgeContextValue = BridgeState & BridgeActions;

const BridgeContext = createContext<BridgeContextValue | null>(null);

const DEFAULT_INSETS: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const STANDALONE_TIMEOUT_MS = 2000;
const VALID_CATEGORIES = new Set<string>(SUB_TABS.map((t) => t.id));

function parseCategory(raw: string | null | undefined): SubTabId {
  if (raw && VALID_CATEGORIES.has(raw)) return raw as SubTabId;
  return SUB_TABS[0].id;
}

// Distribute a global pair budget across grouped products. Earlier groups
// keep their full mode list; later groups shrink as the budget runs out.
// A product with empty `modes` consumes one slot (resolved later via API
// default mode).
export function capPairs(products: ProductInput[], maxPairs: number): ProductInput[] {
  const out: ProductInput[] = [];
  let remaining = maxPairs;
  for (const p of products) {
    if (remaining <= 0) break;
    const modes = p.modes.length > 0 ? p.modes.slice(0, remaining) : [];
    const consumed = modes.length > 0 ? modes.length : 1;
    out.push({ productId: p.productId, modes });
    remaining -= consumed;
  }
  return out;
}

// Normalize an init payload into the canonical `products: ProductInput[]`
// form. Accepts the legacy `productId + modes` shortcut for one-product
// callers.
function normalizeInitProducts(payload: InitPayload): ProductInput[] {
  const raw: ProductInput[] = Array.isArray(payload.products)
    ? payload.products
        .filter(
          (p): p is ProductInput =>
            !!p && typeof p.productId === 'string' && p.productId.length > 0,
        )
        .map((p) => ({
          productId: p.productId,
          modes: Array.isArray(p.modes)
            ? p.modes.filter((m) => typeof m === 'string' && m.length > 0)
            : [],
        }))
    : payload.productId
      ? [
          {
            productId: payload.productId,
            modes: Array.isArray(payload.modes)
              ? payload.modes.filter((m) => typeof m === 'string' && m.length > 0)
              : [],
          },
        ]
      : [];

  return capPairs(raw, MAX_PAIRS);
}

// ====== Provider ======

export function BridgeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BridgeState>({
    isReady: false,
    userToken: null,
    theme: 'light',
    safeAreaInsets: DEFAULT_INSETS,
    products: [],
    category: SUB_TABS[0].id,
  });
  const initReceivedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = listenForMessages((msg: InboundMessage) => {
      switch (msg.type) {
        case 'init': {
          initReceivedRef.current = true;
          const d = msg.data;
          applyTheme(d.theme);
          applySafeAreaInsets(d.safeAreaInsets ?? DEFAULT_INSETS);
          setState({
            isReady: true,
            userToken: d.userToken,
            theme: d.theme,
            safeAreaInsets: d.safeAreaInsets ?? DEFAULT_INSETS,
            products: normalizeInitProducts(d),
            category: parseCategory(d.category),
          });
          break;
        }
        case 'shared-data-update': {
          const d = msg.data;
          if (d.theme) applyTheme(d.theme);
          if (d.safeAreaInsets) applySafeAreaInsets(d.safeAreaInsets);
          setState((prev) => ({
            ...prev,
            ...(d.theme && { theme: d.theme }),
            ...(d.safeAreaInsets && { safeAreaInsets: d.safeAreaInsets }),
          }));
          break;
        }
        case 'close-request':
          break;
      }
    });

    sendBridgeMessage({ type: 'ready' });

    // Standalone / iframe fallback: if no init arrives within timeout,
    // fall back to URL parameters. Supports PC-aligned `p1/m1...pN/mN`
    // and `product/mode`, plus the legacy `product_id/modes` form.
    const timer = setTimeout(() => {
      if (initReceivedRef.current) return;
      const params = new URLSearchParams(window.location.search);
      const theme: ThemeMode = params.get('theme') === 'dark' ? 'dark' : 'light';
      applyTheme(theme);
      setState({
        isReady: true,
        userToken: null,
        theme,
        safeAreaInsets: DEFAULT_INSETS,
        products: capPairs(parseProductsFromSearch(params), MAX_PAIRS),
        category: parseCategory(params.get('category')),
      });
    }, STANDALONE_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const actions: BridgeActions = useMemo(
    () => ({
      emitNavigateBack: () => sendBridgeMessage({ type: 'navigate-back' }),
      emitAuthRequired: () => sendBridgeMessage({ type: 'auth-required' }),
    }),
    [],
  );

  const value = useMemo<BridgeContextValue>(
    () => ({ ...state, ...actions }),
    [state, actions],
  );

  return (
    <BridgeContext.Provider value={value}>{children}</BridgeContext.Provider>
  );
}

export function useBridge(): BridgeContextValue {
  const ctx = useContext(BridgeContext);
  if (!ctx) throw new Error('useBridge must be used within BridgeProvider');
  return ctx;
}
