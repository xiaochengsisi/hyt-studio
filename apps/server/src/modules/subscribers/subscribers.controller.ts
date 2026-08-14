import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Subscriber } from '@hyt/shared';
import { SubscribersService } from './subscribers.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('subscribers')
@Controller('api/subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  /** Public: 订阅（限流防滥用） */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('subscribe')
  subscribe(@Body() body: { email?: string }): Promise<{ pending: boolean }> {
    return this.subscribersService.subscribe(body?.email || '');
  }

  /** Public: 退订 */
  @Public()
  @Post('unsubscribe')
  unsubscribe(@Body() body: { email?: string }): Promise<void> {
    return this.subscribersService.unsubscribe(body?.email || '');
  }

  /** Public: 确认订阅（邮件链接点击，回 HTML 提示页） */
  @Public()
  @Get('confirm')
  async confirm(@Query('token') token: string, @Res() res: Response): Promise<void> {
    try {
      await this.subscribersService.confirm(token);
      res.type('html').send('<div style="font-family:sans-serif;text-align:center;padding:60px;"><h2 style="color:#0a7d50;">订阅成功 ✅</h2><p>你已成功确认订阅，感谢关注。</p></div>');
    } catch {
      res.status(400).type('html').send('<div style="font-family:sans-serif;text-align:center;padding:60px;"><h2 style="color:#ef4444;">链接无效</h2><p>确认链接无效或已过期。</p></div>');
    }
  }

  /** Admin: 订阅者列表 */
  @Roles('admin')
  @Get()
  list(): Promise<Subscriber[]> {
    return this.subscribersService.listAll();
  }

  /** Admin: 群发邮件 */
  @Roles('admin')
  @Post('broadcast')
  broadcast(@Body() body: { subject?: string; html?: string }): Promise<{ sent: number }> {
    return this.subscribersService.broadcast(body?.subject || '', body?.html || '');
  }
}
