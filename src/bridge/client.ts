import type { InboundMessage, OutboundMessage } from './types';

// Environment detection — mirrors aituning-fe-mobile/src/bridge/client.ts.
export type BridgeEnvironment =
  | 'react-native-webview'
  | 'iframe-mock-host'
  | 'standalone';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
  }
}

export function detectEnvironment(): BridgeEnvironment {
  if (window.ReactNativeWebView?.postMessage) return 'react-native-webview';
  if (window.parent !== window) return 'iframe-mock-host';
  return 'standalone';
}

export function sendBridgeMessage(msg: OutboundMessage): void {
  const env = detectEnvironment();
  const json = JSON.stringify(msg);
  if (env === 'react-native-webview') {
    window.ReactNativeWebView!.postMessage(json);
  } else if (env === 'iframe-mock-host') {
    window.parent.postMessage(json, '*');
  }
}

export type MessageHandler = (msg: InboundMessage) => void;

export function listenForMessages(handler: MessageHandler): () => void {
  const onMessage = (event: MessageEvent) => {
    try {
      const raw = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (raw && typeof raw.type === 'string') {
        handler(raw as InboundMessage);
      }
    } catch {
      // Ignore non-JSON / non-bridge messages
    }
  };
  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}
