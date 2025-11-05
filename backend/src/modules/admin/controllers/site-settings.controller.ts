import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SiteSettingsService } from '../services/site-settings.service';

@ApiTags('Site Settings')
@Controller('api/site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: '사이트 설정 조회 (공개)' })
  @ApiResponse({ status: 200, description: '사이트 설정 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async getPublicSettings() {
    return {
      data: await this.siteSettingsService.getPublicSettings(),
    };
  }

  @Get('about')
  @ApiOperation({ summary: 'About Us 섹션별 정보 조회 (공개)' })
  @ApiResponse({ status: 200, description: '섹션 정보 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async getAboutSection(@Query('section') section: string) {
    const settings = await this.siteSettingsService.getPublicSettings();

    const sectionMap: Record<string, any> = {
      company: {
        title: '회사 소개',
        content: settings.aboutCompany,
      },
      team: {
        title: '팀 소개',
        content: settings.aboutTeam,
      },
      contact: {
        title: '연락처',
        content: settings.contactInfo,
      },
      service: {
        title: '서비스 소개',
        content: settings.serviceInfo,
      },
    };

    if (!section || !sectionMap[section]) {
      return {
        data: {
          sections: Object.keys(sectionMap).map((key) => ({
            key,
            title: sectionMap[key].title,
          })),
        },
      };
    }

    return {
      data: sectionMap[section],
    };
  }
}

