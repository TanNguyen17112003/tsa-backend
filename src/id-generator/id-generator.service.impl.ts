import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma';

import { IdGeneratorService } from './id-generator.service';

@Injectable()
export class IdGeneratorServiceImpl extends IdGeneratorService {
  private static readonly ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // async onModuleInit() {
  //   const deliveries = await this.prisma.delivery.findMany();
  //   deliveries.forEach(async (delivery) => {
  //     if (delivery.displayId === null) {
  //       const displayId = await this.generateUniqueId('delivery', 'displayId', 'DEL');
  //       await this.prisma.delivery.update({
  //         where: { id: delivery.id },
  //         data: { displayId: displayId },
  //       });
  //     }
  //   });
  // }

  override generateId(prefix: string, context?: string): string {
    const parts = [prefix.toUpperCase()];
    if (context) {
      parts.push(context.toUpperCase());
    }
    parts.push(this.generateRandomPart());
    return parts.join('-');
  }

  override async generateUniqueId<T extends keyof PrismaService>(
    model: T,
    field: string,
    prefix: string,
    context?: string
  ): Promise<string> {
    let retries = 5;
    while (retries-- > 0) {
      const id = this.generateId(prefix, context);
      const exists = await (this.prisma[model] as any).findFirst({
        where: { [field]: id },
      });
      if (!exists) {
        return id;
      }
    }
    throw new InternalServerErrorException('Failed to generate unique ID after multiple attempts');
  }

  private generateRandomPart(length = 10): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += IdGeneratorServiceImpl.ALPHANUM.charAt(
        Math.floor(Math.random() * IdGeneratorServiceImpl.ALPHANUM.length)
      );
    }
    return result;
  }
}
