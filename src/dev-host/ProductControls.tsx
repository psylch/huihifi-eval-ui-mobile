interface Product {
  uuid: string;
  title: string;
  brand: { title: string };
  availableTuningModes: string[];
}

interface Props {
  productId: string;
  onProductIdChange: (id: string) => void;
  product: Product | null;
  productError: string | null;
  selectedModes: string[];
  onSelectedModesChange: (modes: string[]) => void;
  category: string;
  onCategoryChange: (c: string) => void;
}

const PRESET_PRODUCTS = [
  { id: '7230fa92-72c5-4a8c-a369-6440413cd6c1', name: '64Audio Solo (2 模式)' },
  { id: '3589ac8c-1dd9-4681-8e56-92fe8b0ed7e3', name: '64audio Volur (7 模式)' },
  { id: '00000000-0000-0000-0000-000000000000', name: '(无效 UUID — 404 测试)' },
];

// Must match SUB_TABS order in src/constants.ts
const CATEGORIES = [
  { id: 'frequency', label: '频段' },
  { id: 'vocal', label: '人声' },
  { id: 'percussion', label: '打击乐' },
  { id: 'guitar', label: '吉他' },
  { id: 'strings', label: '弦乐' },
  { id: 'bass', label: '贝斯' },
  { id: 'woodwind', label: '木管' },
  { id: 'brass', label: '铜管' },
  { id: 'keyboard', label: '键盘' },
  { id: 'ethnic', label: '民族' },
  { id: 'gaming', label: '游戏' },
];

const MAX_MODES = 3;

export function ProductControls({
  productId,
  onProductIdChange,
  product,
  productError,
  selectedModes,
  onSelectedModesChange,
  category,
  onCategoryChange,
}: Props) {
  const toggleMode = (mode: string) => {
    const isSelected = selectedModes.includes(mode);
    if (isSelected) {
      if (selectedModes.length <= 1) return;
      onSelectedModesChange(selectedModes.filter((m) => m !== mode));
    } else {
      if (selectedModes.length >= MAX_MODES) return;
      onSelectedModesChange([...selectedModes, mode]);
    }
  };

  const clearProductId = () => onProductIdChange('');

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
          产品
        </h2>
        <select
          value={
            PRESET_PRODUCTS.find((p) => p.id === productId) ? productId : ''
          }
          onChange={(e) => onProductIdChange(e.target.value)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white"
        >
          <option value="" disabled>
            — 预设产品 —
          </option>
          {PRESET_PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="mt-1.5 flex gap-1">
          <input
            type="text"
            value={productId}
            onChange={(e) => onProductIdChange(e.target.value)}
            className="flex-1 text-[10px] border border-gray-200 rounded px-2 py-1 font-mono"
            placeholder="手动输入 UUID（留空测 missing-param）"
          />
          <button
            type="button"
            onClick={clearProductId}
            className="text-[10px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
            title="清空 product_id（测参数缺失错误态）"
          >
            清空
          </button>
        </div>

        {product && (
          <p className="mt-1.5 text-[10px] text-gray-600">
            ✓ {product.title}
            <br />
            <span className="text-gray-400">
              {product.brand.title} · {product.availableTuningModes.length}{' '}
              个可用模式
            </span>
          </p>
        )}
        {productError && (
          <p className="mt-1.5 text-[10px] text-red-600">
            API 查询失败: {productError}
          </p>
        )}
      </section>

      {product && (
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            调音模式（最多 {MAX_MODES} 个）
          </h2>
          <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto border border-gray-200 rounded">
            {product.availableTuningModes.map((mode) => {
              const isSelected = selectedModes.includes(mode);
              const isDisabled =
                !isSelected && selectedModes.length >= MAX_MODES;
              const isLast =
                isSelected && selectedModes.length === 1;
              return (
                <label
                  key={mode}
                  className={`flex items-center gap-2 text-xs px-2 py-1.5 cursor-pointer select-none ${
                    isSelected ? 'bg-red-50' : 'hover:bg-gray-50'
                  } ${isDisabled || isLast ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled || isLast}
                    onChange={() => toggleMode(mode)}
                    className="shrink-0"
                  />
                  <span className="break-all">{mode}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-gray-400">
            RN 侧构造 URL 时通过 <code>?modes=a,b,c</code> 传入。最后一个无法取消（至少保留 1 个）。
          </p>
        </section>
      )}

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
          初始 Category
        </h2>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} ({c.id})
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}
