import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface FileUploadConfig {
  maxSize: number; // bytes
  allowedMimes: string[];
  subfolder?: string; // 'images' or 'audio'
}

export interface UploadedFileInfo {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  /**
   * 파일 업로드 설정 생성
   */
  createStorageConfig(config: FileUploadConfig) {
    const subfolder = config.subfolder || 'uploads';
    return diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), 'public', subfolder);
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        // 고유한 파일명 생성: timestamp-random.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    });
  }

  /**
   * 파일 필터 생성
   */
  createFileFilter(config: FileUploadConfig) {
    return (req: any, file: { fieldname: string; originalname: string; encoding: string; mimetype: string; size: number; destination: string; filename: string; path: string; buffer: Buffer }, cb: (error: Error | null, acceptFile: boolean) => void) => {
      // MIME 타입 검증
      if (!config.allowedMimes.includes(file.mimetype)) {
        const allowedTypes = config.allowedMimes.join(', ');
        cb(
          new BadRequestException(
            `허용되지 않은 파일 형식입니다. 허용 형식: ${allowedTypes}`,
          ),
          false,
        );
        return;
      }

      // 파일 크기 검증 (multer limits에서도 체크하지만 이중 검증)
      if (req.file && req.file.size > config.maxSize) {
        cb(
          new BadRequestException(
            `파일 크기가 너무 큽니다. 최대 크기: ${this.formatFileSize(config.maxSize)}`,
          ),
          false,
        );
        return;
      }

      cb(null, true);
    };
  }

  /**
   * 업로드된 파일 정보 처리 및 URL 생성
   */
  processUploadedFile(file: { fieldname: string; originalname: string; encoding: string; mimetype: string; size: number; destination: string; filename: string; path: string; buffer: Buffer }, subfolder: string = 'uploads'): UploadedFileInfo {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    // 파일 URL 생성
    const fileUrl = `/${subfolder}/${file.filename}`;
    
    // 프로덕션 환경에서는 실제 도메인 URL을 사용
    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // API_BASE_URL이 /api로 끝나면 제거 (파일 서빙은 /api가 아닌 루트 경로)
    const cleanBaseUrl = apiBaseUrl.replace(/\/api$/, '');
    const fullUrl = `${cleanBaseUrl}${fileUrl}`;

    return {
      url: fullUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * 파일 크기를 읽기 쉬운 형식으로 변환
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 이미지 파일 업로드 설정
   */
  getImageUploadConfig(): FileUploadConfig {
    return {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/x-icon',
        'image/vnd.microsoft.icon',
      ],
      subfolder: 'uploads/images',
    };
  }

  /**
   * 오디오 파일 업로드 설정
   */
  getAudioUploadConfig(): FileUploadConfig {
    return {
      maxSize: 10 * 1024 * 1024, // 10MB (오디오는 이미지보다 크기 제한을 더 크게)
      allowedMimes: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/aac',
        'audio/m4a',
      ],
      subfolder: 'uploads/audio',
    };
  }
}

