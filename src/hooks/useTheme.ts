import { useEffect } from 'react';
import type { Theme } from '../types';

declare global {
  interface Window {
    __setTheme?: (theme: Theme) => void;
  }
}

/**
 * 主题 hook。
 *
 * 设计要点：
 * - 单一真源是 DOM 上的 `data-theme` 属性，而不是 React state。
 *   index.html 的 FOUC inline script 会在 React 挂载之前根据
 *   `URLSearchParams.get('theme')` 先把属性设好，避免首屏闪烁。
 * - mount 时按 `initial` 再写一次 `data-theme`，作为兜底并同步 initial 变化。
 * - 注册 `window.__setTheme(theme)` 全局函数，供宿主 RN 通过
 *   `webview.injectJavaScript()` 在运行时切主题（例如 RN 侧响应系统
 *   外观切换）。hook unmount 时清理该全局函数。
 * - 不返回任何东西：调用方不需要 React state，CSS 变量会跟随属性自动切换。
 */
export function useTheme(initial: Theme): void {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', initial);
  }, [initial]);

  useEffect(() => {
    window.__setTheme = (t) => {
      const next: Theme = t === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
    };
    return () => {
      delete window.__setTheme;
    };
  }, []);
}
