import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // Torna o serviço global para não precisar importar manualmente em todos os módulos
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}