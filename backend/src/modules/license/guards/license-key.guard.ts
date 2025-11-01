import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { LicenseKeyService } from '../services/license-key.service';
import { LogStatus } from '../../../common/types';

@Injectable()
export class LicenseKeyGuard implements CanActivate {
  constructor(private licenseKeyService: LicenseKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.body?.licenseKey || request.headers['x-api-key'];

    if (!key) {
      throw new BadRequestException('라이선스 키가 필요합니다.');
    }

    // 키 검증
    const examId = request.params?.examId || request.body?.examId;
    const validation = await this.licenseKeyService.validate(key, {
      examId,
    });

    if (!validation.canUse) {
      // 사용 로그 기록 (실패)
      const licenseKey = await this.licenseKeyService.findByKey(key);
      if (licenseKey) {
        await this.licenseKeyService.logUsage(
          licenseKey.id,
          'exam_start',
          LogStatus.REJECTED,
          request.user?.id,
          examId,
          undefined,
          request.ip,
          request.headers['user-agent'],
        );
      }

      throw new UnauthorizedException(
        validation.reason || '유효하지 않은 라이선스 키입니다.',
      );
    }

    // 키 정보를 request에 추가
    const licenseKey = await this.licenseKeyService.findByKey(key);
    if (licenseKey) {
      request.licenseKey = licenseKey;

      // 사용 로그 기록 (성공)
      await this.licenseKeyService.logUsage(
        licenseKey.id,
        'exam_start',
        LogStatus.SUCCESS,
        request.user?.id,
        examId,
        undefined,
        request.ip,
        request.headers['user-agent'],
      );
    }

    return true;
  }
}

