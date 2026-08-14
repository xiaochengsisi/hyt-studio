import { BadRequestException } from '@nestjs/common';
import { AiSeoService } from './ai-seo.service';

// SSRF 校验工具在单测中按放行处理，避免依赖真实 DNS 解析，专注测试解析逻辑
jest.mock('../../common/utils/ssrf');

/** 模拟 SiteConfigService */
function mockSiteConfigService(cfg: any) {
  return { getAdminConfig: async () => cfg } as any;
}

/** 构造一个类 Response 的桩对象 */
function mockResponse(body: any, ok = true, status = 200) {
  return {
    ok,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body,
  } as any;
}

describe('AiSeoService', () => {
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = (global as any).fetch;
  });
  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it('未配置 AI 服务时抛出 BadRequestException', async () => {
    const service = new AiSeoService(mockSiteConfigService({}));
    await expect(
      service.generate({ type: 'product', name: '测试', content: '内容' }, 'u1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('能解析纯 JSON 返回并归一化字段', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValue(
        mockResponse({
          choices: [{ message: { content: '{"seoTitle":"标题","seoDescription":"描述","seoKeywords":"a,b,c"}' } }],
        }),
      );
    const service = new AiSeoService(
      mockSiteConfigService({
        aiBaseUrl: 'https://api.example.com/v1',
        aiApiKey: 'sk-test',
        aiModel: 'test-model',
      }),
    );
    const result = await service.generate({ type: 'product', name: '测试', content: '内容' }, 'u1');
    expect(result.seoTitle).toBe('标题');
    expect(result.seoDescription).toBe('描述');
    expect(result.seoKeywords).toBe('a,b,c');
  });

  it('能解析带 ```json 代码块的返回', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue(
      mockResponse({
        choices: [
          {
            message: {
              content: '```json\n{"seoTitle":"T","seoDescription":"D","seoKeywords":"k1,k2"}\n```',
            },
          },
        ],
      }),
    );
    const service = new AiSeoService(
      mockSiteConfigService({ aiBaseUrl: 'x', aiApiKey: 'y', aiModel: 'm' }),
    );
    const result = await service.generate({ type: 'article', name: '标题' }, 'u1');
    expect(result.seoTitle).toBe('T');
    expect(result.seoKeywords).toBe('k1,k2');
  });

  it('接口返回非 2xx 时抛出内部错误', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue(mockResponse('upstream error', false, 500));
    const service = new AiSeoService(
      mockSiteConfigService({ aiBaseUrl: 'x', aiApiKey: 'y', aiModel: 'm' }),
    );
    await expect(
      service.generate({ type: 'product', name: 'x' }, 'u1'),
    ).rejects.toThrow();
  });
});
