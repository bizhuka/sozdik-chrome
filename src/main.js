import './assets/main.css'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

// Initialize plugins and mount app
registerPlugins(app).then(() => {
  app.mount('#app')
})
