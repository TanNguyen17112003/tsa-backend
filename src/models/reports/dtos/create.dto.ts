import { OmitType } from '@nestjs/swagger';

import { ReportEntity } from '../entity/report.entity';

export class CreateReport extends OmitType(ReportEntity, ['id']) {}
