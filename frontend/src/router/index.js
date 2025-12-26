import { createRouter, createWebHistory } from 'vue-router';
import ConfigView from '../views/ConfigView.vue';
import TranslateView from '../views/TranslateView.vue';

const routes = [
  {
    path: '/',
    redirect: '/translate'
  },
  {
    path: '/config',
    name: 'Config',
    component: ConfigView
  },
  {
    path: '/translate',
    name: 'Translate',
    component: TranslateView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

