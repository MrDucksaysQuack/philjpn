import { ApiProperty } from '@nestjs/swagger';

export class LearningPatternsResponseDto {
  @ApiProperty({ description: '시간 패턴 분석' })
  timePatterns: {
    mostProductiveHours: number[];
    averageSessionDuration: number;
    preferredStudyDays: string[];
  };

  @ApiProperty({ description: '시간대별 성능', type: 'array' })
  performanceByTimeOfDay: Array<{
    hour: number;
    averageScore: number;
    examCount: number;
  }>;

  @ApiProperty({ description: '집중력 지속 시간 분석' })
  attentionSpan: {
    optimalSessionLength: number;
    focusDeclinePoint: number;
  };

  @ApiProperty({ description: '난이도 선호도' })
  difficultyPreference: {
    optimalDifficulty: string;
    challengeAcceptance: number;
  };
}

