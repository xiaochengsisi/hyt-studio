import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'admin', description: '用户名（3-32 位）' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username: string;

  @ApiProperty({ example: 'admin123', description: '密码（至少 6 位）' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: 'newpass123', description: '新密码（至少 6 位）' })
  @IsString()
  @MinLength(6)
  password: string;
}
