import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Topic } from '@hyt/shared';
import { TopicsService } from './topics.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('topics')
@Controller('api/topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  /** Public: 专题列表 */
  @Public()
  @Get()
  list(): Promise<Topic[]> {
    return this.topicsService.listPublic();
  }

  /** Public: 专题详情（含关联产品） */
  @Public()
  @Get('slug/:slug')
  bySlug(@Param('slug') slug: string): Promise<Topic> {
    return this.topicsService.findBySlug(slug);
  }

  @Get('admin')
  adminList(): Promise<Topic[]> {
    return this.topicsService.listAll();
  }

  @Get('admin/:id')
  adminDetail(@Param('id') id: number): Promise<Topic> {
    return this.topicsService.findById(id);
  }

  @Post('admin')
  create(@Body() data: CreateTopicDto): Promise<Topic> {
    return this.topicsService.create(data as any);
  }

  @Put('admin/:id')
  update(@Param('id') id: number, @Body() data: UpdateTopicDto): Promise<Topic> {
    return this.topicsService.update(id, data as any);
  }

  @Delete('admin/:id')
  remove(@Param('id') id: number): Promise<void> {
    return this.topicsService.remove(Number(id));
  }
}
