import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Farm } from '@prisma/client';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFarmDto: { name: string; ownerName?: string }): Promise<Farm> {
    return this.prisma.farm.create({
      data: {
        name: createFarmDto.name,
        ownerName: createFarmDto.ownerName,
      },
    });
  }

  async findAll(): Promise<Farm[]> {
    return this.prisma.farm.findMany();
  }

  async findOne(id: string): Promise<Farm> {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
    });
    if (!farm) {
      throw new NotFoundException(`Fazenda com ID ${id} não encontrada.`);
    }
    return farm;
  }
}