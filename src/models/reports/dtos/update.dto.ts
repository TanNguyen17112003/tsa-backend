import { PartialType } from '@nestjs/swagger';
import { Report } from '@prisma/client';

import { CreateReport } from './create.dto';

export class UpdateReport extends PartialType(CreateReport) {
  id: Report['id'];
}
