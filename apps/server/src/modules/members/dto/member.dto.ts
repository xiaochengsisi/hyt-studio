import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Member } from '@hyt/shared';

export class CreateMemberDto implements Partial<Member> {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  role?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  github?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  twitter?: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  website?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateMemberDto extends CreateMemberDto {}
