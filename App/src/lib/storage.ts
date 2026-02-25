import { createMMKV } from "react-native-mmkv";

/**
 * Fast, encrypted storage using MMKV
 */
export const storage = createMMKV();

/**
 * Typed storage helpers
 */
export const Storage = {
  /**
   * Set a string value
   */
  setString(key: string, value: string) {
    storage.set(key, value);
  },

  /**
   * Get a string value
   */
  getString(key: string): string | undefined {
    return storage.getString(key);
  },

  /**
   * Set a number value
   */
  setNumber(key: string, value: number) {
    storage.set(key, value);
  },

  /**
   * Get a number value
   */
  getNumber(key: string): number | undefined {
    return storage.getNumber(key);
  },

  /**
   * Set a boolean value
   */
  setBoolean(key: string, value: boolean) {
    storage.set(key, value);
  },

  /**
   * Get a boolean value
   */
  getBoolean(key: string): boolean | undefined {
    return storage.getBoolean(key);
  },

  /**
   * Set an object (will be JSON stringified)
   */
  setObject<T>(key: string, value: T) {
    storage.set(key, JSON.stringify(value));
  },

  /**
   * Get an object (will be JSON parsed)
   */
  getObject<T>(key: string): T | undefined {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : undefined;
  },

  /**
   * Delete a value
   */
  delete(key: string) {
    storage.remove(key);
  },

  /**
   * Check if a key exists
   */
  contains(key: string): boolean {
    return storage.contains(key);
  },

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return storage.getAllKeys();
  },

  /**
   * Clear all data
   */
  clearAll() {
    storage.clearAll();
  },
};