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
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SocialMediaDto {
  @ApiPropertyOptional({ description: '웹사이트 URL' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.website !== undefined)
  @IsString()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Facebook URL' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.facebook !== undefined)
  @IsString()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({ description: 'Twitter URL' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.twitter !== undefined)
  @IsString()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({ description: 'Instagram URL' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.instagram !== undefined)
  @IsString()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional({ description: 'LinkedIn URL' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.linkedin !== undefined)
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
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.logoUrl !== undefined)
  @IsString()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ description: '파비콘 URL' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.faviconUrl !== undefined)
  @IsString()
  @IsUrl()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Primary 색상 (HEX 코드)', example: '#667eea' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.primaryColor !== undefined)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '올바른 HEX 색상 코드 형식이 아닙니다 (예: #667eea)' })
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary 색상 (HEX 코드)', example: '#764ba2' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.secondaryColor !== undefined)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '올바른 HEX 색상 코드 형식이 아닙니다' })
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Accent 색상 (HEX 코드)', example: '#4facfe' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.accentColor !== undefined)
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

  @ApiPropertyOptional({ description: '회사 가치 데이터 (JSON) - 미션/비전/가치' })
  @IsOptional()
  @IsObject()
  companyValues?: any;

  @ApiPropertyOptional({ description: '팀원 데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  teamMembers?: any;

  @ApiPropertyOptional({ description: '팀 문화 데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  teamCulture?: any;

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

  @ApiPropertyOptional({ 
    description: '메인 페이지 콘텐츠 (언어별 JSON) - { ko: { hero: { title, subtitle }, features: [...] }, en: {...}, ja: {...} }',
    example: {
      ko: {
        hero: { title: '온라인 시험 플랫폼', subtitle: '언제 어디서나 편리하게 시험을 응시하고 학습하세요' },
        features: [
          { title: '실시간 시험', description: '...' },
          { title: '상세 분석', description: '...' },
          { title: '학습 도구', description: '...' }
        ]
      },
      en: {
        hero: { title: 'Online Exam Platform', subtitle: 'Take exams and learn anytime, anywhere' },
        features: [
          { title: 'Real-time Exams', description: '...' },
          { title: 'Detailed Analysis', description: '...' },
          { title: 'Learning Tools', description: '...' }
        ]
      },
      ja: {
        hero: { title: 'オンライン試験プラットフォーム', subtitle: 'いつでもどこでも試験を受けて学習できます' },
        features: [
          { title: 'リアルタイム試験', description: '...' },
          { title: '詳細分析', description: '...' },
          { title: '学習ツール', description: '...' }
        ]
      }
    }
  })
  @IsOptional()
  @IsObject()
  homeContent?: any;

  @ApiPropertyOptional({ 
    description: 'About 페이지 콘텐츠 (언어별 JSON) - { ko: { team: { hero: {...} }, company: {...}, service: {...}, contact: {...} }, en: {...}, ja: {...} }',
    example: {
      ko: {
        team: { hero: { title: '우리 팀을 소개합니다', subtitle: '...' } },
        company: { hero: { subtitle: '...' } },
        service: { hero: { title: '...', subtitle: '...' } },
        contact: { hero: { title: '...', subtitle: '...' } }
      },
      en: {
        team: { hero: { title: 'Meet Our Team', subtitle: '...' } },
        company: { hero: { subtitle: '...' } },
        service: { hero: { title: '...', subtitle: '...' } },
        contact: { hero: { title: '...', subtitle: '...' } }
      },
      ja: {
        team: { hero: { title: 'チーム紹介', subtitle: '...' } },
        company: { hero: { subtitle: '...' } },
        service: { hero: { title: '...', subtitle: '...' } },
        contact: { hero: { title: '...', subtitle: '...' } }
      }
    }
  })
  @IsOptional()
  @IsObject()
  aboutContent?: any;
}

