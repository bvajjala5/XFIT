import { useEffect, useRef } from 'react';

/**
 * Keep keyboard focus inside an arbitrary modal container.
 * Returns focus to the element that had it when the modal closed.
 */
export default function useFocusTrap(ref, active = true, onEscape) {
  // Keep the latest callback without re-running the effect (and resetting focus)
  // every time the parent renders with a new inline function.
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return undefined;

    const root = ref.current;
    if (!root) return undefined;

    const previous = document.activeElement;
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusables = () => Array.from(root.querySelectorAll(selector))
      .filter(element => {
        if (element.disabled || element.getAttribute('aria-hidden') === 'true') return false;
        return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement;
      });

    const initial = focusables();
    (initial[0] ?? root).focus?.();

    const onKeyDown = event => {
      if (event.key === 'Escape' && escapeRef.current) {
        event.preventDefault();
        escapeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previous?.focus?.();
    };
  }, [ref, active]);
}
