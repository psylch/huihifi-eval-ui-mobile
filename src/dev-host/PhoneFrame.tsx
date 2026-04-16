import type { ReactNode } from 'react';

// iPhone 14 逻辑尺寸 (CSS px)
const FRAME_WIDTH = 390;
const FRAME_HEIGHT = 844;
const BEZEL = 12;

interface Props {
  children: ReactNode;
}

export function PhoneFrame({ children }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative bg-[#0a0a0c] shadow-2xl"
        style={{
          width: FRAME_WIDTH + BEZEL * 2,
          height: FRAME_HEIGHT + BEZEL * 2,
          borderRadius: 56,
          padding: BEZEL,
        }}
      >
        <div
          className="relative overflow-hidden bg-white"
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            borderRadius: 44,
          }}
        >
          {children}
        </div>
      </div>
      <p className="text-[11px] text-gray-500 font-mono">
        iPhone 14 · 390 × 844
      </p>
    </div>
  );
}
