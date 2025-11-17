import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AIAnalysisService } from './services/ai-analysis.service';
import { GenerateExplanationDto } from './dto/generate-explanation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/types';

@ApiTags('AI Analysis')
@Controller('api/ai')
export class AIController {
  constructor(private readonly aiAnalysisService: AIAnalysisService) {}

  @Post('explanation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문제별 맞춤형 해설 생성' })
  @ApiResponse({ status: 200, description: '해설 생성 성공' })
  @ApiResponse({ status: 400, description: 'AI 기능 비활성화 또는 잘못된 요청' })
  @ApiResponse({ status: 404, description: '문제를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  async generateExplanation(@Body() dto: GenerateExplanationDto) {
    const explanation = await this.aiAnalysisService.generateExplanation(
      dto.questionId,
      dto.userAnswer,
      dto.isCorrect,
    );

    return {
      explanation,
      questionId: dto.questionId,
      generatedAt: new Date(),
    };
  }

  @Post('check-availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI 기능 사용 가능 여부 확인 (Admin Only)' })
  @ApiResponse({ status: 200, description: '확인 성공' })
  async checkAvailability() {
    const isAvailable = this.aiAnalysisService.isAvailable();
    return {
      available: isAvailable,
      message: isAvailable
        ? 'AI 분석 기능이 활성화되어 있습니다.'
        : 'AI 분석 기능이 비활성화되어 있습니다. OPENAI_API_KEY를 설정해주세요.',
    };
  }
}

