import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateExamDto, UpdateExamDto, UpdateResultDto } from './dtos/exam.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';

@Controller('admin/exams')
@UseGuards(AdminJwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  /**
   * Create an exam and auto-generate a pending ExamResult row
   * for every student currently enrolled in the given class.
   */
  @Post('store')
  create(@Body() dto: CreateExamDto) {
    return this.examService.create(dto);
  }

  /** List all exams with class name and subject name. Ordered by exam_date ASC. */
  @Get('index')
  findAll() {
    return this.examService.findAll();
  }

  /** Get a single exam with its full result list (student name + status + marks). */
  @Get('findOne/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examService.findOne(id);
  }

  /** Update exam fields. Re-validates class/subject FKs only when changed. */
  @Put('update/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examService.update(id, dto);
  }

  /** Toggle exam active/inactive status (1 ↔ 0). */
  @Get('toggleStatus/:id')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.examService.toggleStatus(id);
  }

  /** Delete an exam (cascades to all its ExamResult rows). */
  @Delete('remove/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examService.remove(id);
  }

  /**
   * Enter or correct a student's result — set marks_obtained, status, remarks.
   * Percentage is auto-calculated from marks_obtained / total_marks.
   * Pass/fail is auto-derived if status is not explicitly provided.
   */
  @Put('results/update/:resultId')
  updateResult(
    @Param('resultId', ParseIntPipe) resultId: number,
    @Body() dto: UpdateResultDto,
  ) {
    return this.examService.updateResult(resultId, dto);
  }

  /** All exams + results for a specific class. */
  @Get('results/class/:class_id')
  getResultsByClass(@Param('class_id', ParseIntPipe) classId: number) {
    return this.examService.getResultsByClass(classId);
  }

  /** Full result history for a single student across all exams. */
  @Get('results/student/:student_id')
  getResultsByStudent(@Param('student_id', ParseIntPipe) studentId: number) {
    return this.examService.getResultsByStudent(studentId);
  }
}
