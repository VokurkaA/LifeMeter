/**
 * Toast bridge — lets non-component code (services, lib utilities) show toasts
 * without violating React hook rules.
 *
 * Usage:
 *   import { toast } from '@/lib/toast';
 *   toast.show({ label: 'Done!', variant: 'success' });
 *
 * The bridge is populated by <ToastRegistrar /> which must be mounted inside
 * HeroUINativeProvider (already the case in App.tsx).
 */

type ShowOptions = Parameters<import('heroui-native').ToastManager['show']>[0];
type HideOptions = Parameters<import('heroui-native').ToastManager['hide']>[0];

interface ToastBridge {
  show: (options: ShowOptions) => string | undefined;
  hide: (ids?: HideOptions) => void;
}

let _manager: import('heroui-native').ToastManager | null = null;

/** Called once by <ToastRegistrar /> — do not call manually. */
export function _registerToastManager(
  manager: import('heroui-native').ToastManager,
) {
  _manager = manager;
}

export const toast: ToastBridge = {
  show(options) {
    if (!_manager) {
      console.warn('[toast] ToastManager not yet registered — toast dropped.');
      return undefined;
    }
    return _manager.show(options);
  },
  hide(ids) {
    _manager?.hide(ids);
  },
};
