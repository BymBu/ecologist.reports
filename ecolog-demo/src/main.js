import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(error => {
        console.log('SW registration failed: ', error)
      })
  })
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

