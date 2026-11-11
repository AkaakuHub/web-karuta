import { useEffect, type RefObject } from 'react';
import type { RoomConnection } from '../../infrastructure/multiplayer/roomConnection.js';

export function useRoomLifecycle(connection: RefObject<RoomConnection | null>, onWake: () => void) {
  useEffect(() => {
    const wake = () => {
      if (document.hidden || !connection.current) return;
      onWake();
      connection.current.wake(true);
    };
    const suspend = () => connection.current?.suspend();
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (connection.current) event.preventDefault();
    };
    const pageHide = (event: PageTransitionEvent) => {
      if (event.persisted) suspend();
      else connection.current?.leave();
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('pagehide', pageHide);
    document.addEventListener('freeze', suspend);
    document.addEventListener('resume', wake);
    window.addEventListener('online', wake);
    window.addEventListener('pageshow', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('pagehide', pageHide);
      document.removeEventListener('freeze', suspend);
      document.removeEventListener('resume', wake);
      window.removeEventListener('online', wake);
      window.removeEventListener('pageshow', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [connection, onWake]);
}
