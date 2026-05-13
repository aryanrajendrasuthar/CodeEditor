import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['node-pty', 'electron-store', 'simple-git']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [
      react(),
      (monacoEditorPlugin as any).default({
        languageWorkers: [
          'editorWorkerService',
          'typescript',
          'json',
          'html',
          'css'
        ]
      })
    ],
    define: {
      'process.env': {}
    }
  }
});
