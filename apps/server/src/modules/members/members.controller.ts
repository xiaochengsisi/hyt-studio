import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Member } from '@hyt/shared';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('members')
@Controller('api/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  /** Public: 团队成员列表（前台 /team 页） */
  @Public()
  @Get()
  list(): Promise<Member[]> {
    return this.membersService.listPublic();
  }

  /** Admin: 全部成员 */
  @Roles('admin')
  @Get('admin')
  adminList(): Promise<Member[]> {
    return this.membersService.listAll();
  }

  @Roles('admin')
  @Get('admin/:id')
  adminDetail(@Param('id') id: number): Promise<Member> {
    return this.membersService.findById(id);
  }

  @Roles('admin')
  @Post('admin')
  create(@Body() data: CreateMemberDto): Promise<Member> {
    return this.membersService.create(data as any);
  }

  @Roles('admin')
  @Put('admin/:id')
  update(@Param('id') id: number, @Body() data: UpdateMemberDto): Promise<Member> {
    return this.membersService.update(id, data as any);
  }

  @Roles('admin')
  @Delete('admin/:id')
  remove(@Param('id') id: number): Promise<void> {
    return this.membersService.remove(Number(id));
  }
}
