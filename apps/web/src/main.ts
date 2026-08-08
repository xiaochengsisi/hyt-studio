import { createApp } from 'vue';
import type { Directive } from 'vue';
import App from './App.vue';
import { router } from './router';
import { setSeo } from './composables/useSeo';
import { i18n, getLocale } from './i18n';
import './style.css';

// 同步 <html lang>，便于 SEO 与无障碍
document.documentElement.lang = getLocale() === 'zh-CN' ? 'zh-CN' : 'en';

// 每条路由的默认标题（详情页会在数据加载后覆盖）
const routeTitles: Record<string, string> = {
  home: '首页',
  products: '开源项目',
  'product-detail': '项目详情',
  blog: '博客',
  'blog-detail': '文章',
  about: '关于我们',
  submit: '提交项目',
};

router.afterEach((to) => {
  const title = routeTitles[String(to.name)];
  setSeo(title);
});

// 滚动渐入动画指令：v-reveal 或 v-reveal="'d-1'"（延迟错峰）
const reveal: Directive = {
  mounted(el, binding) {
    el.classList.add('reveal');
    if (typeof binding.value === 'string') {
      el.classList.add(binding.value);
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('revealed');
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
  },
};

const app = createApp(App);
app.directive('reveal', reveal);
app.use(i18n);
app.use(router).mount('#app');