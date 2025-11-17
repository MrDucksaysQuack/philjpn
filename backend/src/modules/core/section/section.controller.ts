import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SectionService } from './section.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/types';

@ApiTags('Sections')
@Controller('api/sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Get('exams/:examId')
  @ApiOperation({ summary: '시험의 섹션 목록 조회' })
  @ApiResponse({ status: 200, description: '섹션 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  findAllByExamId(@Param('examId') examId: string) {
    return this.sectionService.findAllByExamId(examId);
  }

  @Get(':id')
  @ApiOperation({ summary: '섹션 상세 조회' })
  @ApiResponse({ status: 200, description: '섹션 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '섹션을 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.sectionService.findOne(id);
  }

  @Post('exams/:examId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '섹션 생성 (Admin Only)' })
  @ApiResponse({ status: 201, description: '섹션 생성 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @HttpCode(HttpStatus.CREATED)
  create(@Param('examId') examId: string, @Body() createSectionDto: CreateSectionDto) {
    return this.sectionService.create(examId, createSectionDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '섹션 수정 (Admin Only)' })
  @ApiResponse({ status: 200, description: '섹션 수정 성공' })
  @ApiResponse({ status: 404, description: '섹션을 찾을 수 없음' })
  update(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
    return this.sectionService.update(id, updateSectionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '섹션 삭제 (Admin Only)' })
  @ApiResponse({ status: 200, description: '섹션 삭제 성공' })
  @ApiResponse({ status: 404, description: '섹션을 찾을 수 없음' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.sectionService.remove(id);
  }
}

