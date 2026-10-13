import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/*
 * Хостинг разрешает браузеру несколько минут держать у себя старую главную страницу.
 * Каждая сборка получает метку; страница при загрузке сверяет её с version.json (мимо кэша)
 * и, если вышла новая сборка, один раз перезагружает себя по адресу с новой меткой.
 */
function buildStamp(): Plugin {
  const build = Date.now().toString(36)
  const check =
    "(function(){var m=document.querySelector('meta[name=build]');if(!m||!window.fetch)return;" +
    "fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null})" +
    ".then(function(v){if(!v||!v.build||v.build===m.content)return;var k='updated-'+v.build;" +
    "try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch(e){return}" +
    "var u=new URL(location.href);u.searchParams.set('v',v.build);location.replace(u.toString())})" +
    "['catch'](function(){})})()"

  return {
    name: 'build-stamp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `  <meta name="build" content="${build}" />\n    <script>${check}</script>\n  </head>`,
      )
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build }) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Относительные пути: сборка работает и в корне домена, и в подпапке (GitHub Pages).
  base: './',
  plugins: [react(), buildStamp()],
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
})
