import { useEffect, useRef, useState } from 'react';
import { INDICATOR_STYLES, MAX_SELECTED_MODES, type IndicatorShape } from '../constants';
import { IndicatorDot } from './IndicatorDot';

interface TuningModeSelectorProps {
  open: boolean;
  onClose: () => void;
  availableModes: string[];
  selectedModes: string[];
  onConfirm: (modes: string[]) => void;
}

export function TuningModeSelector({
  open,
  onClose,
  availableModes,
  selectedModes,
  onConfirm,
}: TuningModeSelectorProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedModes);
  const wasOpenRef = useRef(false);

  // Re-seed temp buffer on closed → open transition only, so a cancelled
  // session doesn't leak back into the next opening.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setTempSelected(selectedModes);
    }
    wasOpenRef.current = open;
  }, [open, selectedModes]);

  if (!open) return null;

  const toggle = (mode: string) => {
    const index = tempSelected.indexOf(mode);
    if (index >= 0) {
      // Block deselect when this is the last one — at least 1 mode required.
      if (tempSelected.length <= 1) return;
      setTempSelected(tempSelected.filter((_, i) => i !== index));
    } else {
      if (tempSelected.length >= MAX_SELECTED_MODES) return;
      setTempSelected([...tempSelected, mode]);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelected);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      // Positions relative to the nearest positioned ancestor. In the
      // dev-host that's PhoneFrame's inner container, so the sheet stays
      // trapped inside the phone screen. When mounted alone on a page
      // where no ancestor is positioned, it falls back to the initial
      // containing block (viewport) — same effective behavior as `fixed`.
      className="absolute inset-0 z-[60]"
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-[32px] max-h-[75%] overflow-hidden animate-slide-up"
        style={{
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-glass)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'var(--text-tertiary)', opacity: 0.3 }}
          />
        </div>

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              选择调音模式
            </h3>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              最多选择 {MAX_SELECTED_MODES} 个
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto no-scrollbar">
            {availableModes.map((mode) => {
              const selectedIndex = tempSelected.indexOf(mode);
              const isSelected = selectedIndex >= 0;
              const isDisabled =
                !isSelected && tempSelected.length >= MAX_SELECTED_MODES;
              const shape: IndicatorShape | null = isSelected
                ? INDICATOR_STYLES[selectedIndex]?.shape ?? 'filled'
                : null;

              return (
                <button
                  key={mode}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggle(mode)}
                  className="w-full p-4 rounded-2xl flex items-center justify-between border transition-all tap-depth text-left"
                  style={{
                    background: isSelected
                      ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                      : 'var(--bg-inner-well)',
                    borderColor: isSelected
                      ? 'color-mix(in srgb, var(--accent-primary) 30%, transparent)'
                      : 'var(--border-inner-well)',
                    opacity: isDisabled ? 0.4 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 flex justify-center">
                      {shape ? (
                        <IndicatorDot shape={shape} />
                      ) : (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full border-2"
                          style={{
                            borderColor: 'var(--text-tertiary)',
                            opacity: 0.5,
                          }}
                        />
                      )}
                    </span>
                    <span
                      className="text-[14px] font-semibold"
                      style={{
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      }}
                    >
                      {mode}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full mt-5 py-3.5 rounded-2xl font-bold text-[15px] tap-depth transition-colors"
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFFFF',
            }}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}
