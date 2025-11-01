import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/types';

@ApiTags('Questions')
@Controller('api')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get('sections/:sectionId/questions')
  @ApiOperation({ summary: '섹션의 문제 목록 조회' })
  @ApiResponse({ status: 200, description: '문제 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '섹션을 찾을 수 없음' })
  findAllBySectionId(@Param('sectionId') sectionId: string) {
    return this.questionService.findAllBySectionId(sectionId);
  }

  @Get('questions/:id')
  @ApiOperation({ summary: '문제 상세 조회 (응시 중에는 정답/해설 제외)' })
  @ApiResponse({ status: 200, description: '문제 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '문제를 찾을 수 없음' })
  findOne(@Param('id') id: string, @Query() query: QuestionQueryDto) {
    return this.questionService.findOne(id, query);
  }

  @Post('sections/:sectionId/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문제 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '문제 생성 성공' })
  @ApiResponse({ status: 404, description: '섹션을 찾을 수 없음' })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('sectionId') sectionId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionService.create(sectionId, createQuestionDto);
  }

  @Patch('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문제 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 수정 성공' })
  @ApiResponse({ status: 404, description: '문제를 찾을 수 없음' })
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionService.update(id, updateQuestionDto);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문제 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '문제 삭제 성공' })
  @ApiResponse({ status: 404, description: '문제를 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.questionService.remove(id);
  }
}

