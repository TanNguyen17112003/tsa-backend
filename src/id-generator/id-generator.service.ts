import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma';

@Injectable()
export class IdGeneratorService {
  private static readonly ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  constructor(private readonly prisma: PrismaService) {}

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

  private generateRandomPart(length = 10): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += IdGeneratorService.ALPHANUM.charAt(
        Math.floor(Math.random() * IdGeneratorService.ALPHANUM.length)
      );
    }
    return result;
  }

  generateId(prefix: string, context?: string): string {
    const parts = [prefix.toUpperCase()];
    if (context) {
      parts.push(context.toUpperCase());
    }
    parts.push(this.generateRandomPart());
    return parts.join('-');
  }

  async generateUniqueId<T extends keyof typeof this.prisma>(
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
}
