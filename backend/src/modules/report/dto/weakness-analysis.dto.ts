import { ApiProperty } from '@nestjs/swagger';

export class WeaknessAreaDto {
  @ApiProperty()
  tag: string;

  @ApiProperty()
  correctRate: number;

  @ApiProperty()
  rootCause: string;

  @ApiProperty()
  mistakePattern: {
    commonErrors: string[];
    frequency: number;
    lastAttempt: string;
  };

  @ApiProperty()
  relatedConcepts: string[];

  @ApiProperty()
  improvementSuggestions: string[];

  @ApiProperty()
  predictedImprovementTime: string;
}

export class KnowledgeGapDto {
  @ApiProperty()
  concept: string;

  @ApiProperty()
  understandingLevel: number;

  @ApiProperty()
  practiceNeeded: number;
}

export class WeaknessAnalysisResponseDto {
  @ApiProperty({ type: [WeaknessAreaDto] })
  weaknessAreas: WeaknessAreaDto[];

  @ApiProperty({ type: [KnowledgeGapDto] })
  knowledgeGaps: KnowledgeGapDto[];
}

