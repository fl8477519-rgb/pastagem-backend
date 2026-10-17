import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Paddock } from '@prisma/client';

@Injectable()
export class PaddocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaddockDto: { farmId: string; name: string; areaHectares: number }): Promise<Paddock> {
    // Verifica se a fazenda associada existe antes de criar o talhão
    const farm = await this.prisma.farm.findUnique({
      where: { id: createPaddockDto.farmId },
    });
    if (!farm) {
      throw new NotFoundException(`Fazenda com ID ${createPaddockDto.farmId} não encontrada.`);
    }

    return this.prisma.paddock.create({
      data: {
        farmId: createPaddockDto.farmId,
        name: createPaddockDto.name,
        areaHectares: createPaddockDto.areaHectares,
      },
    });
  }

  async findAll(): Promise<Paddock[]> {
    return this.prisma.paddock.findMany();
  }

  async findByFarm(farmId: string): Promise<Paddock[]> {
    return this.prisma.paddock.findMany({
      where: { farmId },
    });
  }
}