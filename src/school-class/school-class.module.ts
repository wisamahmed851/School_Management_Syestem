import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolClass } from './entity/school-class.entity';
import { SchoolClassController } from './school-class.controller';
import { SchoolClassService } from './school-class.service';
import { Teacher } from 'src/teacher/entity/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolClass, Teacher])],
  controllers: [SchoolClassController],
  providers: [SchoolClassService],
  exports: [SchoolClassService],
})
export class SchoolClassModule {}
