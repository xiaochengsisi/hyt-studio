import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';

export enum ProductStatus {
  Published = 'published',
  Draft = 'draft',
  Archived = 'archived',
}

export class CreateProductDto {
  @ApiProperty({ example: 'HytTUI', description: '产品名称' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ required: false, example: 'hyttui' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Markdown 文档' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false, description: '截图 URL，逗号分隔' })
  @IsOptional()
  @IsString()
  screenshots?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tags?: string;

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
  docsUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ required: false, enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

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
export class UpdateProductDto extends PartialType(CreateProductDto) {}
