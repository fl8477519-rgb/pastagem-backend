import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface Farm {
  id: string;
  name: string;
  ownerName?: string;
  updatedAt: Date;
}

@Injectable()
export class FarmsService {
  private farms: Farm[] = [];

  create(createFarmDto: { name: string; ownerName?: string }): Farm {
    const newFarm: Farm = {
      id: randomUUID(),
      name: createFarmDto.name,
      ownerName: createFarmDto.ownerName,
      updatedAt: new Date(),
    };
    this.farms.push(newFarm);
    return newFarm;
  }

  findAll(): Farm[] {
    return this.farms;
  }

  findOne(id: string): Farm {
    const farm = this.farms.find((f) => f.id === id);
    if (!farm) {
      throw new NotFoundException(`Fazenda com ID ${id} não encontrada.`);
    }
    return farm;
  }
}