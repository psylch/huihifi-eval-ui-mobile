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
      <div className="flex gap-5">
        {SUB_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const hasData = availability[tab.id] ?? true;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="relative whitespace-nowrap py-2.5 text-[13px] transition-colors tap-depth"
              style={{
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                opacity: hasData ? 1 : 0.4,
              }}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute left-0 right-0 bottom-0 h-[2px] rounded-[1px]"
                  style={{ background: 'var(--accent-primary)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
