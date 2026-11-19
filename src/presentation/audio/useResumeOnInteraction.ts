import { useEffect, useEffectEvent } from 'react';

export function useResumeOnInteraction(interrupted: boolean, resume: () => void | Promise<void>) {
  const recover = useEffectEvent(resume);
  useEffect(() => {
    if (!interrupted) return;
    const controller = new AbortController();
    let pending = false;
    const onClick = (event: MouseEvent) => {
      if (
        pending ||
        !event.isTrusted ||
        document.hidden ||
        (event.target instanceof Element && event.target.closest('[data-audio-control]'))
      )
        return;
      pending = true;
      void Promise.resolve(recover()).finally(() => {
        pending = false;
      });
    };
    document.addEventListener('click', onClick, { signal: controller.signal });
    return () => controller.abort();
  }, [interrupted]);
}
