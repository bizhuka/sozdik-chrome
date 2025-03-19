// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
// import { copy } from 'vite-plugin-copy';
import { viteStaticCopy } from 'vite-plugin-static-copy'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({

  build: {
    rollupOptions: {
      input: {
        popup: fileURLToPath(new URL('./popup.html', import.meta.url)),
        sidepanel: fileURLToPath(new URL('./sidepanel.html', import.meta.url))
      }
    }
  },

  plugins: [
    Vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify(),
    Components(),
    // ViteFonts({
    //   google: {
    //     families: [
    //     //   {
    //     //   name: 'Roboto',
    //     //   styles: 'wght@100;300;400;500;700;900',
    //     // }
    //   ],
    //   },
    // }),

    // copy({
    //   targets: [
    //     { src: 'src/background.js', dest: './dist' }
    //   ],
    //   hook: 'writeBundle', // Ensures it copies files during build.
    // }),

    viteStaticCopy({
      targets: [
        {
          src: 'src/background.js',
          dest: './',
        },
        {
          src: 'src/util.js',
          dest: './',
        },
        {
          src: 'src/translations.js',
          dest: './',
        },
        {
          src: 'src/lib/dexie.min.mjs',
          dest: './lib/',
        }
      ],
    }),

  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
      },
    },
  },
})
