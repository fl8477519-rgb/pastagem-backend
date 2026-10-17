import { Module } from '@nestjs/common';
import { PaddocksController } from './paddocks.controller.js';
import { PaddocksService } from './paddocks.service.js';

@Module({
  controllers: [PaddocksController],
  providers: [PaddocksService]
})
export class PaddocksModule {}
