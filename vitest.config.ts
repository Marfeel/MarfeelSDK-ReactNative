import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/lib/**', '**/example/**', '.worktrees/**'],
  },
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'src/__tests__/react-native-mock.ts'),
    },
  },
});
