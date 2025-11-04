import * as SecureStore from 'expo-secure-store';

export async function setSecureItem(key: string, value: unknown) {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function getSecureItem<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function deleteSecureItem(key: string) {
  await SecureStore.deleteItemAsync(key);
}