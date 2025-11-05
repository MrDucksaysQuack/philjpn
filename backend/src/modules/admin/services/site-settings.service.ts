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

    // contactInfo를 JSON으로 변환
    const updateData: any = {
      ...data,
      updatedBy: userId,
    };

    if (data.contactInfo) {
      updateData.contactInfo = data.contactInfo as any;
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
      return await this.prisma.siteSettings.create({
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
    };
  }
}

