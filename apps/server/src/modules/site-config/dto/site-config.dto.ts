import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 站点配置更新 DTO。content 为结构化 JSON，校验交给业务层。
 * 其余字段均为可选字符串。
 */
export class UpdateSiteConfigDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() siteName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() slogan?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() siteUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() logoUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() github?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() twitter?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() icp?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() policeRecord?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() analyticsCode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() seoKeywords?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() seoOgImage?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() seoRobots?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() seoTwitter?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() aiProvider?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() aiBaseUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() aiApiKey?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() aiModel?: string;

  /** 前台页面内容 JSON，由业务层解析 */
  @ApiProperty({ required: false })
  @IsOptional()
  content?: any;
}
