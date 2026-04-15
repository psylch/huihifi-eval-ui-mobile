import type { ErrorKind } from '../types';

interface Props {
  kind: ErrorKind;
  message?: string;
  onRetry?: () => void;
}

interface Copy {
  icon: string;
  title: string;
  subtitle: string;
}

const COPY: Record<ErrorKind, Copy> = {
  'missing-param': {
    icon: '\u26A0',
    title: '参数缺失',
    subtitle: 'URL 中缺少 product_id 参数',
  },
  'not-found': {
    icon: '\u2718',
    title: '产品不存在',
    subtitle: '无法找到该产品的数据',
  },
  network: {
    icon: '\u26A0',
    title: '加载失败',
    subtitle: '请检查网络后重试',
  },
};

export function ErrorState({ kind, message, onRetry }: Props) {
  const copy = COPY[kind];
  const showRetry = kind === 'network';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6 text-center">
      <div
        className="text-4xl leading-none"
        style={{ color: 'var(--text-tertiary)' }}
        aria-hidden="true"
      >
        {copy.icon}
      </div>
      <h2
        className="text-base font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {copy.title}
      </h2>
      <p
        className="text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        {message ?? copy.subtitle}
      </p>
      {showRetry && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="tap-depth mt-2 rounded-full px-5 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          重试
        </button>
      )}
    </div>
  );
}
