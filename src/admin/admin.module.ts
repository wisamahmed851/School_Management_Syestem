import { Module } from '@nestjs/common';
import { AdminsService } from './admin.service';
import { AdminsController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entity/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  providers: [AdminsService],
  controllers: [AdminsController],
})
export class AdminsModule {}
