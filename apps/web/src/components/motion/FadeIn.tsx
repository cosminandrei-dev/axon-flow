'use client';

import { motion } from 'framer-motion';

import { fadeIn, defaultTransition } from '@/lib/motion-variants';

interface FadeInProps {
  children: React.ReactNode;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Custom className */
  className?: string;
}

/**
 * Fade-in animation wrapper component.
 */
export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      transition={{ ...defaultTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
