import {
  createMMKV,
  useMMKVBoolean,
  useMMKVNumber,
  useMMKVObject,
  useMMKVString,
} from "react-native-mmkv";

const Storage = createMMKV();

export const storage = {
  string: {
    get: (key: string) => Storage.getString(key),
    set: (key: string, value: string) => Storage.set(key, value),
  },
  boolean: {
    get: (key: string) => Storage.getBoolean(key),
    set: (key: string, value: boolean) => Storage.set(key, value),
  },
  number: {
    get: (key: string) => Storage.getNumber(key),
    set: (key: string, value: number) => Storage.set(key, value),
  },
  object: {
    get: <T extends object>(key: string): T | null => {
      const value = Storage.getString(key);
      if (value !== undefined) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      }
      return null;
    },
    set: <T extends object>(key: string, value: T) => {
      Storage.set(key, JSON.stringify(value));
    },
  },
  array: {
    get: <T>(key: string): T[] | null => {
      const value = Storage.getString(key);
      if (value !== undefined) {
        try {
          return JSON.parse(value) as T[];
        } catch {
          return null;
        }
      }
      return null;
    },
    set: <T>(key: string, value: T[]) => {
      Storage.set(key, JSON.stringify(value));
    },
  },
  has: (key: string) => Storage.contains(key),
  delete: (key: string) => Storage.remove(key),
  getAllKeys: () => Storage.getAllKeys(),
  clearAll: () => Storage.clearAll(),
};

export const useStorage = {
  string: (key: string) => useMMKVString(key),
  number: (key: string) => useMMKVNumber(key),
  boolean: (key: string) => useMMKVBoolean(key),
  object: <T extends object>(key: string) => useMMKVObject<T>(key),
  array: <T>(key: string) => useMMKVObject<T[]>(key),
};
