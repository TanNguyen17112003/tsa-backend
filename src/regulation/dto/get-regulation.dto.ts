import { CreateRegulationDto } from './create-regulation.dto';

export class GetRegulationDto extends CreateRegulationDto {
  id: string;
  updateAt: Date;
}
