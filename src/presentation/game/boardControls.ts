import { createContext } from 'react';
import type { ReactNode } from 'react';

export const BoardControls = createContext<{
  content: ReactNode;
} | null>(null);
