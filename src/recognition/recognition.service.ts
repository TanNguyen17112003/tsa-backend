import { RecognitionQueryDto, RecognitionResponseDto } from './dtos';
import { RecognitionEntity } from './entities/recognition.entity';

export abstract class RecognitionService {
  abstract createRecognition(file: Express.Multer.File): Promise<RecognitionResponseDto>;

  abstract getRecognitions(query: RecognitionQueryDto): Promise<RecognitionEntity[]>;

  abstract getRecognition(id: string): Promise<RecognitionEntity>;
}
