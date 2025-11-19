import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { UpdateSiteSettingsDto } from '../dto/update-site-settings.dto';
import { SettingsGateway } from '../gateway/settings.gateway';

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => SettingsGateway))
    private readonly settingsGateway?: SettingsGateway,
  ) {}

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
        company_values: true,
        teamMembers: true,
        team_culture: true,
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
  async updateSettings(
    userId: string,
    data: UpdateSiteSettingsDto,
    options?: { createVersion?: boolean; versionLabel?: string; versionDescription?: string },
  ) {
    const existing = await this.prisma.siteSettings.findFirst({
      where: { isActive: true },
    });

    // 버전 생성이 요청된 경우, 업데이트 전 스냅샷 저장
    if (options?.createVersion && existing) {
      await this.createVersion(
        existing.id,
        userId,
        options.versionLabel,
        options.versionDescription,
      );
    }

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
    if (data.homeContent !== undefined) {
      updateData.homeContent = data.homeContent as any;
    }
    if (data.aboutContent !== undefined) {
      updateData.aboutContent = data.aboutContent as any;
    }
    if (data.colorTheme !== undefined) {
      updateData.colorTheme = data.colorTheme as any;
    }

    let updatedSettings;
    if (existing) {
      updatedSettings = await this.prisma.siteSettings.update({
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
      updatedSettings = await this.prisma.siteSettings.create({
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

    // 실시간 설정 업데이트 브로드캐스트
    if (this.settingsGateway) {
      try {
        this.settingsGateway.broadcastSettingsUpdate(updatedSettings);
      } catch (error) {
        this.logger.warn('Failed to broadcast settings update:', error);
      }
    }

    return updatedSettings;
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

  /**
   * 버전 생성
   */
  async createVersion(
    settingsId: string,
    userId: string,
    label?: string,
    description?: string,
  ) {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: settingsId },
    });

    if (!settings) {
      throw new NotFoundException(`SiteSettings with ID ${settingsId} not found`);
    }

    // 현재 최대 버전 번호 조회
    const maxVersion = await this.prisma.siteSettingsVersion.findFirst({
      where: { settingsId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (maxVersion?.version || 0) + 1;

    // 전체 설정 스냅샷 생성
    const snapshot = {
      companyName: settings.companyName,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      colorScheme: settings.colorScheme,
      aboutCompany: settings.aboutCompany,
      aboutTeam: settings.aboutTeam,
      contactInfo: settings.contactInfo,
      serviceInfo: settings.serviceInfo,
      companyStats: settings.companyStats,
      companyValues: settings.company_values,
      teamMembers: settings.teamMembers,
      teamCulture: settings.team_culture,
      serviceFeatures: settings.serviceFeatures,
      serviceBenefits: settings.serviceBenefits,
      serviceProcess: settings.serviceProcess,
      homeContent: settings.homeContent,
      aboutContent: settings.aboutContent,
    };

    return await this.prisma.siteSettingsVersion.create({
      data: {
        settingsId,
        version: nextVersion,
        snapshot: snapshot as any,
        label: label || `Version ${nextVersion}`,
        description,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 버전 목록 조회
   */
  async getVersions(settingsId: string) {
    return await this.prisma.siteSettingsVersion.findMany({
      where: { settingsId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * 특정 버전으로 롤백
   */
  async rollbackToVersion(versionId: string, userId: string) {
    const version = await this.prisma.siteSettingsVersion.findUnique({
      where: { id: versionId },
      include: {
        settings: true,
      },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    const snapshot = version.snapshot as any;

    // 롤백 전 현재 버전 저장
    await this.createVersion(
      version.settingsId,
      userId,
      `Before rollback to v${version.version}`,
      `롤백 전 백업: v${version.version}로 롤백하기 전 상태`,
    );

    // 설정 복원
    return await this.prisma.siteSettings.update({
      where: { id: version.settingsId },
      data: {
        companyName: snapshot.companyName,
        logoUrl: snapshot.logoUrl,
        faviconUrl: snapshot.faviconUrl,
        primaryColor: snapshot.primaryColor,
        secondaryColor: snapshot.secondaryColor,
        accentColor: snapshot.accentColor,
        colorScheme: snapshot.colorScheme,
        aboutCompany: snapshot.aboutCompany,
        aboutTeam: snapshot.aboutTeam,
        contactInfo: snapshot.contactInfo,
        serviceInfo: snapshot.serviceInfo,
        companyStats: snapshot.companyStats,
        company_values: snapshot.companyValues,
        teamMembers: snapshot.teamMembers,
        team_culture: snapshot.teamCulture,
        serviceFeatures: snapshot.serviceFeatures,
        serviceBenefits: snapshot.serviceBenefits,
        serviceProcess: snapshot.serviceProcess,
        homeContent: snapshot.homeContent,
        aboutContent: snapshot.aboutContent,
        updatedBy: userId,
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

