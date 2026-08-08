import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';

export enum ArticleStatus {
  Published = 'published',
  Draft = 'draft',
}

export class CreateArticleDto {
  @ApiProperty({ example: 'Hello HYT', description: '文章标题' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ required: false, example: 'hello-hyt' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ required: false, description: 'Markdown 正文' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty({ required: false, enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  seoKeywords?: string;
}

/** 更新：所有字段可选 */
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
