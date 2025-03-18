import { Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Auth } from 'src/auth';

import { CreateRecognitionDto, RecognitionQueryDto, RecognitionResponseDto } from './dtos';
import { RecognitionEntity } from './entities/recognition.entity';
import { RecognitionService } from './recognition.service';

@Controller('api/recognition')
@ApiTags('Recognition')
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: diskStorage({}) }))
  @Auth('ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file to recognize',
    type: CreateRecognitionDto,
  })
  @ApiCreatedResponse({ type: RecognitionEntity })
  create(@UploadedFile() file: Express.Multer.File): Promise<RecognitionResponseDto> {
    return this.recognitionService.createRecognition(file);
  }

  @Get()
  @Auth('ADMIN')
  @ApiOkResponse({ type: [RecognitionEntity] })
  findAll(@Query() query: RecognitionQueryDto) {
    return this.recognitionService.getRecognitions(query);
  }

  @Get(':id')
  @Auth('ADMIN')
  @ApiOkResponse({ type: RecognitionEntity })
  findOne(@Param('id') id: string) {
    return this.recognitionService.getRecognition(id);
  }
}
