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
    } catch (error: any) {
      console.error('❌ submitContact 컨트롤러 에러:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        name: error?.name,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

