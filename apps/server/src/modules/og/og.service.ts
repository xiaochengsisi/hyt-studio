import { Injectable } from '@nestjs/common';
import { Resvg } from '@resvg/resvg-js';
import { ProductsService } from '../products/products.service';
import { SiteConfigService } from '../site-config/site-config.service';

const WIDTH = 1200;
const HEIGHT = 630;

@Injectable()
export class OgService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly siteConfig: SiteConfigService,
  ) {}

  /** 生成产品分享卡片 PNG */
  async productCard(slug: string): Promise<Buffer> {
    const product = await this.productsService.findBySlug(slug, true);
    const site = await this.siteConfig.getConfig();
    const siteName = site.siteName || 'HYT Studio';
    const svg = this.buildSvg({
      siteName,
      title: product.name,
      subtitle: product.tagline || product.description || '',
      language: product.language,
      stars: product.githubStars,
      version: product.version,
    });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
    const png = resvg.render().asPng();
    return Buffer.from(png);
  }

  private escape(s: string): string {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 截断长文本，避免溢出卡片 */
  private truncate(s: string, max: number): string {
    const t = (s || '').trim();
    if (t.length <= max) return t;
    return t.slice(0, max - 1) + '…';
  }

  private buildSvg(opts: {
    siteName: string;
    title: string;
    subtitle: string;
    language?: string;
    stars?: number;
    version?: string;
  }): string {
    const title = this.escape(this.truncate(opts.title, 40));
    const subtitle = this.escape(this.truncate(opts.subtitle, 80));
    const siteName = this.escape(this.truncate(opts.siteName, 30));
    const letter = this.escape((opts.title.charAt(0) || 'P').toUpperCase());

    // 右上角元信息：语言 / star / 版本
    const metaParts: string[] = [];
    if (opts.language) metaParts.push(this.escape(opts.language));
    if (opts.stars && opts.stars > 0) metaParts.push(`★ ${this.fmt(opts.stars)}`);
    if (opts.version) metaParts.push(`v${this.escape(opts.version)}`);
    const meta = metaParts.join('  ·  ');

    return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>
  <rect x="0" y="0" width="8" height="${HEIGHT}" fill="#16a34a"/>
  <text x="80" y="110" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="28" fill="#16a34a" font-weight="600">${siteName}</text>
  <text x="80" y="125" font-family="monospace" font-size="22" fill="#94a3b8">/ open source</text>

  <rect x="80" y="210" width="120" height="120" rx="24" fill="#f1f5f9"/>
  <text x="140" y="298" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="64" fill="#16a34a" font-weight="700" text-anchor="middle">${letter}</text>

  <text x="240" y="290" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="64" fill="#0f172a" font-weight="800" letter-spacing="-2">${title}</text>
  <text x="240" y="345" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="30" fill="#64748b">${subtitle}</text>

  <text x="80" y="540" font-family="monospace" font-size="26" fill="#475569">${meta}</text>
  <rect x="80" y="570" width="${WIDTH - 160}" height="2" fill="#e2e8f0"/>
  <text x="80" y="600" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="22" fill="#94a3b8">开源项目 · 查看详情</text>
</svg>`;
  }

  private fmt(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }
}
