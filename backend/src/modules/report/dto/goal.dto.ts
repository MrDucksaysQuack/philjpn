import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({ enum: ['score_target', 'weakness_recovery', 'exam_count', 'word_count'] })
  @IsString()
  goalType: string;

  @ApiProperty()
  @IsInt()
  targetValue: number;

  @ApiProperty()
  @IsDateString()
  deadline: string;

  @ApiProperty({ required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  milestones?: Array<{ date: string; target: number }>;
}

export class GoalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  goalType: string;

  @ApiProperty()
  targetValue: number;

  @ApiProperty()
  currentValue: number;

  @ApiProperty()
  deadline: Date;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  milestones?: any;
}

export class GoalProgressDto {
  @ApiProperty()
  goalId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  target: number;

  @ApiProperty()
  current: number;

  @ApiProperty()
  progress: number;

  @ApiProperty({ required: false })
  estimatedCompletion?: string;

  @ApiProperty()
  onTrack: boolean;

  @ApiProperty({ type: 'array' })
  dailyProgress: Array<{ date: string; value: number }>;
}

