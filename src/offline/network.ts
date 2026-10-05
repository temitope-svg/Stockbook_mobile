import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function isNetInfoOnline(state: NetInfoState | null): boolean {
  if (!state) return true; // optimistic until first reading
  if (state.isConnected === false) return false;
  // On iOS, null means “unknown” — treat as online and rely on fetch try/catch + cache.
  if (state.isInternetReachable === false) return false;
  return state.isConnected !== false;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void NetInfo.fetch().then(state => {
      if (!mounted) return;
      setIsOnline(isNetInfoOnline(state));
      setReady(true);
    });
    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(isNetInfoOnline(state));
      setReady(true);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return { isOnline, ready };
}

export async function fetchIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isNetInfoOnline(state);
}
