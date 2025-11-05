import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
  IsObject,
  ValidateNested,
  IsEmail,
  IsArray,
  ValidateNested as ValidateNestedArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SocialMediaDto {
  @ApiPropertyOptional({ description: '웹사이트 URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Facebook URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({ description: 'Twitter URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({ description: 'Instagram URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional({ description: 'LinkedIn URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  linkedin?: string;
}

class ContactInfoDto {
  @ApiPropertyOptional({ description: '이메일 주소' })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '전화번호' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '소셜 미디어 정보', type: SocialMediaDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;
}

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({ description: '회사명', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @ApiPropertyOptional({ description: '로고 URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ description: '파비콘 URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Primary 색상 (HEX 코드)', example: '#667eea' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '올바른 HEX 색상 코드 형식이 아닙니다 (예: #667eea)' })
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary 색상 (HEX 코드)', example: '#764ba2' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '올바른 HEX 색상 코드 형식이 아닙니다' })
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Accent 색상 (HEX 코드)', example: '#4facfe' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '올바른 HEX 색상 코드 형식이 아닙니다' })
  accentColor?: string;

  @ApiPropertyOptional({ description: '회사 소개 (마크다운 지원)' })
  @IsOptional()
  @IsString()
  aboutCompany?: string;

  @ApiPropertyOptional({ description: '팀 소개 (마크다운 지원)' })
  @IsOptional()
  @IsString()
  aboutTeam?: string;

  @ApiPropertyOptional({ description: '연락처 정보', type: ContactInfoDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;

  @ApiPropertyOptional({ description: '서비스 소개 (마크다운 지원)' })
  @IsOptional()
  @IsString()
  serviceInfo?: string;

  @ApiPropertyOptional({ description: '회사 통계 데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  companyStats?: any;

  @ApiPropertyOptional({ description: '팀원 데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  teamMembers?: any;

  @ApiPropertyOptional({ description: '서비스 기능 데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  serviceFeatures?: any;

  @ApiPropertyOptional({ description: '서비스 혜택 데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  serviceBenefits?: any;

  @ApiPropertyOptional({ description: '서비스 프로세스 데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  serviceProcess?: any;
}

