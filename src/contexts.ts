import { createContext } from 'react';
import type { Store } from './store';
import type { Auth } from './auth';
// Keep context identity stable when a provider or its business rules refresh in Vite.
export const LibraryContext = createContext<Store | null>(null);
export const AuthContext = createContext<Auth | null>(null);
