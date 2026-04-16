import { useCallback, useEffect, useRef, useState } from 'react';
import type { InitPayload, ThemeMode } from '../bridge';
import { FakeHostChrome } from './FakeHostChrome';
import { PhoneFrame } from './PhoneFrame';
import { ProductControls } from './ProductControls';

const DEFAULT_PRODUCT_ID = '7230fa92-72c5-4a8c-a369-6440413cd6c1';

interface Product {
  uuid: string;
  title: string;
  brand: { title: string };
  categoryName?: string;
  availableTuningModes: string[];
}

type MainTab = 'perception' | 'curves';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// iPhone 14 safe-area approximation (status bar 47, home indicator 34)
const SAFE_AREA = { top: 47, right: 0, bottom: 34, left: 0 };

export default function HostApp() {
  const [productId, setProductId] = useState(DEFAULT_PRODUCT_ID);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [category, setCategory] = useState('frequency');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [lastBridgeEvent, setLastBridgeEvent] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('perception');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch product to populate mode checkboxes
  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setSelectedModes([]);
      setProductError(null);
      return;
    }
    let cancelled = false;
    setProductError(null);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setProduct({
          uuid: data.uuid,
          title: data.title,
          brand: data.brand,
          categoryName: data.categoryName,
          availableTuningModes: data.availableTuningModes,
        });
        setSelectedModes([data.availableTuningModes[0]]);
      } catch (e) {
        if (cancelled) return;
        setProduct(null);
        setSelectedModes([]);
        setProductError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Build the init payload from current control-panel state
  const buildInitPayload = useCallback(
    (): InitPayload => ({
      userToken: null,
      theme,
      safeAreaInsets: SAFE_AREA,
      productId,
      modes: selectedModes,
      category,
    }),
    [productId, selectedModes, category, theme],
  );

  // Send a bridge message to the iframe WebView
  const sendToWebView = useCallback(
    (msg: { type: string; data?: unknown }) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(JSON.stringify(msg), '*');
      setLastBridgeEvent(`→ ${msg.type}`);
    },
    [],
  );

  // Listen for outbound messages from the iframe (ready / navigate-back / auth-required)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      try {
        const raw =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!raw?.type) return;

        setLastBridgeEvent(`← ${raw.type}`);

        if (raw.type === 'ready') {
          // WebView mounted — send init
          sendToWebView({ type: 'init', data: buildInitPayload() });
        }
      } catch {
        // Ignore non-bridge messages (e.g. Vite HMR)
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [buildInitPayload, sendToWebView]);

  // When control-panel state changes, re-send init to reload the WebView
  // content without rebuilding the iframe. We use a counter-key to force
  // iframe recreation so the bridge handshake restarts cleanly.
  const [iframeKey, setIframeKey] = useState(0);
  const reloadWebView = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  // Reload iframe when product / modes / category / theme change
  useEffect(() => {
    reloadWebView();
  }, [productId, selectedModes, category, theme, reloadWebView]);

  // Runtime theme injection via shared-data-update (doesn't reload iframe)
  const injectThemeUpdate = (next: ThemeMode) => {
    sendToWebView({ type: 'shared-data-update', data: { theme: next } });
    setLastBridgeEvent(`→ shared-data-update (theme: ${next})`);
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-[340px] shrink-0 p-6 border-r border-[#d6d9dd] bg-white flex flex-col gap-6 overflow-y-auto">
        <header>
          <h1 className="text-base font-bold tracking-tight">宿主仿真</h1>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            模拟合作方 RN App。控件变更会通过 <code>postMessage</code>{' '}
            bridge 推送到 iframe WebView（和真实 RN 行为一致）。
          </p>
        </header>

        <ProductControls
          productId={productId}
          onProductIdChange={setProductId}
          product={product}
          productError={productError}
          selectedModes={selectedModes}
          onSelectedModesChange={setSelectedModes}
          category={category}
          onCategoryChange={setCategory}
        />

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            初始主题（init payload）
          </h2>
          <div className="flex gap-2">
            <ThemeChip active={theme === 'light'} onClick={() => setTheme('light')}>
              light
            </ThemeChip>
            <ThemeChip active={theme === 'dark'} onClick={() => setTheme('dark')}>
              dark
            </ThemeChip>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400 leading-snug">
            切换会重建 iframe → WebView 发 <code>ready</code> → 宿主回
            <code>init</code> 带上新 theme。
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            运行时注入（<code>shared-data-update</code>）
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => injectThemeUpdate('light')}
              className="flex-1 px-3 py-2 rounded border border-gray-300 text-xs font-medium hover:bg-gray-50 active:bg-gray-100"
            >
              theme → light
            </button>
            <button
              type="button"
              onClick={() => injectThemeUpdate('dark')}
              className="flex-1 px-3 py-2 rounded border border-gray-300 text-xs font-medium hover:bg-gray-50 active:bg-gray-100"
            >
              theme → dark
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400 leading-snug">
            不会 reload iframe，发 <code>shared-data-update</code> 让 WebView 运行时切主题。
          </p>
        </section>

        <section className="mt-auto">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Bridge 日志
          </h2>
          <p className="text-[10px] font-mono text-gray-500">
            {lastBridgeEvent ?? '(等待 WebView ready)'}
          </p>
        </section>
      </aside>

      <main className="flex-1 flex items-center justify-center p-10">
        <PhoneFrame>
          <FakeHostChrome
            product={product}
            activeMainTab={activeMainTab}
            onMainTabChange={setActiveMainTab}
            iframeKey={iframeKey}
            iframeRef={iframeRef}
            selectedModes={selectedModes}
            onSelectedModesChange={(modes) => {
              setSelectedModes(modes);
              // Mode change triggers iframe reload via useEffect above
            }}
          />
        </PhoneFrame>
      </main>
    </div>
  );
}

function ThemeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-colors ${
        active
          ? 'bg-black text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
