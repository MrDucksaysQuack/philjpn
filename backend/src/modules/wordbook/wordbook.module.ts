import { Module } from '@nestjs/common';
import { WordBookService } from './services/wordbook.service';
import { WordBookController } from './wordbook.controller';
import { WordExtractionService } from './services/word-extraction.service';

@Module({
  controllers: [WordBookController],
  providers: [WordBookService, WordExtractionService],
  exports: [WordBookService, WordExtractionService],
})
export class WordBookModule {}

