// Full-viewport loading indicator shown while the product detail
// request is in flight. Simple Tailwind `animate-spin` ring over a
// neutral circle border, with a muted subtitle underneath.

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div
        className="w-10 h-10 rounded-full border-[3px] animate-spin"
        style={{
          borderColor: 'var(--border-base)',
          borderTopColor: 'var(--accent-primary)',
        }}
        aria-hidden="true"
      />
      <p
        className="text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        加载中...
      </p>
    </div>
  );
}
