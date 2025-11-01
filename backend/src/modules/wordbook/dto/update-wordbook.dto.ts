import { PartialType } from '@nestjs/swagger';
import { CreateWordBookDto } from './create-wordbook.dto';

export class UpdateWordBookDto extends PartialType(CreateWordBookDto) {}

