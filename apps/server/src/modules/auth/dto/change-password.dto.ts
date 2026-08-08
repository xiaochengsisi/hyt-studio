import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: '原密码' })
  @IsString()
  @MinLength(1)
  oldPassword: string;

  @ApiProperty({ description: '新密码（至少 6 位）' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
