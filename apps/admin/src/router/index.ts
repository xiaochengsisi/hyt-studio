import { createRouter, createWebHistory } from 'vue-router';
import { isLoggedIn } from '../stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'products', name: 'products', component: () => import('../views/ProductsView.vue') },
        { path: 'products/new', name: 'product-new', component: () => import('../views/ProductEditView.vue') },
        { path: 'products/:id', name: 'product-edit', component: () => import('../views/ProductEditView.vue') },
        { path: 'articles', name: 'articles', component: () => import('../views/ArticlesView.vue') },
        { path: 'articles/new', name: 'article-new', component: () => import('../views/ArticleEditView.vue') },
        { path: 'articles/:id', name: 'article-edit', component: () => import('../views/ArticleEditView.vue') },
        { path: 'settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
        { path: 'content', name: 'content', component: () => import('../views/ContentView.vue') },
        { path: 'users', name: 'users', component: () => import('../views/UsersView.vue') },
        { path: 'members', name: 'members', component: () => import('../views/MembersView.vue') },
        { path: 'submissions', name: 'submissions', component: () => import('../views/SubmissionsView.vue') },
        { path: 'audit-log', name: 'audit-log', component: () => import('../views/AuditLogView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  if (to.name !== 'login' && !isLoggedIn()) {
    return { name: 'login' };
  }
  if (to.name === 'login' && isLoggedIn()) {
    return { name: 'dashboard' };
  }
  return true;
});