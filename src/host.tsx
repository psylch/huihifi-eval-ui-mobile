import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// WebView-shared styles — provides the --accent-primary / --bg-surface /
// --bg-inner-well / --text-* CSS variables, the `.bar-indicator` shapes,
// `.glass-panel`, and animation keyframes that TuningModeSelector /
// IndicatorDot / the fake chrome rely on.
import './index.css';
import './host.css';
import HostApp from './dev-host/HostApp';

createRoot(document.getElementById('host-root')!).render(
  <StrictMode>
    <HostApp />
  </StrictMode>,
);
