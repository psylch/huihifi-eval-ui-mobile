import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MAX_SELECTED_MODES, SUB_TABS, type SubTabId } from '../constants';
import { listenForMessages, sendBridgeMessage } from './client';
import type { InboundMessage, SafeAreaInsets, ThemeMode } from './types';

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
  productId: string;
  modes: string[];
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

// ====== Provider ======

export function BridgeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BridgeState>({
    isReady: false,
    userToken: null,
    theme: 'light',
    safeAreaInsets: DEFAULT_INSETS,
    productId: '',
    modes: [],
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
            productId: d.productId,
            modes: (d.modes ?? []).slice(0, MAX_SELECTED_MODES),
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
    // fall back to URL parameters (development convenience, also keeps
    // `/?product_id=xxx` working for quick manual testing).
    const timer = setTimeout(() => {
      if (initReceivedRef.current) return;
      const params = new URLSearchParams(window.location.search);
      const theme: ThemeMode = params.get('theme') === 'dark' ? 'dark' : 'light';
      applyTheme(theme);
      const rawModes = params.get('modes');
      setState({
        isReady: true,
        userToken: null,
        theme,
        safeAreaInsets: DEFAULT_INSETS,
        productId: params.get('product_id') ?? '',
        modes: rawModes
          ? rawModes.split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX_SELECTED_MODES)
          : [],
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
