import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './css/style.css';
import { init } from './telegram';

const app = createApp(App);
const pinia = createPinia();

// Initialize Telegram Mini Apps SDK
init();

app.use(pinia);
app.mount('#app');
