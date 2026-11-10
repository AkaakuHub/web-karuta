import { useEffect, useState } from 'react';

export function usePageVisible() {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const change = () => setVisible(!document.hidden);
    const hide = () => setVisible(false);
    document.addEventListener('visibilitychange', change);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', change);
    return () => {
      document.removeEventListener('visibilitychange', change);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', change);
    };
  }, []);
  return visible;
}
