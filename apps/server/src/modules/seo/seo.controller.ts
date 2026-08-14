import { Controller, Get, Header } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';

import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { SiteConfig } from '../site-config/site-config.entity';

const FALLBACK_URL = process.env.SITE_URL || 'http://localhost:5175';
/** sitemap / RSS 缓存 TTL：5 分钟，被爬虫高频访问时避免每次查库 */
const SEO_CACHE_TTL = 5 * 60 * 1000;

function baseUrl(site?: SiteConfig | null): string {
  const u = site?.siteUrl || FALLBACK_URL;
  return u.replace(/\/+$/, '');
}

function esc(x: string): string {
  return x
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Controller()
export class SeoController {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Article)
    private readonly articlesRepo: Repository<Article>,
    @InjectRepository(SiteConfig)
    private readonly siteRepo: Repository<SiteConfig>,
  ) {}

  private rssCache: { data: string; expiresAt: number } | null = null;
  private sitemapCache: { data: string; expiresAt: number } | null = null;

  private async getSite(): Promise<SiteConfig | null> {
    return this.siteRepo.findOne({ where: {} });
  }

  /** RSS 订阅（产品 + 文章），5 分钟内命中缓存直接返回 */
  @Public()
  @Get('/rss.xml')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  async rss(): Promise<string> {
    const now = Date.now();
    if (this.rssCache && now < this.rssCache.expiresAt) return this.rssCache.data;

    const site = await this.getSite();
    const base = baseUrl(site);
    const siteName = site?.siteName || 'HYT Studio';

    const [products, articles] = await Promise.all([
      this.productsRepo.find({ where: { status: 'published' }, order: { id: 'DESC' } }),
      this.articlesRepo.find({ where: { status: 'published' }, order: { publishedAt: 'DESC' } }),
    ]);

    const items: string[] = [];
    for (const p of products) {
      items.push(`
    <item>
      <title>${esc(p.name)}</title>
      <link>${esc(base + '/products/' + p.slug)}</link>
      <guid>${esc(base + '/products/' + p.slug)}</guid>
      <description>${esc(p.tagline || p.description)}</description>
      <pubDate>${new Date(p.updatedAt).toUTCString()}</pubDate>
    </item>`);
    }
    for (const a of articles) {
      items.push(`
    <item>
      <title>${esc(a.title)}</title>
      <link>${esc(base + '/blog/' + a.slug)}</link>
      <guid>${esc(base + '/blog/' + a.slug)}</guid>
      <description>${esc(a.summary || '')}</description>
      <pubDate>${new Date(a.publishedAt || a.updatedAt).toUTCString()}</pubDate>
    </item>`);
    }

    const data = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(siteName)}</title>
    <link>${esc(base)}</link>
    <description>${esc(site?.description || '')}</description>
    <language>zh-cn</language>${items.join('')}
  </channel>
</rss>`;
    this.rssCache = { data, expiresAt: now + SEO_CACHE_TTL };
    return data;
  }

  /** 站点地图，5 分钟内命中缓存直接返回 */
  @Public()
  @Get('/sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async sitemap(): Promise<string> {
    const now = Date.now();
    if (this.sitemapCache && now < this.sitemapCache.expiresAt) return this.sitemapCache.data;

    const site = await this.getSite();
    const base = baseUrl(site);

    const [products, articles] = await Promise.all([
      this.productsRepo.find({ where: { status: 'published' }, order: { id: 'DESC' } }),
      this.articlesRepo.find({ where: { status: 'published' }, order: { id: 'DESC' } }),
    ]);

    const urls: string[] = [];
    const staticPages = ['/', '/products', '/blog', '/about', '/submit'];
    for (const path of staticPages) {
      urls.push(`  <url><loc>${esc(base + path)}</loc></url>`);
    }
    for (const p of products) {
      urls.push(
        `  <url><loc>${esc(base + '/products/' + p.slug)}</loc><lastmod>${new Date(p.updatedAt).toISOString().slice(0, 10)}</lastmod></url>`,
      );
    }
    for (const a of articles) {
      urls.push(
        `  <url><loc>${esc(base + '/blog/' + a.slug)}</loc><lastmod>${new Date(a.updatedAt).toISOString().slice(0, 10)}</lastmod></url>`,
      );
    }

    const data = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
    this.sitemapCache = { data, expiresAt: now + SEO_CACHE_TTL };
    return data;
  }
}
