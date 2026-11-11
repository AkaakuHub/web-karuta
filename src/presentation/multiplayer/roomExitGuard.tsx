import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../shared/confirmDialog.js';

const RoomExit = createContext<{
  register: (leave: (() => void) | null) => void;
  navigate: (action: () => void) => void;
} | null>(null);

export function RoomExitGuard({ children }: { children: ReactNode }) {
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const register = useCallback((action: (() => void) | null) => setLeave(() => action), []);
  const navigate = (action: () => void) => {
    if (leave) setPending(() => action);
    else action();
  };
  return (
    <RoomExit value={{ register, navigate }}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        title="部屋から退出しますか？"
        confirmLabel="退出する"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          leave?.();
          pending?.();
          setPending(null);
        }}
      />
    </RoomExit>
  );
}

export function useRoomExit(leave: () => void, active: boolean) {
  const register = useContext(RoomExit)?.register;
  useEffect(() => {
    register?.(active ? leave : null);
    return () => register?.(null);
  }, [register, leave, active]);
}

export function useRoomNavigation() {
  const guard = useContext(RoomExit);
  if (!guard) throw new Error('RoomExitGuardがありません');
  return guard.navigate;
}
