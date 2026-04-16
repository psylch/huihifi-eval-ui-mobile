import { SUB_TABS, type SubTabId } from '../constants';

interface SubTabBarProps {
  activeTab: SubTabId;
  onChange: (id: SubTabId) => void;
  // Per-tab "has data in the currently loaded modes". Missing keys default
  // to `true` (fail-open) so callers can pass partial maps.
  availability: Partial<Record<SubTabId, boolean>>;
}

export function SubTabBar({ activeTab, onChange, availability }: SubTabBarProps) {
  return (
    <div
      className="overflow-x-auto no-scrollbar -mx-5 px-5 sticky top-0 z-20 -mt-4 pt-4 pb-2 backdrop-blur-md"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg-page) 80%, transparent)' }}
    >
      <div className="flex gap-2">
        {SUB_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const hasData = availability[tab.id] ?? true;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-4 py-2 rounded-full text-[13px] whitespace-nowrap tap-depth transition-all ${
                isActive ? '' : 'pill-inactive'
              }`}
              style={
                isActive
                  ? {
                      background: 'var(--accent-primary)',
                      color: '#FFFFFF',
                      fontWeight: 600,
                    }
                  : {
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      opacity: hasData ? 1 : 0.4,
                    }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
