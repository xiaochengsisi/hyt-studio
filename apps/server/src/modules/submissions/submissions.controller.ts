import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApproveAndCreateResult, Paginated, ProjectSubmission } from '@hyt/shared';
import { QuerySubmissions, SubmissionsService } from './submissions.service';
import { CreateSubmissionDto, ReviewSubmissionDto } from './dto/submission.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('submissions')
@Controller('api/submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  /** 前台提交（公开） */
  @Public()
  @Post()
  create(@Body() data: CreateSubmissionDto): Promise<ProjectSubmission> {
    return this.submissionsService.create(data as any);
  }

  /** 后台：审核列表 */
  @Get('admin')
  list(@Query() query: QuerySubmissions): Promise<Paginated<ProjectSubmission>> {
    return this.submissionsService.list(query);
  }

  /** 后台：审核（approve/reject） */
  @Put('admin/:id/review')
  review(
    @Param('id') id: number,
    @Body() body: ReviewSubmissionDto,
  ): Promise<ProjectSubmission> {
    return this.submissionsService.review(Number(id), body.status, body.note);
  }

  /** 后台：审核通过并一键创建为产品草稿 */
  @Post('admin/:id/approve-and-create')
  approveAndCreate(@Param('id') id: number): Promise<ApproveAndCreateResult> {
    return this.submissionsService.approveAndCreate(Number(id));
  }

  @Delete('admin/:id')
  remove(@Param('id') id: number): Promise<void> {
    return this.submissionsService.remove(Number(id));
  }
}