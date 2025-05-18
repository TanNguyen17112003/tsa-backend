import { PrismaClient } from '@prisma/client';

export abstract class IdGeneratorService {
  abstract generateId(prefix: string, context?: string): string;
  abstract generateUniqueId<T extends keyof PrismaClient>(
    model: T,
    field: string,
    prefix: string,
    context?: string
  ): Promise<string>;
}
