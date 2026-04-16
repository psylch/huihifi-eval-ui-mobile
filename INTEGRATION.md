# 听感数据 WebView 接入指南

> **适用对象**：合作方 RN 开发者
> **版本**：v1.0
> **更新日期**：2026-04-15

---

## 1. 概览

| 项 | 值 |
|---|---|
| **WebView URL** | `https://eval.huihifi.com/m/` |
| **通信协议** | `postMessage({type, data})`，与 AI 调音 WebView 统一 |
| **承接范围** | 产品详情页"听感数据" tab 的**内容区**（条形图 + 子 Tab） |
| **不承接** | 产品图片、基本信息、曲线图 tab、调音模式选择器、底部操作栏 |
| **反向通信** | `ready` / `navigate-back` / `auth-required` 三个 outbound 事件 |

---

## 2. 握手时序

```
RN 宿主                                      WebView
   │                                              │
   │  打开 WebView                                │
   │  url: https://eval.huihifi.com/m/            │
   │                                              │
   │  ← postMessage {type:'ready'}  ──────────────┤  页面挂载完毕
   │                                              │
   ├── postMessage {type:'init', data:{...}} ───→ │  接收初始上下文
   │                                              │  → 设置主题 / 安全区
   │                                              │  → 拉取产品数据
   │                                              │  → 渲染条形图
   │                                              │
   │  (用户切换系统深色模式)                       │
   ├── postMessage {type:'shared-data-update',    │
   │     data:{theme:'dark'}} ──────────────────→ │  运行时切换主题
   │                                              │
   │  ← postMessage {type:'navigate-back'}  ──────┤  用户点击返回
   │                                              │
```

**关键规则**：
- 宿主**必须等到收到 `ready`** 后才发 `init`，否则 WebView 尚未挂载消息监听器
- 如果 2 秒内未收到 `init`，WebView 会 fallback 到 URL 参数模式（开发调试用）
- 收到不认识的 `type` → **静默忽略**（两个 WebView 可各自扩展）

---

## 3. 事件表

### 3.1 Inbound（RN → WebView）

| type | payload | 必须？ | 说明 |
|---|---|---|---|
| `init` | `InitPayload` | ✅ | 初始上下文，替代 URL 参数 |
| `shared-data-update` | `SharedDataUpdatePayload` | ❌ | 运行时部分更新（主题/安全区） |
| `close-request` | `{}` | ❌ | 请求关闭 WebView（预留） |

### 3.2 Outbound（WebView → RN）

| type | payload | 说明 |
|---|---|---|
| `ready` | `{}` | 页面挂载完毕，请发 `init` |
| `navigate-back` | `{}` | 用户触发返回（预留，当前未使用） |
| `auth-required` | `{}` | token 过期，请引导登录（预留） |

---

## 4. Payload 定义

### 4.1 InitPayload

```typescript
interface InitPayload {
  // ─── 通用字段（与 AI 调音 WebView 一致）───
  userToken: string | null;        // null = 演示模式（当前 API 不鉴权）
  theme: 'light' | 'dark';
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // ─── 听感评估专用 ───
  productId: string;               // 产品 UUID
  modes: string[];                 // 要展示的调音模式列表（最多 3 个）
  category?: string;               // 默认打开的子 Tab（可选，默认 'frequency'）
}
```

**`modes` 规则**：
- 空数组 `[]` → 自动展示 API 返回的第一个调音模式
- 1-3 个值 → 多模式条形图对比（实心圆/空心圆/菱形）
- 超过 3 个 → 只取前 3 个
- 不在产品可用模式列表中的值 → 静默丢弃

**`category` 可选值**：

| ID | 显示名 |
|---|---|
| `frequency` | 频段（默认） |
| `vocal` | 人声 |
| `percussion` | 打击乐 |
| `guitar` | 吉他 |
| `strings` | 弦乐 |
| `bass` | 贝斯 |
| `woodwind` | 木管 |
| `brass` | 铜管 |
| `keyboard` | 键盘 |
| `ethnic` | 民族 |
| `gaming` | 游戏 |

### 4.2 SharedDataUpdatePayload

```typescript
interface SharedDataUpdatePayload {
  theme?: 'light' | 'dark';
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

所有字段可选，只传需要更新的。

---

## 5. RN 代码示例

### 5.1 基本接入

```tsx
import React, { useCallback, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

const WEBVIEW_URL = 'https://eval.huihifi.com/m/';

interface Props {
  productId: string;
  modes: string[];          // 宿主侧调音模式选择器的当前选中
  category?: string;
}

export function PerceptionWebView({ productId, modes, category }: Props) {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  const sendInit = useCallback(() => {
    const payload = {
      type: 'init',
      data: {
        userToken: null,       // 当前不需要鉴权
        theme: colorScheme === 'dark' ? 'dark' : 'light',
        safeAreaInsets: {
          top: insets.top,
          right: insets.right,
          bottom: insets.bottom,
          left: insets.left,
        },
        productId,
        modes,
        category: category ?? 'frequency',
      },
    };
    webViewRef.current?.postMessage(JSON.stringify(payload));
  }, [colorScheme, insets, productId, modes, category]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        switch (msg.type) {
          case 'ready':
            setIsReady(true);
            sendInit();
            break;
          case 'navigate-back':
            // navigation.goBack();
            break;
          case 'auth-required':
            // 引导用户登录
            break;
          default:
            // 静默忽略不认识的 type
            break;
        }
      } catch {
        // 忽略非 JSON 消息
      }
    },
    [sendInit],
  );

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: WEBVIEW_URL }}
      onMessage={handleMessage}
      // WebView 在 RN 里全屏展示，安全区由 bridge 处理
      style={{ flex: 1 }}
    />
  );
}
```

### 5.2 运行时主题切换

当系统深色模式变化时，发 `shared-data-update` 而不是重新创建 WebView：

```tsx
useEffect(() => {
  if (!isReady) return;
  const msg = {
    type: 'shared-data-update',
    data: { theme: colorScheme === 'dark' ? 'dark' : 'light' },
  };
  webViewRef.current?.postMessage(JSON.stringify(msg));
}, [colorScheme, isReady]);
```

### 5.3 调音模式切换

调音模式是**宿主侧状态**（跨曲线图/听感数据 tab 共享）。切换模式时**重新创建 WebView**：

```tsx
// 方案 A：用 key 强制重建
<WebView key={`${productId}-${modes.join(',')}`} ... />

// 方案 B：重新发 init（需要 WebView 端支持 re-init）
// 当前推荐方案 A，简单可靠
```

---

## 6. 安全区

WebView 收到 `safeAreaInsets` 后会注入以下 CSS 变量：

```css
--sai-top: 47px;
--sai-right: 0px;
--sai-bottom: 34px;
--sai-left: 0px;
```

WebView 内部通过 `padding-top: var(--sai-top)` 等方式消费。**宿主不需要额外处理安全区**，只需要把 `useSafeAreaInsets()` 的值传进来。

---

## 7. 与 AI 调音 WebView 的关系

| 层面 | AI 调音 (`aituning-fe-mobile`) | 听感评估（本仓） | 一致？ |
|---|---|---|---|
| 消息信封 | `{type, data}` | `{type, data}` | ✅ |
| `init` 通用字段 | `userToken, theme, safeAreaInsets` | `userToken, theme, safeAreaInsets` | ✅ |
| `init` 业务字段 | `workbenchSessionId, selectedProduct, originalDataSource, appliedFilters` | `productId, modes, category` | 各自特有 |
| `shared-data-update` | `theme, safeAreaInsets` + 调音特有 | `theme, safeAreaInsets` | 通用字段一致 |
| Outbound | `ready, navigate-back, auth-required` + 调音特有 | `ready, navigate-back, auth-required` | 通用事件一致 |
| CSS 变量 | `--bg-page, --text-primary, ...` | 同一套 | ✅ |
| 主题切换机制 | `data-theme` 属性 | `data-theme` 属性 | ✅ |
| 安全区 CSS | `--sai-top/right/bottom/left` | `--sai-top/right/bottom/left` | ✅ |

**宿主侧可以用同一套 `onMessage` handler 框架**，根据不同 WebView 的 `init` 业务字段区分。

---

## 8. URL Fallback 模式

开发/调试时可以**不走 bridge**，直接在浏览器打开带参数的 URL：

```
https://eval.huihifi.com/m/?product_id=<uuid>&modes=<m1,m2,m3>&category=<tab_id>&theme=<light|dark>
```

| 参数 | 必填 | 默认 |
|---|---|---|
| `product_id` | ✅ | — |
| `modes` | ❌ | API 返回的第一个模式 |
| `category` | ❌ | `frequency` |
| `theme` | ❌ | `light` |

WebView 会在 2 秒内等 `init` 消息，超时后自动 fallback 到 URL 参数。**两种模式互不冲突**。

---

## 9. 测试用 Product ID

| UUID | 产品 | 调音模式数 | 用途 |
|---|---|---|---|
| `7230fa92-72c5-4a8c-a369-6440413cd6c1` | 64Audio Solo | 2 | 基本渲染 + 双模式对比 |
| `3589ac8c-1dd9-4681-8e56-92fe8b0ed7e3` | 64audio Volur | 7 | 多模式选择（测 3 模式上限） |
| `00000000-0000-0000-0000-000000000000` | (无效) | — | 404 错误态 |
| *(不传 product_id)* | — | — | 参数缺失错误态 |

---

## 10. 错误态

WebView 内部处理以下错误，不需要宿主干预：

| 场景 | 显示 |
|---|---|
| `productId` 缺失 | "参数缺失 — URL 中缺少 product_id 参数" |
| API 返回 404 | "产品不存在 — 无法找到该产品的数据" |
| 网络异常 | "加载失败 — 请检查网络后重试" + 重试按钮 |

---

## 11. 联调 Checklist

### 第一步：验证 WebView 加载

- [ ] RN 中打开 `https://eval.huihifi.com/m/`
- [ ] 确认页面加载（应显示 Loading → 2 秒后 fallback 到"参数缺失"错误页）

### 第二步：Bridge 握手

- [ ] 监听 WebView `onMessage`，确认收到 `{type:'ready'}`
- [ ] 收到 `ready` 后发送 `init`（带 productId + modes）
- [ ] 确认 WebView 渲染出条形图数据

### 第三步：主题同步

- [ ] `init.theme` 设为 `'dark'`，确认 WebView 深色渲染
- [ ] 系统主题切换时发 `shared-data-update`，确认 WebView 运行时变色

### 第四步：安全区

- [ ] `init.safeAreaInsets` 传入真实值（`useSafeAreaInsets()`）
- [ ] 确认 WebView 顶部内容没被刘海/状态栏遮挡

### 第五步：多模式对比

- [ ] `modes` 传 1 个 → 单条 axis
- [ ] `modes` 传 2 个 → 双条 axis（实心圆 + 空心圆）
- [ ] `modes` 传 3 个 → 三条 axis（实心圆 + 空心圆 + 菱形）

### 第六步：子 Tab 切换

- [ ] `category` 传 `'vocal'` → 默认落在"人声" tab
- [ ] 横向滑动 sub tab 栏，确认 11 个 tab 都可切换

### 第七步：错误态

- [ ] `productId` 传无效 UUID → "产品不存在"
- [ ] 断网后重试 → "加载失败" + 重试按钮

---

## 12. 联系方式

技术问题联系本仓库维护者。

- 仓库：[psylch/huihifi-eval-ui-mobile](https://github.com/psylch/huihifi-eval-ui-mobile)
- 设计文档：`docs/exec-plans/active/mobile-webview-perception/plan.md`（在父仓库 `ai-eval`）
- Bridge 参考实现：`src/bridge/`（本仓库）
