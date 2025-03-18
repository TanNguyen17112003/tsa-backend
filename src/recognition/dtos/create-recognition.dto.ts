import { ApiProperty } from '@nestjs/swagger';

export class CreateRecognitionDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  readonly image: Express.Multer.File;
}
