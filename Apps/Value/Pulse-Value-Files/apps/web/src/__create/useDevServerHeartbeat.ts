'use client';

import { useIdleTimer } from 'react-idle-timer';

export function useDevServerHeartbeat() {
  // ADD THIS LINE:
  if (process.env.NODE_ENV === 'production') return; 

  useIdleTimer({
    throttle: 60_000 * 3,
    timeout: 60_000,
    onAction: () => {
      fetch('/', { method: 'GET' }).catch(() => {});
    },
  });
}