import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Media } from '@hyt/shared';
import { MediaService } from './media.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('media')
@Roles('admin')
@Controller('api/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /** Admin: 媒体库列表 */
  @Get()
  list(): Promise<Media[]> {
    return this.mediaService.list();
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.mediaService.remove(Number(id));
  }
}
