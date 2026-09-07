import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dtos/users.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/common/utils/multer.config';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard)
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('users.create')
  @UseInterceptors(FileInterceptor('image', multerConfig('uploads')))
  store(@Body() user: CreateUserDto, @UploadedFile() file: Express.Multer.File) {
    return this.userService.storeUser({ ...user, image: file?.filename });
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('users.index')
  index() {
    return this.userService.index();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('users.findOne')
  findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number,
  ) {
    return this.userService.findOne(id);
  }

  @Post('findOneByEmail')
  @UseGuards(PermissionsGuard)
  @RequirePermission('users.findOne')
  findOneByEmail(@Body() data: { email: string }) {
    return this.userService.findOneByEmail(data.email);
  }

  @Put('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('users.update')
  @UseInterceptors(FileInterceptor('image', multerConfig('uploads')))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() user: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateUser(id, { ...user, image: file?.filename });
  }

  @Put('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('users.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.userService.statusUpdate(id);
  }
}
