import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ResourcesService } from './resources.service.js';

describe('ResourcesService', () => {
  it.each(['toString', 'constructor', '__proto__'])(
    'rejects inherited property "%s" as an unknown resource',
    async (resourceName) => {
      const service = new ResourcesService({} as PrismaService);

      await expect(
        Promise.resolve().then(() => service.list(resourceName)),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
});
