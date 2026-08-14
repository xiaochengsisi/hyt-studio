import { BadRequestException } from '@nestjs/common';
import { isIP } from 'net';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

/** 判断一个 IPv4 地址是否为私有 / 环回 / 链路本地 / 保留 / CGNAT 地址 */
function isPrivateOrReservedIpV4(ip: string): boolean {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true; // 非法视为危险
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 环回
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 链路本地
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // 组播 / 保留
  return false;
}

/** 判断任意 IP（v4 / v6 / IPv4-mapped IPv6）是否为私有或保留地址 */
function isPrivateOrReservedIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true; // 环回 / 未指定
    if (lower.startsWith('fe80')) return true; // 链路本地
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // 唯一本地 fc00::/7
    if (lower.startsWith('::ffff:')) {
      return isPrivateOrReservedIpV4(lower.replace('::ffff:', ''));
    }
    return false; // 其它 IPv6 保守放行（公网）
  }
  return isPrivateOrReservedIpV4(ip);
}

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.internal', '.local'];

/**
 * 校验出站 URL 是否安全（SSRF 防护）。
 * - 仅允许 http/https
 * - 禁止 localhost / .internal / .local 等主机名
 * - 对 IP 字面量直接判定；对域名做 DNS 解析后二次判定，缓解 DNS rebinding / 解析到内网
 * @returns true 表示安全
 */
export async function isSafeOutboundUrl(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) return false;

  // IP 字面量
  const ipVer = isIP(host);
  if (ipVer === 4 || ipVer === 6) {
    return !isPrivateOrReservedIp(host);
  }

  // 域名：解析后校验解析到的地址
  try {
    const { address } = await dnsLookup(host, { all: false });
    return !isPrivateOrReservedIp(address);
  } catch {
    return false;
  }
}

/** 校验失败直接抛错（用于 AI SEO 等需明确报错的场景） */
export async function assertSafeOutboundUrl(rawUrl: string): Promise<void> {
  const safe = await isSafeOutboundUrl(rawUrl);
  if (!safe) {
    throw new BadRequestException('目标地址不被允许（禁止访问内网或本地地址）');
  }
}
