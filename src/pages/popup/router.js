import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './pages/Home'
import Faq from './pages/Faq'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/faq', name: 'faq', component: Faq },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
