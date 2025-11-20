import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { format } from 'winston';

export const loggerConfig: WinstonModuleOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: 'exam-platform' },
  transports: [
    // 콘솔 출력 (Railway 환경에서도 에러가 보이도록 개선)
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          ({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}]` : '';
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            const logMessage = `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
            
            // Railway 환경에서 error 레벨은 stderr로도 출력
            if (level.includes('error') || level.includes('ERROR')) {
              process.stderr.write(`[ERROR] ${logMessage}\n`);
            }
            
            return logMessage;
          },
        ),
      ),
    }),
    // 에러 로그 파일
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 전체 로그 파일
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // 예외 처리
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  // Promise rejection 처리
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
};

