import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FarmsService } from './farms.service.js';

@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  create(@Body() body: { name: string; ownerName?: string }) {
    return this.farmsService.create(body);
  }

  @Get()
  findAll() {
    return this.farmsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmsService.findOne(id);
  }
}