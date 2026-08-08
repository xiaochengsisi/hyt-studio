import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiSeoGenerateDto {
  @ApiProperty({ enum: ['product', 'article'], description: '内容类型' })
  @IsEnum(['product', 'article'])
  type: 'product' | 'article';

  @ApiProperty({ example: 'HytTUI', description: '标题' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ required: false, description: '正文内容（Markdown）' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tags?: string;
}
