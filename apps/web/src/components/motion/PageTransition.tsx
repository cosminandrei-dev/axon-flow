'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

import { slideUp, defaultTransition } from '@/lib/motion-variants';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Page transition wrapper component.
 *
 * Wraps page content with smooth fade and slide animations during route changes.
 * Respects prefers-reduced-motion via CSS (see globals.css).
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={slideUp}
        transition={defaultTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
