import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'My Open Source Project', description: '项目名称' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  repoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  homepage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
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
