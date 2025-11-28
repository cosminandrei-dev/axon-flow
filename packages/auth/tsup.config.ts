import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/guards/index.ts',
    'src/decorators/index.ts',
    'src/providers/index.ts',
  ],
  format: ['esm'],
  dts: {
    compilerOptions: {
      composite: false,
      declaration: true,
      declarationMap: true,
    },
  },
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external: [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/graphql',
    'reflect-metadata',
    'rxjs',
  ],
});
