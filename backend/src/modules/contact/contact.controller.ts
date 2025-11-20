import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { SubmitContactDto } from './dto/submit-contact.dto';

@ApiTags('Contact')
@Controller('api/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('submit')
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 1분에 3회 제한 (스팸 방지)
  @ApiOperation({ summary: '연락처 폼 제출' })
  @ApiResponse({ status: 201, description: '문의 접수 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 429, description: '요청 한도 초과' })
  @HttpCode(HttpStatus.CREATED)
  async submitContact(@Body() dto: SubmitContactDto) {
    try {
      return await this.contactService.submitContact(dto);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      const context = '[submitContact]';
      
      // Winston + console + stderr 병행 (Railway 환경 대응)
      console.error(`${context}`, {
        code: errorCode,
        msg: errorMessage,
        stack: errorStack,
        time: new Date().toISOString(),
      });
      // Railway가 인식할 수 있도록 stderr에 직접 출력
      process.stderr.write(
        `[ERROR] ${context} ${errorMessage}\n` +
        `Code: ${errorCode || 'N/A'}\n` +
        `Time: ${new Date().toISOString()}\n` +
        `Stack: ${errorStack || 'N/A'}\n\n`,
      );
      
      throw error;
    }
  }
}

