import { Module } from '@nestjs/common';
import { WordBookService } from './services/wordbook.service';
import { WordBookController } from './wordbook.controller';
import { WordExtractionService } from './services/word-extraction.service';
import { SRSEnhancedService } from './services/srs-enhanced.service';

@Module({
  controllers: [WordBookController],
  providers: [WordBookService, WordExtractionService, SRSEnhancedService],
  exports: [WordBookService, WordExtractionService, SRSEnhancedService],
})
export class WordBookModule {}

