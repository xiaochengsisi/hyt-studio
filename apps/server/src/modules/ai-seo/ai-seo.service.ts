import { BadRequestException, Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { AiSeoGeneratePayload, AiSeoResult } from '@hyt/shared';
import { SiteConfigService } from '../site-config/site-config.service';

/** 每用户限流：窗口 60s 内最多 20 次，避免滥用与成本失控 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

@Injectable()
export class AiSeoService {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  private readonly rateBuckets = new Map<string, { count: number; resetAt: number }>();

  private checkRateLimit(key: string): void {
    const now = Date.now();
    const bucket = this.rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      this.rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return;
    }
    bucket.count += 1;
    if (bucket.count > RATE_MAX) {
      throw new ServiceUnavailableException(
        `AI 生成请求过于频繁，请稍后再试（每分钟最多 ${RATE_MAX} 次）`,
      );
    }
  }

  /**
   * 调用后台配置的 AI 服务（OpenAI 兼容接口）生成 SEO 元信息。
   * 支持任意 OpenAI 兼容的服务商：DeepSeek / 智谱 GLM / OpenAI 等。
   * @param userId 限流维度（用户 ID 或 IP）
   */
  async generate(payload: AiSeoGeneratePayload, userId?: string): Promise<AiSeoResult> {
    this.checkRateLimit(userId || 'anon');

    const cfg = await this.siteConfigService.getAdminConfig();
    const baseUrl = (cfg.aiBaseUrl || '').replace(/\/+$/, '');
    const apiKey = cfg.aiApiKey || '';
    const model = cfg.aiModel || '';

    if (!baseUrl || !apiKey || !model) {
      throw new BadRequestException('未配置 AI 服务，请先在站点设置中填写接口地址、模型与 API Key');
    }

    const messages = this.buildMessages(payload);
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.4,
    };
    // 部分服务商支持 JSON 模式，加上可提升结构化输出稳定性
    body.response_format = { type: 'json_object' };

    // 超时控制：30s 未返回则中止，避免后台请求长时间挂起
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    let resp: Response;
    try {
      resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        throw new ServiceUnavailableException('AI 接口响应超时（30s），请稍后重试');
      }
      throw new InternalServerErrorException(`AI 接口请求失败：${e?.message || e}`);
    } finally {
      clearTimeout(timer);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new InternalServerErrorException(
        `AI 接口返回错误 ${resp.status}：${text.slice(0, 300) || resp.statusText}`,
      );
    }

    const data = await resp.json().catch(() => null);
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    if (!content) {
      throw new InternalServerErrorException('AI 接口未返回有效内容');
    }

    return this.parseResult(content, payload);
  }

  /** 构造系统/用户消息，要求严格 JSON 输出 */
  private buildMessages(payload: AiSeoGeneratePayload) {
    const typeLabel = payload.type === 'product' ? '开源项目' : '博客文章';
    const system =
      '你是一位资深 SEO 专家，精通搜索引擎优化与生成式引擎优化（GEO）。' +
      '请根据用户提供的内容生成中文 SEO 元信息，使其既利于传统搜索引擎收录，也易于被 ChatGPT、Perplexity 等 AI 引擎引用。' +
      '严格以 JSON 对象返回，包含且仅包含三个字段：' +
      'seoTitle（标题，不超过 30 个汉字，突出核心关键词，不含特殊符号）、' +
      'seoDescription（描述，60-120 个汉字，自然通顺，包含主要关键词，具吸引力）、' +
      'seoKeywords（5-8 个关键词，逗号分隔，覆盖核心与长尾词）。' +
      '不要输出任何解释、Markdown 或代码块标记，只返回纯 JSON。';

    const user = [
      `类型：${typeLabel}`,
      `标题：${payload.name || '（未提供）'}`,
      payload.tags ? `现有标签：${payload.tags}` : '',
      payload.content
        ? `正文内容：\n${payload.content.slice(0, 3000)}`
        : '（未提供正文，请仅根据标题生成）',
    ]
      .filter(Boolean)
      .join('\n');

    return [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
  }

  /** 健壮解析：兼容纯 JSON、带 ```json 代码块、多余文字等情况 */
  private parseResult(content: string, payload: AiSeoGeneratePayload): AiSeoResult {
    let raw = content.trim();
    // 去除可能的代码块围栏
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    // 尝试直接解析
    try {
      return this.normalize(JSON.parse(raw), payload);
    } catch {
      /* 继续尝试提取 */
    }
    // 提取首个 {...} 片段
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return this.normalize(JSON.parse(match[0]), payload);
      } catch {
        /* 继续兜底 */
      }
    }
    // 兜底：用标题作为 seoTitle，无法解析
    return {
      seoTitle: payload.name || '',
      seoDescription: content.slice(0, 120),
      seoKeywords: payload.tags || '',
    };
  }

  private normalize(obj: any, payload: AiSeoGeneratePayload): AiSeoResult {
    const clean = (s: any) => (typeof s === 'string' ? s.trim() : '');
    return {
      seoTitle: clean(obj?.seoTitle) || payload.name || '',
      seoDescription: clean(obj?.seoDescription) || '',
      seoKeywords: clean(obj?.seoKeywords) || payload.tags || '',
    };
  }
}
