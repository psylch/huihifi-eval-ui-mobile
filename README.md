# huihifi-eval-ui-mobile

HuiHiFi 听感数据移动端 WebView。嵌入合作方 React Native App 的产品详情页"听感数据" tab，渲染多调音模式条形图对比。

## 技术栈

Vite + React 19 + TypeScript + Tailwind v4 + bun

## 开发

```bash
bun install
bun dev    # http://localhost:5174
```

环境变量 `VITE_API_BASE_URL` 指定 huihifi-eval-api 地址，默认空（同源）。

## URL 契约（宿主 → 我们）

```
/?product_id=<uuid>&modes=<m1,m2,m3>&category=<tab_id>&theme=<light|dark>
```

| 参数 | 必填 | 默认 |
|---|---|---|
| `product_id` | yes | — |
| `modes` | no | API 返回的第一个调音模式 |
| `category` | no | `vocal` |
| `theme` | no | `light` |

最多 3 个 `modes`，超出静默丢弃。

## 运行时 API（宿主 → 我们）

```js
window.__setTheme('light' | 'dark')
```

合作方 RN 通过 `webview.injectJavaScript()` 调用即可运行时切换主题。无反向通信通道。

## 范围

承接：产品详情页"听感数据" tab。
不承接：曲线图 tab、产品基本信息、产品搜索、全屏模式。

## 父项目

本仓库作为 git submodule 嵌入 `ai-eval`，放置于 `huihifi-eval-ui-mobile/`。设计文档见父仓库 `docs/exec-plans/active/mobile-webview-perception/plan.md`。
