import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type ResourceOperations = {
  findAll: () => Promise<unknown[]>;
  findOne: (id: string) => Promise<unknown>;
  create: (body: unknown) => Promise<unknown>;
  update: (id: string, body: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<unknown>;
};

type Resource = ResourceOperations & { name: string };

function bodyRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException(
      'O corpo da requisição deve ser um objeto JSON.',
    );
  }
  return body as Record<string, unknown>;
}

function requiredString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(
      `O campo "${field}" é obrigatório e deve ser texto.`,
    );
  }
  return value.trim();
}

function optionalString(
  body: Record<string, unknown>,
  field: string,
  fallback = '',
): string {
  const value = body[field];
  if (value === undefined) return fallback;
  if (typeof value !== 'string') {
    throw new BadRequestException(`O campo "${field}" deve ser texto.`);
  }
  return value.trim();
}

function requiredNumber(body: Record<string, unknown>, field: string): number {
  const value = body[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new BadRequestException(
      `O campo "${field}" deve ser um número maior ou igual a zero.`,
    );
  }
  return value;
}

function requiredInteger(body: Record<string, unknown>, field: string): number {
  const value = requiredNumber(body, field);
  if (!Number.isInteger(value)) {
    throw new BadRequestException(
      `O campo "${field}" deve ser um número inteiro.`,
    );
  }
  return value;
}

function requiredId(body: Record<string, unknown>, field: string): number {
  const value = requiredInteger(body, field);
  if (value < 1)
    throw new BadRequestException(
      `O campo "${field}" deve ser maior que zero.`,
    );
  return value;
}

function requiredDate(body: Record<string, unknown>, field: string): Date {
  const value = body[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(
      `O campo "${field}" é obrigatório e deve ser uma data válida.`,
    );
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(
      `O campo "${field}" deve ser uma data válida.`,
    );
  }
  return date;
}

function optionalDate(
  body: Record<string, unknown>,
  field: string,
): Date | undefined {
  if (body[field] === undefined || body[field] === null || body[field] === '')
    return undefined;
  return requiredDate(body, field);
}

function requiredChoice(
  body: Record<string, unknown>,
  field: string,
  choices: string[],
): string {
  const value = requiredString(body, field);
  if (!choices.includes(value)) {
    throw new BadRequestException(
      `O campo "${field}" deve ser um destes valores: ${choices.join(', ')}.`,
    );
  }
  return value;
}

function optionalBoolean(
  body: Record<string, unknown>,
  field: string,
  fallback = false,
): boolean {
  const value = body[field];
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    throw new BadRequestException(
      `O campo "${field}" deve ser verdadeiro ou falso.`,
    );
  }
  return value;
}

function farmId(body: Record<string, unknown>, field: string): string {
  return requiredString(body, field);
}

function relatedFarmIds(body: Record<string, unknown>): string[] {
  const value = body.farmIds;
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    !value.every((id) => typeof id === 'string' && id.trim())
  ) {
    throw new BadRequestException(
      'O campo "farmIds" deve ser uma lista de IDs de propriedades.',
    );
  }
  return value.map((id) => id.trim());
}

function parseIntId(id: string, resource: string): number {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException(`ID inválido para ${resource}.`);
  }
  return parsed;
}

function createResource(
  name: string,
  operations: ResourceOperations,
): Resource {
  return { name, ...operations };
}

@Injectable()
export class ResourcesService {
  private readonly resources: Record<string, Resource>;

  constructor(private readonly prisma: PrismaService) {
    this.resources = {
      users: createResource('usuário', {
        findAll: () =>
          prisma.user.findMany({
            include: { farms: { select: { id: true, name: true } } },
          }),
        findOne: (id) =>
          prisma.user.findUnique({
            where: { id: parseIntId(id, 'usuário') },
            include: { farms: { select: { id: true, name: true } } },
          }),
        create: (body) => {
          const data = bodyRecord(body);
          const farms = relatedFarmIds(data);
          return prisma.user.create({
            data: {
              name: requiredString(data, 'name'),
              phone: requiredString(data, 'phone'),
              profile: requiredChoice(data, 'profile', [
                'pecuarista',
                'manejador',
              ]),
              alertChannel: requiredChoice(data, 'alertChannel', [
                'whatsapp',
                'app',
              ]),
              farms: { connect: farms.map((id) => ({ id })) },
            },
            include: { farms: { select: { id: true, name: true } } },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          const farms = relatedFarmIds(data);
          return prisma.user.update({
            where: { id: parseIntId(id, 'usuário') },
            data: {
              name: requiredString(data, 'name'),
              phone: requiredString(data, 'phone'),
              profile: requiredChoice(data, 'profile', [
                'pecuarista',
                'manejador',
              ]),
              alertChannel: requiredChoice(data, 'alertChannel', [
                'whatsapp',
                'app',
              ]),
              farms: { set: farms.map((farmId) => ({ id: farmId })) },
            },
            include: { farms: { select: { id: true, name: true } } },
          });
        },
        delete: (id) =>
          prisma.user.delete({ where: { id: parseIntId(id, 'usuário') } }),
      }),
      farms: createResource('propriedade', {
        findAll: () => prisma.farm.findMany(),
        findOne: (id) => prisma.farm.findUnique({ where: { id } }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.farm.create({
            data: {
              name: requiredString(data, 'name'),
              ownerName: optionalString(data, 'ownerName'),
              municipalityUf: optionalString(data, 'municipalityUf'),
              totalAreaHa:
                data.totalAreaHa === undefined
                  ? 0
                  : requiredNumber(data, 'totalAreaHa'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.farm.update({
            where: { id },
            data: {
              name: requiredString(data, 'name'),
              ownerName: optionalString(data, 'ownerName'),
              municipalityUf: optionalString(data, 'municipalityUf'),
              totalAreaHa: requiredNumber(data, 'totalAreaHa'),
            },
          });
        },
        delete: (id) => prisma.farm.delete({ where: { id } }),
      }),
      paddocks: createResource('piquete', {
        findAll: () => prisma.paddock.findMany(),
        findOne: (id) => prisma.paddock.findUnique({ where: { id } }),
        create: (body) => {
          const data = bodyRecord(body);
          const cultivarId =
            data.cultivarId === undefined || data.cultivarId === ''
              ? undefined
              : requiredId(data, 'cultivarId');
          return prisma.paddock.create({
            data: {
              farmId: farmId(data, 'farmId'),
              name: requiredString(data, 'name'),
              areaHectares: requiredNumber(data, 'areaHectares'),
              status:
                data.status === undefined
                  ? 'livre'
                  : requiredChoice(data, 'status', [
                      'livre',
                      'ocupado',
                      'manutencao',
                    ]),
              coordinates: optionalString(data, 'coordinates'),
              cultivarId,
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          const cultivarId =
            data.cultivarId === undefined || data.cultivarId === ''
              ? null
              : requiredId(data, 'cultivarId');
          return prisma.paddock.update({
            where: { id },
            data: {
              farmId: farmId(data, 'farmId'),
              name: requiredString(data, 'name'),
              areaHectares: requiredNumber(data, 'areaHectares'),
              status: requiredChoice(data, 'status', [
                'livre',
                'ocupado',
                'manutencao',
              ]),
              coordinates: optionalString(data, 'coordinates'),
              cultivarId,
            },
          });
        },
        delete: (id) => prisma.paddock.delete({ where: { id } }),
      }),
      lots: createResource('lote', {
        findAll: () => prisma.lot.findMany(),
        findOne: (id) =>
          prisma.lot.findUnique({ where: { id: parseIntId(id, 'lote') } }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.lot.create({
            data: {
              name: requiredString(data, 'name'),
              category: requiredString(data, 'category'),
              headCount: requiredInteger(data, 'headCount'),
              farmId: farmId(data, 'farmId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.lot.update({
            where: { id: parseIntId(id, 'lote') },
            data: {
              name: requiredString(data, 'name'),
              category: requiredString(data, 'category'),
              headCount: requiredInteger(data, 'headCount'),
              farmId: farmId(data, 'farmId'),
            },
          });
        },
        delete: (id) =>
          prisma.lot.delete({ where: { id: parseIntId(id, 'lote') } }),
      }),
      cultivars: createResource('cultivar', {
        findAll: () => prisma.cultivar.findMany(),
        findOne: (id) =>
          prisma.cultivar.findUnique({
            where: { id: parseIntId(id, 'cultivar') },
          }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.cultivar.create({
            data: {
              name: requiredString(data, 'name'),
              type: requiredChoice(data, 'type', ['graminea', 'leguminosa']),
              entryHeightCm: requiredNumber(data, 'entryHeightCm'),
              exitHeightCm: requiredNumber(data, 'exitHeightCm'),
              restDays: requiredInteger(data, 'restDays'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.cultivar.update({
            where: { id: parseIntId(id, 'cultivar') },
            data: {
              name: requiredString(data, 'name'),
              type: requiredChoice(data, 'type', ['graminea', 'leguminosa']),
              entryHeightCm: requiredNumber(data, 'entryHeightCm'),
              exitHeightCm: requiredNumber(data, 'exitHeightCm'),
              restDays: requiredInteger(data, 'restDays'),
            },
          });
        },
        delete: (id) =>
          prisma.cultivar.delete({ where: { id: parseIntId(id, 'cultivar') } }),
      }),
      animals: createResource('animal', {
        findAll: () => prisma.animal.findMany(),
        findOne: (id) =>
          prisma.animal.findUnique({ where: { id: parseIntId(id, 'animal') } }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.animal.create({
            data: {
              tag: requiredString(data, 'tag'),
              sex: requiredString(data, 'sex'),
              breed: requiredString(data, 'breed'),
              birthDate: requiredDate(data, 'birthDate'),
              lotId: requiredId(data, 'lotId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.animal.update({
            where: { id: parseIntId(id, 'animal') },
            data: {
              tag: requiredString(data, 'tag'),
              sex: requiredString(data, 'sex'),
              breed: requiredString(data, 'breed'),
              birthDate: requiredDate(data, 'birthDate'),
              lotId: requiredId(data, 'lotId'),
            },
          });
        },
        delete: (id) =>
          prisma.animal.delete({ where: { id: parseIntId(id, 'animal') } }),
      }),
      weighings: createResource('pesagem', {
        findAll: () => prisma.weighing.findMany(),
        findOne: (id) =>
          prisma.weighing.findUnique({
            where: { id: parseIntId(id, 'pesagem') },
          }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.weighing.create({
            data: {
              date: requiredDate(data, 'date'),
              weightKg: requiredNumber(data, 'weightKg'),
              animalId: requiredId(data, 'animalId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.weighing.update({
            where: { id: parseIntId(id, 'pesagem') },
            data: {
              date: requiredDate(data, 'date'),
              weightKg: requiredNumber(data, 'weightKg'),
              animalId: requiredId(data, 'animalId'),
            },
          });
        },
        delete: (id) =>
          prisma.weighing.delete({ where: { id: parseIntId(id, 'pesagem') } }),
      }),
      'zootechnical-events': createResource('evento zootécnico', {
        findAll: () => prisma.zootechnicalEvent.findMany(),
        findOne: (id) =>
          prisma.zootechnicalEvent.findUnique({
            where: { id: parseIntId(id, 'evento') },
          }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.zootechnicalEvent.create({
            data: {
              type: requiredChoice(data, 'type', ['reprodutivo', 'sanitario']),
              date: requiredDate(data, 'date'),
              description: requiredString(data, 'description'),
              animalId: requiredId(data, 'animalId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.zootechnicalEvent.update({
            where: { id: parseIntId(id, 'evento') },
            data: {
              type: requiredChoice(data, 'type', ['reprodutivo', 'sanitario']),
              date: requiredDate(data, 'date'),
              description: requiredString(data, 'description'),
              animalId: requiredId(data, 'animalId'),
            },
          });
        },
        delete: (id) =>
          prisma.zootechnicalEvent.delete({
            where: { id: parseIntId(id, 'evento') },
          }),
      }),
      occupations: createResource('ocupação', {
        findAll: () => prisma.occupation.findMany(),
        findOne: (id) =>
          prisma.occupation.findUnique({
            where: { id: parseIntId(id, 'ocupação') },
          }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.occupation.create({
            data: {
              entry: requiredDate(data, 'entry'),
              exit: optionalDate(data, 'exit'),
              entryHeightCm: requiredNumber(data, 'entryHeightCm'),
              exitHeightCm:
                data.exitHeightCm === undefined ||
                data.exitHeightCm === null ||
                data.exitHeightCm === ''
                  ? null
                  : requiredNumber(data, 'exitHeightCm'),
              paddockId: farmId(data, 'paddockId'),
              lotId: requiredId(data, 'lotId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.occupation.update({
            where: { id: parseIntId(id, 'ocupação') },
            data: {
              entry: requiredDate(data, 'entry'),
              exit: optionalDate(data, 'exit') ?? null,
              entryHeightCm: requiredNumber(data, 'entryHeightCm'),
              exitHeightCm:
                data.exitHeightCm === undefined ||
                data.exitHeightCm === null ||
                data.exitHeightCm === ''
                  ? null
                  : requiredNumber(data, 'exitHeightCm'),
              paddockId: farmId(data, 'paddockId'),
              lotId: requiredId(data, 'lotId'),
            },
          });
        },
        delete: (id) =>
          prisma.occupation.delete({
            where: { id: parseIntId(id, 'ocupação') },
          }),
      }),
      'pasture-measurements': createResource('medição de pasto', {
        findAll: () => prisma.pastureMeasurement.findMany(),
        findOne: (id) =>
          prisma.pastureMeasurement.findUnique({
            where: { id: parseIntId(id, 'medição') },
          }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.pastureMeasurement.create({
            data: {
              date: requiredDate(data, 'date'),
              averageHeightCm: requiredNumber(data, 'averageHeightCm'),
              biomassKgDmHa: requiredNumber(data, 'biomassKgDmHa'),
              origin: requiredChoice(data, 'origin', ['manual', 'satelite']),
              paddockId: farmId(data, 'paddockId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.pastureMeasurement.update({
            where: { id: parseIntId(id, 'medição') },
            data: {
              date: requiredDate(data, 'date'),
              averageHeightCm: requiredNumber(data, 'averageHeightCm'),
              biomassKgDmHa: requiredNumber(data, 'biomassKgDmHa'),
              origin: requiredChoice(data, 'origin', ['manual', 'satelite']),
              paddockId: farmId(data, 'paddockId'),
            },
          });
        },
        delete: (id) =>
          prisma.pastureMeasurement.delete({
            where: { id: parseIntId(id, 'medição') },
          }),
      }),
      'stocking-calculations': createResource('cálculo de lotação', {
        findAll: () => prisma.stockingCalculation.findMany(),
        findOne: (id) =>
          prisma.stockingCalculation.findUnique({
            where: { id: parseIntId(id, 'cálculo') },
          }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.stockingCalculation.create({
            data: {
              date: requiredDate(data, 'date'),
              capacityUaHa: requiredNumber(data, 'capacityUaHa'),
              suggestedAnimals: requiredInteger(data, 'suggestedAnimals'),
              confirmed: optionalBoolean(data, 'confirmed'),
              paddockId: farmId(data, 'paddockId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.stockingCalculation.update({
            where: { id: parseIntId(id, 'cálculo') },
            data: {
              date: requiredDate(data, 'date'),
              capacityUaHa: requiredNumber(data, 'capacityUaHa'),
              suggestedAnimals: requiredInteger(data, 'suggestedAnimals'),
              confirmed: optionalBoolean(data, 'confirmed'),
              paddockId: farmId(data, 'paddockId'),
            },
          });
        },
        delete: (id) =>
          prisma.stockingCalculation.delete({
            where: { id: parseIntId(id, 'cálculo') },
          }),
      }),
      inputs: createResource('insumo', {
        findAll: () => prisma.input.findMany(),
        findOne: (id) =>
          prisma.input.findUnique({ where: { id: parseIntId(id, 'insumo') } }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.input.create({
            data: {
              name: requiredString(data, 'name'),
              type: requiredChoice(data, 'type', [
                'adubo',
                'defensivo',
                'sanitario',
              ]),
              withholdingDays: requiredInteger(data, 'withholdingDays'),
              farmId: farmId(data, 'farmId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.input.update({
            where: { id: parseIntId(id, 'insumo') },
            data: {
              name: requiredString(data, 'name'),
              type: requiredChoice(data, 'type', [
                'adubo',
                'defensivo',
                'sanitario',
              ]),
              withholdingDays: requiredInteger(data, 'withholdingDays'),
              farmId: farmId(data, 'farmId'),
            },
          });
        },
        delete: (id) =>
          prisma.input.delete({ where: { id: parseIntId(id, 'insumo') } }),
      }),
      'input-applications': createResource('aplicação de insumo', {
        findAll: () => prisma.inputApplication.findMany(),
        findOne: (id) =>
          prisma.inputApplication.findUnique({
            where: { id: parseIntId(id, 'aplicação') },
          }),
        create: (body) => {
          const data = bodyRecord(body);
          return prisma.inputApplication.create({
            data: {
              date: requiredDate(data, 'date'),
              quantity: requiredNumber(data, 'quantity'),
              withholdingEnd: requiredDate(data, 'withholdingEnd'),
              inputId: requiredId(data, 'inputId'),
              paddockId: farmId(data, 'paddockId'),
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          return prisma.inputApplication.update({
            where: { id: parseIntId(id, 'aplicação') },
            data: {
              date: requiredDate(data, 'date'),
              quantity: requiredNumber(data, 'quantity'),
              withholdingEnd: requiredDate(data, 'withholdingEnd'),
              inputId: requiredId(data, 'inputId'),
              paddockId: farmId(data, 'paddockId'),
            },
          });
        },
        delete: (id) =>
          prisma.inputApplication.delete({
            where: { id: parseIntId(id, 'aplicação') },
          }),
      }),
      alerts: createResource('alerta', {
        findAll: () => prisma.alert.findMany(),
        findOne: (id) =>
          prisma.alert.findUnique({ where: { id: parseIntId(id, 'alerta') } }),
        create: (body) => {
          const data = bodyRecord(body);
          const paddockId =
            data.paddockId === undefined || data.paddockId === ''
              ? undefined
              : farmId(data, 'paddockId');
          const propertyId =
            data.farmId === undefined || data.farmId === ''
              ? undefined
              : farmId(data, 'farmId');
          return prisma.alert.create({
            data: {
              type: requiredString(data, 'type'),
              severity: requiredString(data, 'severity'),
              message: requiredString(data, 'message'),
              generatedAt: optionalDate(data, 'generatedAt'),
              status:
                data.status === undefined
                  ? 'aberto'
                  : requiredChoice(data, 'status', [
                      'aberto',
                      'resolvido',
                      'ignorado',
                    ]),
              paddockId,
              farmId: propertyId,
            },
          });
        },
        update: (id, body) => {
          const data = bodyRecord(body);
          const paddockId =
            data.paddockId === undefined || data.paddockId === ''
              ? null
              : farmId(data, 'paddockId');
          const propertyId =
            data.farmId === undefined || data.farmId === ''
              ? null
              : farmId(data, 'farmId');
          return prisma.alert.update({
            where: { id: parseIntId(id, 'alerta') },
            data: {
              type: requiredString(data, 'type'),
              severity: requiredString(data, 'severity'),
              message: requiredString(data, 'message'),
              generatedAt: requiredDate(data, 'generatedAt'),
              status: requiredChoice(data, 'status', [
                'aberto',
                'resolvido',
                'ignorado',
              ]),
              paddockId,
              farmId: propertyId,
            },
          });
        },
        delete: (id) =>
          prisma.alert.delete({ where: { id: parseIntId(id, 'alerta') } }),
      }),
    };
  }

  list(resourceName: string): Promise<unknown[]> {
    return this.getResource(resourceName).findAll();
  }

  async get(resourceName: string, id: string): Promise<unknown> {
    const resource = this.getResource(resourceName);
    const result = await resource.findOne(id);
    if (result === null)
      throw new NotFoundException(
        `Registro de ${resource.name} com ID ${id} não encontrado.`,
      );
    return result;
  }

  async create(resourceName: string, body: unknown): Promise<unknown> {
    return this.execute(() => this.getResource(resourceName).create(body));
  }

  async update(
    resourceName: string,
    id: string,
    body: unknown,
  ): Promise<unknown> {
    const resource = this.getResource(resourceName);
    await this.get(resourceName, id);
    return this.execute(() => resource.update(id, body));
  }

  async delete(resourceName: string, id: string): Promise<unknown> {
    const resource = this.getResource(resourceName);
    await this.get(resourceName, id);
    return this.execute(() => resource.delete(id));
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Já existe um registro com um dos valores informados.',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Um dos registros relacionados não foi encontrado.',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'O registro solicitado não foi encontrado.',
          );
        }
      }
      throw error;
    }
  }

  private getResource(resourceName: string): Resource {
    if (!Object.prototype.hasOwnProperty.call(this.resources, resourceName)) {
      throw new NotFoundException(`Recurso "${resourceName}" não encontrado.`);
    }
    const resource = this.resources[resourceName];
    return resource;
  }
}
