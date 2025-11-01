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
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQueryDto } from './dto/exam-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../../common/types';

@ApiTags('Exams')
@Controller('api/exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  @ApiOperation({ summary: '시험 목록 조회' })
  @ApiResponse({ status: 200, description: '시험 목록 조회 성공' })
  findAll(@Query() query: ExamQueryDto) {
    return this.examService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '시험 상세 조회' })
  @ApiResponse({ status: 200, description: '시험 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.examService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '시험 생성 성공' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createExamDto: CreateExamDto, @CurrentUser() user: any) {
    return this.examService.create(createExamDto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 수정 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examService.update(id, updateExamDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시험 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '시험 삭제 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.examService.remove(id);
  }
}

