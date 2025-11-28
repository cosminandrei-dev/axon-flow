// Stub for deprecated @esbuild-kit/core-utils
// This package was merged into tsx - see: https://tsx.is
// Providing minimal compatible API for packages that depend on it

import * as esbuild from 'esbuild';

export const transform = esbuild.transform;
export const transformSync = esbuild.transformSync;

export function getTsconfig(searchPath) {
  // Minimal implementation - returns null if no tsconfig found
  // Most consumers have their own tsconfig handling
  return null;
}

export const version = '3.3.2';
