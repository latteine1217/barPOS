import { memo } from 'react';
import { useNetworkStatus } from '@/hooks/core/useNetworkStatus';

const OfflineBanner = memo(() => {
  const { isOnline, offlineQueueLength } = useNetworkStatus();

  if (isOnline) return null;

  const queueText = offlineQueueLength > 0
    ? `· ${offlineQueueLength} 筆操作將於連線恢復後同步`
    : '';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[55] bg-amber-500 text-amber-950 shadow-md animate-in slide-in-from-top duration-300 ease-out"
    >
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <span className="flex-none inline-flex w-6 h-6 rounded-full bg-amber-600/30 items-center justify-center" aria-hidden="true">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636L5.636 18.364m0-12.728L18.364 18.364" />
          </svg>
        </span>
        <span className="font-medium">目前處於離線狀態</span>
        {queueText && <span className="opacity-80 truncate">{queueText}</span>}
      </div>
    </div>
  );
});

OfflineBanner.displayName = 'OfflineBanner';

export default OfflineBanner;
