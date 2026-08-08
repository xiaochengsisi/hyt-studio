import type { PageContent } from '@hyt/shared';

export type { PageContent };

/** 页面文案默认值（与现状一致），后台未配置时使用 */
export const DEFAULT_CONTENT: PageContent = {
  hero: {
    badge: '开源网络工作室 · 持续开源中',
    titleLine1: '让开源项目',
    titleLine2: '开箱即用',
    subtitle:
      'HYT Studio 打磨高质量的开源程序与 Web 工具，开放源码、服务开发者社区，让每个项目都能快速上手、稳定运行。',
    ctaPrimary: '浏览开源项目',
    ctaSecondary: '了解更多',
  },
  features: {
    eyebrow: 'Why HYT',
    title: '为开源而生的理念',
    subtitle: '把复杂留给自己，把简单与可靠交付给每个使用我们项目的人。',
    items: [
      { icon: 'S', title: '完全开源', desc: '所有项目代码公开透明，遵循 MIT 许可，任何人都可以自由使用、修改与分发。', tone: 'green' },
      { icon: 'Q', title: '精益打磨', desc: '少而精是我们的原则，每个项目都经过认真设计、严格测试与持续迭代。', tone: 'cyan' },
      { icon: 'C', title: '回馈社区', desc: '欢迎 Issues、PR 与任何形式的贡献，让开源成为推动技术普惠的力量。', tone: 'violet' },
      { icon: 'W', title: 'Web 前沿', desc: '深耕 Vue、Node 与现代化工程实践，把先进经验沉淀为可复用的能力。', tone: 'amber' },
    ],
  },
  stats: [
    { value: '', label: '开源项目' },
    { value: '100%', label: '免费开放' },
    { value: 'MIT', label: '开源协议' },
    { value: '∞', label: '持续迭代' },
  ],
  cta: {
    title: '一起，把开源做得更好',
    subtitle: '无论是使用、贡献还是反馈，都欢迎你加入 HYT Studio 的开源之旅。',
    primary: '开始探索',
    secondary: '联系我们',
  },
  projects: {
    featuredEyebrow: 'Featured projects',
    featuredTitle: '精选开源项目',
    featuredSub: '我们独立开发与维护的项目，开放源码，欢迎使用与贡献。',
    allEyebrow: 'All projects',
    allTitle: '更多项目',
    allSub: '更多我们正在打磨的开源工程。',
    viewAll: '查看全部项目 →',
  },
  about: {
    eyebrow: 'About us',
    title: '关于我们',
    introTitle: '我们是谁',
    introText:
      'HYT Studio 是一支热爱开源与 Web 技术的网络工作室。我们独立开发并维护一系列开源程序，并将其无偿分享给开发者社区，让每一份努力都能被更多人使用与认可。',
    values: [
      { icon: 'S', title: '开源优先', desc: '代码公开透明，欢迎所有人使用与贡献。', tone: 'green' },
      { icon: 'Q', title: '精益打磨', desc: '少而精，把每个项目做扎实。', tone: 'cyan' },
      { icon: 'C', title: '回馈社区', desc: '用开源推动技术普惠。', tone: 'violet' },
    ],
    contactTitle: '联系我们',
  },
};

/** 合并后台配置与默认值，保证结构完整 */
export function resolveContent(content?: PageContent): PageContent {
  const d = DEFAULT_CONTENT;
  const c = content || ({} as Partial<PageContent>);
  return {
    hero: { ...d.hero, ...c.hero },
    features: {
      ...d.features,
      ...c.features,
      items: c.features?.items?.length ? c.features.items : d.features.items,
    },
    stats: c.stats?.length ? c.stats : d.stats,
    cta: { ...d.cta, ...c.cta },
    projects: { ...d.projects, ...c.projects },
    about: {
      ...d.about,
      ...c.about,
      values: c.about?.values?.length ? c.about.values : d.about.values,
    },
  };
}