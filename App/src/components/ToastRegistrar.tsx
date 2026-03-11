import { useEffect } from 'react';
import { useToast } from 'heroui-native';
import { _registerToastManager } from '@/lib/toast';

/**
 * Mount this once inside HeroUINativeProvider (e.g. in App.tsx).
 * It registers the ToastManager so non-component code can call toast.show().
 */
export default function ToastRegistrar() {
  const { toast } = useToast();

  useEffect(() => {
    _registerToastManager(toast);
  }, [toast]);

  return null;
}
