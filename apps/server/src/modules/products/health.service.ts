import { Injectable } from '@nestjs/common';
import { HealthBadge } from '@hyt/shared';
import { Product } from './product.entity';

/**
 * 基于产品 GitHub 同步数据计算健康度徽章。
 * 不依赖外部 API，仅用已落库字段，零成本。
 */
@Injectable()
export class HealthService {
  compute(p: Pick<Product, 'githubStars' | 'githubForks' | 'githubOpenIssues' | 'githubLicense' | 'githubUpdatedAt' | 'githubSyncedAt' | 'createdAt'>): HealthBadge[] {
    const badges: HealthBadge[] = [];

    // 1. 活跃度（基于 githubUpdatedAt 距今时长）
    if (p.githubUpdatedAt) {
      const days = (Date.now() - new Date(p.githubUpdatedAt).getTime()) / 86400000;
      if (days < 30) {
        badges.push({ key: 'active', label: '活跃维护', tone: 'green', icon: '●' });
      } else if (days < 180) {
        badges.push({ key: 'maintained', label: '正常维护', tone: 'blue', icon: '●' });
      } else if (days < 365) {
        badges.push({ key: 'stale', label: '更新趋缓', tone: 'yellow', icon: '●' });
      } else {
        badges.push({ key: 'stale', label: '长期未更新', tone: 'red', icon: '●' });
      }
    }

    // 2. 受欢迎度（基于 stars）
    if (p.githubStars >= 1000) {
      badges.push({ key: 'popular', label: '热门 ★1k+', tone: 'green', icon: '★' });
    } else if (p.githubStars >= 100) {
      badges.push({ key: 'popular', label: '受关注 ★100+', tone: 'blue', icon: '★' });
    }

    // 3. 开源合规（基于 license）
    if (p.githubLicense) {
      badges.push({ key: 'licensed', label: `License: ${p.githubLicense}`, tone: 'gray', icon: '⚖' });
    } else if (p.githubSyncedAt) {
      // 已同步但仍未取到 license
      badges.push({ key: 'unlicensed', label: '未声明 License', tone: 'yellow', icon: '⚠' });
    }

    // 4. 新人项目（创建时间 < 30 天）
    if (p.createdAt) {
      const ageDays = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
      if (ageDays < 30) {
        badges.push({ key: 'newcomer', label: '新上架', tone: 'blue', icon: '✦' });
      }
    }

    // 5. Issue 健康度（仅当 issue 数较高时提示）
    if (p.githubOpenIssues >= 50) {
      badges.push({ key: 'issues', label: `${p.githubOpenIssues} open issues`, tone: 'yellow', icon: '⚠' });
    }

    return badges;
  }
}
