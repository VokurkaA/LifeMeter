import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { addNetworkStateListener, getNetworkStateAsync, NetworkState } from 'expo-network';
import { flushQueue } from '@/lib/net';
import { isOffline as _isOffline, setIsOffline, emitReconnect } from '@/lib/network-state';
import { toast } from '@/lib/toast';

export { isOffline } from '@/lib/network-state';

getNetworkStateAsync().then((state) => {
    setIsOffline(!(state.isConnected && state.isInternetReachable));
});

const NetworkContext = createContext<boolean>(false);

export function NetworkProvider({ children }: { children: ReactNode }) {
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        getNetworkStateAsync().then((state) => {
            const nextOffline = !(state.isConnected && state.isInternetReachable);
            setIsOffline(nextOffline);
            setOffline(nextOffline);
        });

        const subscription = addNetworkStateListener((state) => {
            const nextOffline = !(state.isConnected && state.isInternetReachable);
            const wasOffline = _isOffline;

            setIsOffline(nextOffline);
            setOffline(nextOffline);

            if (wasOffline && !nextOffline) {
                toast.show({ label: 'Back online', description: 'Your connection has been restored.', variant: 'success' });
                flushQueue().then(() => emitReconnect());
            } else if (!wasOffline && nextOffline) {
                toast.show({ label: 'No internet', description: 'Changes will be saved and synced when reconnected.', variant: 'warning' });
            }
        });

        return () => subscription.remove();
    }, []);

    return (
        <NetworkContext.Provider value={offline}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useIsOffline(): boolean {
    return useContext(NetworkContext);
}

type NetworkChangeCallback = (state: NetworkState, wasOnline: boolean) => void;

export function useNetworkChange(onChange: NetworkChangeCallback) {
    const prevIsConnected = useRef<boolean | null>(null);

    useEffect(() => {
        const subscription = addNetworkStateListener((state) => {
            const isOnline = !!(state.isConnected && state.isInternetReachable);
            const wasOnline = prevIsConnected.current ?? isOnline;

            setIsOffline(!isOnline);

            if (prevIsConnected.current !== isOnline) {
                onChange(state, wasOnline);
                prevIsConnected.current = isOnline;
            }
        });

        return () => subscription.remove();
    }, [onChange]);
}