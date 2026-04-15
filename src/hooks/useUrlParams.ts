import { useMemo } from 'react';
import { MAX_SELECTED_MODES, SUB_TABS, type SubTabId } from '../constants';
import type { Theme, UrlParams } from '../types';

const VALID_CATEGORY_IDS = new Set<string>(SUB_TABS.map((t) => t.id));
const DEFAULT_CATEGORY: SubTabId = SUB_TABS[0].id;

function parseModes(raw: string | null): string[] | null {
  if (raw === null) return null;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_SELECTED_MODES);
}

function parseCategory(raw: string | null): SubTabId {
  if (raw && VALID_CATEGORY_IDS.has(raw)) {
    return raw as SubTabId;
  }
  return DEFAULT_CATEGORY;
}

function parseTheme(raw: string | null): Theme {
  return raw === 'dark' ? 'dark' : 'light';
}

// The WebView is a one-shot entry: parameters are injected once at mount
// and never change during the session, so we intentionally do not subscribe
// to URL changes.
export function useUrlParams(): UrlParams {
  return useMemo<UrlParams>(() => {
    const search = new URLSearchParams(window.location.search);
    return {
      productId: search.get('product_id') ?? '',
      modes: parseModes(search.get('modes')),
      category: parseCategory(search.get('category')),
      theme: parseTheme(search.get('theme')),
    };
  }, []);
}
