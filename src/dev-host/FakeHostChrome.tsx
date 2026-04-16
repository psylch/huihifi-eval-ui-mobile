import { useState, type ReactNode, type RefObject } from 'react';
import { IndicatorDot } from '../components/IndicatorDot';
import { TuningModeSelector } from '../components/TuningModeSelector';
import { INDICATOR_STYLES } from '../constants';

interface Product {
  uuid: string;
  title: string;
  brand: { title: string };
  availableTuningModes: string[];
  categoryName?: string;
}

type MainTab = 'perception' | 'curves';

interface Props {
  product: Product | null;
  activeMainTab: MainTab;
  onMainTabChange: (tab: MainTab) => void;
  iframeKey: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  iframeSrc: string;
  selectedModes: string[];
  onSelectedModesChange: (modes: string[]) => void;
}

// 假宿主 UI — 模拟合作方 RN App 的产品详情页，除"听感数据 tab 内容区"外
// 的部分全部由此组件扮演。听感数据 tab 内容区嵌 iframe 指向我们的 WebView。
export function FakeHostChrome({
  product,
  activeMainTab,
  onMainTabChange,
  iframeKey,
  iframeRef,
  iframeSrc,
  selectedModes,
  onSelectedModesChange,
}: Props) {
  const [showSelector, setShowSelector] = useState(false);
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Floating header (overlay on product image) */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3 flex items-center justify-between pointer-events-none">
        <HostIconButton label="←" />
        <div className="flex gap-2">
          <HostIconButton label="☾" />
          <HostIconButton label="↗" />
        </div>
      </div>

      {/* Product image area — 扁平占位 + 产品名 */}
      <div
        className="relative h-[180px] flex items-end justify-start px-5 pb-5 text-white"
        style={{
          background:
            'linear-gradient(135deg, #6b4f3a 0%, #a0744d 45%, #c7956a 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10 text-[10px] text-white/60 uppercase tracking-widest">
          (主应用: 产品图轮播)
        </div>
      </div>

      {/* Product basic info */}
      <section className="px-5 -mt-4 relative z-10 pt-1">
        <h1 className="text-[18px] font-black leading-tight text-gray-900">
          {product ? product.title : '— 无产品 —'}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#FF3B30] text-[12px] font-semibold">
            {product?.brand.title ?? '品牌'}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-[12px] font-bold text-gray-900">¥ --</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(product?.categoryName
            ? [product.categoryName, '动圈', '16Ω']
            : ['类型', '--', '--']
          ).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Main tab bar — 听感数据 / 曲线图 */}
      <section className="px-5 pt-4">
        <div className="flex gap-8 border-b border-gray-200">
          <MainTabButton
            label="听感数据"
            active={activeMainTab === 'perception'}
            onClick={() => onMainTabChange('perception')}
          />
          <MainTabButton
            label="曲线图"
            active={activeMainTab === 'curves'}
            onClick={() => onMainTabChange('curves')}
          />
        </div>
      </section>

      {/* 调音模式入口 — 跨 perception/curves tab 共享，由宿主拥有。
          原型 line 473-491：左侧 10px uppercase 小标题，右侧"切换"文字链接，
          下方选中模式 tag 列表。 */}
      <section className="px-5 pt-3 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            当前调音模式
          </span>
          {product && product.availableTuningModes.length > 1 && (
            <button
              type="button"
              onClick={() => setShowSelector(true)}
              className="text-xs font-semibold"
              style={{ color: '#FF3B30' }}
            >
              切换
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectedModes.length === 0 ? (
            <span className="text-[11px] text-gray-400">—</span>
          ) : (
            selectedModes.map((mode, idx) => {
              const shape = INDICATOR_STYLES[idx]?.shape ?? 'filled';
              return (
                <div
                  key={mode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50"
                >
                  <IndicatorDot shape={shape} />
                  <span className="text-[11px] font-medium text-gray-900">
                    {mode}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Content area — iframe 和假曲线图都保留在 DOM，display 切换，
          这样 __setTheme 注入不会因为 tab 切换丢失 iframe ref */}
      <main className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            display: activeMainTab === 'perception' ? 'block' : 'none',
          }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-0 block"
            title="听感数据 WebView"
          />
        </div>
        <div
          className="absolute inset-0 overflow-y-auto p-5"
          style={{
            display: activeMainTab === 'curves' ? 'block' : 'none',
          }}
        >
          <FakeCurvesTab />
        </div>
      </main>

      {/* Bottom action bar */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="flex-1 h-11 rounded-full border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600"
          >
            ↗ 分享
          </button>
          <button
            type="button"
            disabled
            className="flex-[2] h-11 rounded-full bg-[#FF3B30] text-white flex items-center justify-center gap-1.5 text-xs font-bold"
          >
            ≡ 应用到设备
          </button>
        </div>
      </div>

      {/* 调音模式选择 Bottom Sheet — 挂在手机屏幕层内，盖在所有内容之上。
          确认后写回到宿主 state；宿主重构 URL 会触发 iframe reload（相当于
          RN 重新打开 WebView 并带上新的 ?modes=）。 */}
      {product && (
        <TuningModeSelector
          open={showSelector}
          onClose={() => setShowSelector(false)}
          availableModes={product.availableTuningModes}
          selectedModes={selectedModes}
          onConfirm={onSelectedModesChange}
        />
      )}
    </div>
  );
}

function HostIconButton({ label }: { label: string }) {
  return (
    <div className="size-9 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white text-sm border border-white/10">
      {label}
    </div>
  );
}

function MainTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative pb-3 text-[15px] transition-colors"
      style={{
        color: active ? '#1d1d1f' : '#8e8e93',
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
      {active && (
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-[2px]"
          style={{ background: '#FF3B30' }}
        />
      )}
    </button>
  );
}

// 假曲线图 tab — 纯装饰，提示用户这部分由主应用负责
function FakeCurvesTab(): ReactNode {
  const charts = [
    { title: '频响曲线', subtitle: 'Frequency Response' },
    { title: '谐波失真', subtitle: 'THD' },
    { title: '相位', subtitle: 'Phase' },
  ];
  return (
    <div className="flex flex-col gap-4">
      {charts.map((c) => (
        <div
          key={c.title}
          className="p-3 rounded-2xl border border-gray-200 bg-gray-50"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-[14px] text-gray-900">{c.title}</p>
              <p className="text-[10px] text-gray-400">{c.subtitle}</p>
            </div>
            <div className="size-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[11px] text-gray-400">
              ⤢
            </div>
          </div>
          <svg
            viewBox="0 0 100 30"
            className="w-full mt-3 h-16"
            preserveAspectRatio="none"
          >
            <path
              d="M0 20 Q10 15, 20 17 T40 14 T60 16 T80 12 T100 18"
              fill="none"
              stroke="#FF3B30"
              strokeWidth="1"
              opacity="0.6"
            />
          </svg>
        </div>
      ))}
      <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-[10px] text-amber-700 leading-snug">
          <strong>提示：</strong>曲线图 tab 由宿主 RN App 自己实现，**不在**听感数据 WebView
          的承接范围。此处是 dev-host 的装饰占位。
        </p>
      </div>
    </div>
  );
}
