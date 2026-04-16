import { useEffect, useMemo, useRef, useState } from 'react';
import { FakeHostChrome } from './FakeHostChrome';
import { PhoneFrame } from './PhoneFrame';
import { ProductControls } from './ProductControls';

const DEFAULT_PRODUCT_ID = '7230fa92-72c5-4a8c-a369-6440413cd6c1'; // 64Audio Solo (2 模式)

interface Product {
  uuid: string;
  title: string;
  brand: { title: string };
  categoryName?: string;
  availableTuningModes: string[];
}

type MainTab = 'perception' | 'curves';

type Theme = 'light' | 'dark';

// 运行时注入的类型签名，和 mobile WebView 的 src/hooks/useTheme.ts 对齐
type WebViewWindow = Window & {
  __setTheme?: (theme: Theme) => void;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export default function HostApp() {
  const [productId, setProductId] = useState(DEFAULT_PRODUCT_ID);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [category, setCategory] = useState('frequency');
  const [initialTheme, setInitialTheme] = useState<Theme>('light');
  const [lastInjected, setLastInjected] = useState<Theme | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('perception');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 拉产品详情拿 availableTuningModes
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

  // 构造 WebView URL（同源，相对路径）
  const webviewUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (productId) params.set('product_id', productId);
    if (selectedModes.length > 0) params.set('modes', selectedModes.join(','));
    params.set('category', category);
    params.set('theme', initialTheme);
    return `/?${params.toString()}`;
  }, [productId, selectedModes, category, initialTheme]);

  // 运行时注入主题 — 模拟 RN webview.injectJavaScript('window.__setTheme("dark")')
  // 故意不改 initialTheme state，避免 iframe reload；只改视觉+记录
  const injectTheme = (next: Theme) => {
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow as WebViewWindow | null | undefined;
    if (!win || typeof win.__setTheme !== 'function') {
      alert(
        'window.__setTheme 不可用。\n可能原因：\n1. iframe 还没加载完\n2. WebView 代码没挂载 __setTheme\n3. 跨域（不应该出现，都在同 origin）',
      );
      return;
    }
    win.__setTheme(next);
    setLastInjected(next);
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-[340px] shrink-0 p-6 border-r border-[#d6d9dd] bg-white flex flex-col gap-6 overflow-y-auto">
        <header>
          <h1 className="text-base font-bold tracking-tight">宿主仿真</h1>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            模拟合作方 RN App 把听感数据 WebView 嵌进去的运行环境。
            <br />
            URL 参数由下面的控件构造，iframe 的 src 即为合作方构造 WebView URL 时的值。
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
            初始主题（URL 参数）
          </h2>
          <div className="flex gap-2">
            <ThemeChip
              active={initialTheme === 'light'}
              onClick={() => setInitialTheme('light')}
            >
              light
            </ThemeChip>
            <ThemeChip
              active={initialTheme === 'dark'}
              onClick={() => setInitialTheme('dark')}
            >
              dark
            </ThemeChip>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400 leading-snug">
            切换会重新加载 iframe，等同于 RN 重新打开 WebView 并在 URL 里带上 <code>?theme=</code>。
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            运行时注入（<code>window.__setTheme</code>）
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => injectTheme('light')}
              className="flex-1 px-3 py-2 rounded border border-gray-300 text-xs font-medium hover:bg-gray-50 active:bg-gray-100"
            >
              __setTheme('light')
            </button>
            <button
              type="button"
              onClick={() => injectTheme('dark')}
              className="flex-1 px-3 py-2 rounded border border-gray-300 text-xs font-medium hover:bg-gray-50 active:bg-gray-100"
            >
              __setTheme('dark')
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400 leading-snug">
            不会 reload iframe，模拟 RN 用 <code>webview.injectJavaScript()</code> 运行时切换。
          </p>
          {lastInjected && (
            <p className="mt-1 text-[10px] text-emerald-600">
              已注入：<code>__setTheme('{lastInjected}')</code>
            </p>
          )}
        </section>

        <section className="mt-auto">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            当前 WebView URL
          </h2>
          <pre className="text-[10px] bg-gray-50 border border-gray-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all font-mono">
{webviewUrl}
          </pre>
          <a
            href={webviewUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-block text-[10px] text-blue-600 hover:underline"
          >
            在新标签页打开 ↗
          </a>
        </section>
      </aside>

      <main className="flex-1 flex items-center justify-center p-10">
        <PhoneFrame>
          <FakeHostChrome
            product={product}
            activeMainTab={activeMainTab}
            onMainTabChange={setActiveMainTab}
            webviewUrl={webviewUrl}
            iframeRef={iframeRef}
            selectedModes={selectedModes}
            onSelectedModesChange={setSelectedModes}
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
