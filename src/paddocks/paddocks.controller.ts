import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PaddocksService } from './paddocks.service.js'

@Controller('paddocks')
export class PaddocksController {
  constructor(private readonly paddocksService: PaddocksService) {}

  @Post()
  create(@Body() body: { farmId: string; name: string; areaHectares: number }) {
    return this.paddocksService.create(body);
  }

  @Get()
  findAll() {
    return this.paddocksService.findAll();
  }

  @Get('farm/:farmId')
  findByFarm(@Param('farmId') farmId: string) {
    return this.paddocksService.findByFarm(farmId);
  }
}