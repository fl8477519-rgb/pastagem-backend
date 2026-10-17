import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ResourcesService } from './resources.service.js';

@Controller('records')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get(':resource')
  findAll(@Param('resource') resource: string) {
    return this.resourcesService.list(resource);
  }

  @Get(':resource/:id')
  findOne(@Param('resource') resource: string, @Param('id') id: string) {
    return this.resourcesService.get(resource, id);
  }

  @Post(':resource')
  create(@Param('resource') resource: string, @Body() body: unknown) {
    return this.resourcesService.create(resource, body);
  }

  @Put(':resource/:id')
  update(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.resourcesService.update(resource, id, body);
  }

  @Delete(':resource/:id')
  remove(@Param('resource') resource: string, @Param('id') id: string) {
    return this.resourcesService.delete(resource, id);
  }
}
