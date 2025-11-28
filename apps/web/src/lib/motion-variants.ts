import type { Variants } from 'framer-motion';

/**
 * Framer Motion animation variants for consistent animations across the app.
 * All durations are set to 300ms to match the design system transition speed.
 */

/** Fade in animation */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Slide up animation with fade */
export const slideUp: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

/** Slide down animation with fade */
export const slideDown: Variants = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

/** Scale animation with fade */
export const scale: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

/** Slide in from left */
export const slideInLeft: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

/** Slide in from right */
export const slideInRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

/** Stagger children animation */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/** Default transition settings */
export const defaultTransition = {
  duration: 0.3,
  ease: 'easeOut' as const,
};

/** Spring transition for more natural feel */
export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};
