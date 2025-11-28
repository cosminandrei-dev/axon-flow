'use client';

import { useReducedMotion } from 'framer-motion';
import { createContext, useContext } from 'react';

interface ReducedMotionContextValue {
  /** Whether the user prefers reduced motion */
  prefersReducedMotion: boolean;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue>({
  prefersReducedMotion: false,
});

/**
 * Hook to check if the user prefers reduced motion.
 */
export function usePrefersReducedMotion() {
  return useContext(ReducedMotionContext);
}

interface ReducedMotionProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that detects and exposes the user's reduced motion preference.
 *
 * Uses framer-motion's useReducedMotion hook which respects the
 * prefers-reduced-motion media query.
 */
export function ReducedMotionProvider({ children }: ReducedMotionProviderProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <ReducedMotionContext.Provider value={{ prefersReducedMotion }}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

interface MotionWrapperProps {
  children: React.ReactNode;
  /** Content to render when reduced motion is preferred (defaults to children without animation) */
  reducedMotionFallback?: React.ReactNode;
}

/**
 * Wrapper component that conditionally renders animated or static content
 * based on the user's motion preference.
 */
export function MotionWrapper({
  children,
  reducedMotionFallback,
}: MotionWrapperProps) {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <>{reducedMotionFallback ?? children}</>;
  }

  return <>{children}</>;
}
