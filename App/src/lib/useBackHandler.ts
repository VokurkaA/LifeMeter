import { useNavigation } from '@/contexts/NavigationContext';
import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

interface UseBackHandlerOptions {
  onExitPrompt?: () => void;
}

/**
 * Custom hook to handle Android back button behavior:
 * 1. If in stack navigation -> go back
 * 2. If on base layer and not on home tab -> go to home tab
 * 3. If on base layer and on home tab -> prompt to exit (press back again)
 */
export function useBackHandler(options?: UseBackHandlerOptions) {
  const { canGoBack, goBack, isOnHomeTab, switchTab } = useNavigation();
  const backPressedOnce = useRef(false);
  const backPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const backAction = (): boolean => {
      // If there's a navigation stack, go back in the stack
      if (canGoBack()) {
        goBack();
        return true; // Prevent default behavior (exit app)
      }

      // If not on home tab, switch to home tab
      if (!isOnHomeTab()) {
        switchTab(0);
        return true; // Prevent default behavior (exit app)
      }

      // On home tab with no stack - handle exit confirmation
      if (backPressedOnce.current) {
        // User pressed back twice, allow app to exit
        if (backPressTimeout.current) {
          clearTimeout(backPressTimeout.current);
        }
        return false; // Allow default behavior (exit app)
      }

      // First back press on home tab - show exit prompt
      backPressedOnce.current = true;
      
      if (options?.onExitPrompt) {
        options.onExitPrompt();
      }

      // Reset the flag after 2 seconds
      backPressTimeout.current = setTimeout(() => {
        backPressedOnce.current = false;
      }, 2000);

      return true; // Prevent default behavior (exit app)
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => {
      subscription.remove();
      if (backPressTimeout.current) {
        clearTimeout(backPressTimeout.current);
      }
    };
  }, [canGoBack, goBack, isOnHomeTab, switchTab, options]);
}
