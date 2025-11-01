import { Module } from '@nestjs/common';
import { WordBookService } from './services/wordbook.service';
import { WordBookController } from './wordbook.controller';

@Module({
  controllers: [WordBookController],
  providers: [WordBookService],
  exports: [WordBookService],
})
export class WordBookModule {}

