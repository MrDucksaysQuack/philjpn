import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { UpdateSiteSettingsDto } from '../dto/update-site-settings.dto';

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 공개 사이트 설정 조회 (인증 불필요)
   */
  async getPublicSettings() {
    const settings = await this.prisma.siteSettings.findFirst({
      where: { isActive: true },
      select: {
        companyName: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        colorScheme: true,
        aboutCompany: true,
        aboutTeam: true,
        contactInfo: true,
        serviceInfo: true,
        companyStats: true,
        company_values: true, // Prisma 스키마에서 snake_case로 정의됨
        teamMembers: true,
        team_culture: true, // Prisma 스키마에서 snake_case로 정의됨
        serviceFeatures: true,
        serviceBenefits: true,
        serviceProcess: true,
      },
    });

    return settings || this.getDefaultSettings();
  }

  /**
   * 관리자용 전체 설정 조회
   */
  async getAdminSettings() {
    const settings = await this.prisma.siteSettings.findFirst({
      where: { isActive: true },
      include: {
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!settings) {
      // 기본 설정 생성
      return await this.prisma.siteSettings.create({
        data: {
          companyName: 'Exam Platform',
        },
        include: {
          updater: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return settings;
  }

  /**
   * 설정 업데이트
   */
  async updateSettings(userId: string, data: UpdateSiteSettingsDto) {
    const existing = await this.prisma.siteSettings.findFirst({
      where: { isActive: true },
    });

    // Prisma 스키마에 맞는 필드만 포함
    const updateData: any = {
      updatedBy: userId,
    };

    // 기본 필드들
    if (data.companyName !== undefined) {
      updateData.companyName = data.companyName;
    }
    if (data.logoUrl !== undefined) {
      updateData.logoUrl = data.logoUrl;
    }
    if (data.faviconUrl !== undefined) {
      updateData.faviconUrl = data.faviconUrl;
    }
    if (data.primaryColor !== undefined) {
      updateData.primaryColor = data.primaryColor;
    }
    if (data.secondaryColor !== undefined) {
      updateData.secondaryColor = data.secondaryColor;
    }
    if (data.accentColor !== undefined) {
      updateData.accentColor = data.accentColor;
    }
    if (data.aboutCompany !== undefined) {
      updateData.aboutCompany = data.aboutCompany;
    }
    if (data.aboutTeam !== undefined) {
      updateData.aboutTeam = data.aboutTeam;
    }
    if (data.serviceInfo !== undefined) {
      updateData.serviceInfo = data.serviceInfo;
    }

    // JSON 필드들을 명시적으로 변환
    if (data.contactInfo !== undefined) {
      updateData.contactInfo = data.contactInfo as any;
    }
    if (data.companyStats !== undefined) {
      updateData.companyStats = data.companyStats as any;
    }
    if (data.companyValues !== undefined) {
      updateData.company_values = data.companyValues as any;
    }
    if (data.teamMembers !== undefined) {
      updateData.teamMembers = data.teamMembers as any;
    }
    if (data.teamCulture !== undefined) {
      updateData.team_culture = data.teamCulture as any;
    }
    if (data.serviceFeatures !== undefined) {
      updateData.serviceFeatures = data.serviceFeatures as any;
    }
    if (data.serviceBenefits !== undefined) {
      updateData.serviceBenefits = data.serviceBenefits as any;
    }
    if (data.serviceProcess !== undefined) {
      updateData.serviceProcess = data.serviceProcess as any;
    }

    if (existing) {
      return await this.prisma.siteSettings.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          updater: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      // 새로 생성할 때는 기본값 설정
      return await this.prisma.siteSettings.create({
        data: {
          ...updateData,
          companyName: updateData.companyName || 'Exam Platform',
          isActive: true,
        },
        include: {
          updater: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }
  }

  /**
   * 기본 설정 반환
   */
  private getDefaultSettings() {
    return {
      companyName: 'Exam Platform',
      logoUrl: null,
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      accentColor: '#4facfe',
      colorScheme: null,
      aboutCompany: null,
      aboutTeam: null,
      contactInfo: null,
      serviceInfo: null,
      companyStats: null,
      company_values: null,
      teamMembers: null,
      team_culture: null,
      serviceFeatures: null,
      serviceBenefits: null,
      serviceProcess: null,
    };
  }
}

