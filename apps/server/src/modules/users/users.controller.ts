import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService, UserDto } from './users.service';
import { CreateUserDto, UpdatePasswordDto } from './dto/user.dto';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(): Promise<UserDto[]> {
    return this.usersService.list();
  }

  @Post()
  create(@Body() body: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(body.username, body.password);
  }

  @Put(':id/password')
  updatePassword(@Param('id') id: number, @Body() body: UpdatePasswordDto): Promise<UserDto> {
    return this.usersService.updatePassword(Number(id), body.password);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @CurrentUser() user: JwtUser): Promise<void> {
    return this.usersService.remove(Number(id), user.id);
  }
}