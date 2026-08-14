import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { restore } from './stores/auth';
import './style.css';

// 应用启动时用 httpOnly Cookie 恢复后台登录态（刷新页面后免重新登录）。
// 非阻塞调用：本地已缓存 user 可立即通过路由守卫，restore 完成后会刷新鉴权状态。
restore();
createApp(App).use(router).mount('#app');
