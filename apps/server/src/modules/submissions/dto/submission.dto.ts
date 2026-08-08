import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'My Open Source Project', description: '项目名称' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  repoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  homepage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(200)
  email?: string;
}

export enum ReviewStatus {
  Approved = 'approved',
  Rejected = 'rejected',
}

export class ReviewSubmissionDto {
  @ApiProperty({ enum: ReviewStatus, description: '审核结果' })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiProperty({ required: false, description: '审核备注' })
  @IsOptional()
  @IsString()
  note?: string;
}
