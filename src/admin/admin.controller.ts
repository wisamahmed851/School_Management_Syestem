import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AdminsService } from './admin.service';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { UpdateAdminDto } from './dtos/update-admin.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/common/utils/multer.config';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admins.create')
  @UseInterceptors(FileInterceptor('image', multerConfig('uploads')))
  create(@Body() dto: CreateAdminDto, @UploadedFile() file: Express.Multer.File) {
    return this.adminsService.create(dto, file?.filename);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admins.index')
  findAll() {
    return this.adminsService.findAll();
  }

  @Get('active')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admins.index')
  allActive() {
    return this.adminsService.allAvtive();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admins.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminsService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admins.update')
  @UseInterceptors(FileInterceptor('image', multerConfig('uploads')))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminsService.update(id, { ...dto, image: file?.filename });
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admins.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminsService.remove(id);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admins.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminsService.statusUpdate(id);
  }
}
