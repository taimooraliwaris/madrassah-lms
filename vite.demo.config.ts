import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';
export default defineConfig({
  envDir: resolve('demo'),
  plugins: [tanstackRouter({target:'react',routesDirectory:'./demo-src/routes',generatedRouteTree:'./demo-src/routeTree.gen.ts',autoCodeSplitting:true}),react(),tailwind()],
  resolve: {alias:{'@':resolve('demo-src')}},
  build:{outDir:'dist-demo',sourcemap:false},
});
