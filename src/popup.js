import './assets/popup.css'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Create app with initial props
const app = createApp(App, {
  isPopup: true
})

// Initialize plugins and mount app
registerPlugins(app).then(() => {
  app.mount('#app')
})
