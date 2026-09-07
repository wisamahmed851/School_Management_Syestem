import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entity/exam.entity';
import { ExamResult, ResultStatus } from './entity/exam-result.entity';
import { CreateExamDto, UpdateExamDto, UpdateResultDto } from './dtos/exam.dto';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Student } from 'src/student/entity/student.entity';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,

    @InjectRepository(ExamResult)
    private readonly resultRepo: Repository<ExamResult>,

    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,

    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  // ─────────────────────────────── CREATE EXAM ────────────────────────────────

  async create(dto: CreateExamDto) {
    try {
      // 1. Validate class
      const schoolClass = await this.classRepo.findOne({
        where: { id: dto.class_id },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${dto.class_id} not found`,
        );
      }

      // 2. Validate subject (if provided)
      if (dto.subject_id !== undefined) {
        const subject = await this.subjectRepo.findOne({
          where: { id: dto.subject_id },
        });
        if (!subject) {
          throw new NotFoundException(
            `Subject with id ${dto.subject_id} not found`,
          );
        }
      }

      // 3. Create the Exam
      const exam = this.examRepo.create({
        title: dto.title,
        exam_type: dto.exam_type,
        class_id: dto.class_id,
        subject_id: dto.subject_id,
        exam_date: dto.exam_date,
        start_time: dto.start_time,
        end_time: dto.end_time,
        total_marks: dto.total_marks,
        description: dto.description,
      });
      const savedExam = await this.examRepo.save(exam);

      // 4. Auto-generate a pending ExamResult row for every student in this class
      const studentsInClass = await this.studentRepo.find({
        where: { class_id: dto.class_id },
        select: { id: true, name: true },
      });

      if (studentsInClass.length > 0) {
        const results = studentsInClass.map((student) =>
          this.resultRepo.create({
            exam_id: savedExam.id,
            student_id: student.id,
            status: ResultStatus.PENDING,
          }),
        );
        await this.resultRepo.save(results);
      }

      const full = await this.fetchWithResults(savedExam.id);
      return {
        success: true,
        message: `Exam created. ${studentsInClass.length} result record(s) auto-generated.`,
        data: full,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ALL ───────────────────────────────────

  async findAll() {
    try {
      const exams = await this.examRepo.find({
        relations: ['school_class', 'subject'],
        order: { exam_date: 'ASC', id: 'ASC' },
      });

      const data = exams.map((e) => ({
        id: e.id,
        title: e.title,
        exam_type: e.exam_type,
        exam_date: e.exam_date,
        start_time: e.start_time,
        end_time: e.end_time,
        total_marks: e.total_marks,
        class_id: e.class_id,
        class_name: e.school_class?.name ?? null,
        subject_id: e.subject_id,
        subject_name: e.subject?.name ?? null,
        status: e.status,
        created_at: e.created_at,
        updated_at: e.updated_at,
      }));

      return { success: true, message: 'Exam list', data };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ONE ───────────────────────────────────

  async findOne(id: number) {
    try {
      const exam = await this.fetchWithResults(id);
      return { success: true, message: 'Exam fetched', data: exam };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE EXAM ────────────────────────────────

  async update(id: number, dto: UpdateExamDto) {
    try {
      const exam = await this.examRepo.findOne({ where: { id } });
      if (!exam) throw new NotFoundException('Exam not found');

      if (dto.class_id !== undefined && dto.class_id !== exam.class_id) {
        const cls = await this.classRepo.findOne({ where: { id: dto.class_id } });
        if (!cls) {
          throw new NotFoundException(
            `SchoolClass with id ${dto.class_id} not found`,
          );
        }
      }

      if (dto.subject_id !== undefined && dto.subject_id !== exam.subject_id) {
        const subject = await this.subjectRepo.findOne({
          where: { id: dto.subject_id },
        });
        if (!subject) {
          throw new NotFoundException(
            `Subject with id ${dto.subject_id} not found`,
          );
        }
      }

      Object.assign(exam, dto);
      const saved = await this.examRepo.save(exam);
      const full = await this.fetchWithResults(saved.id);
      return { success: true, message: 'Exam updated', data: full };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TOGGLE STATUS ──────────────────────────────

  async toggleStatus(id: number) {
    try {
      const exam = await this.examRepo.findOne({ where: { id } });
      if (!exam) throw new NotFoundException('Exam not found');

      exam.status = exam.status === 1 ? 0 : 1;
      const saved = await this.examRepo.save(exam);
      const msg = saved.status === 1 ? 'Exam activated' : 'Exam deactivated';
      return { success: true, message: msg, data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── REMOVE EXAM ────────────────────────────────

  async remove(id: number) {
    try {
      const exam = await this.examRepo.findOne({ where: { id } });
      if (!exam) throw new NotFoundException('Exam not found');

      // Results are deleted via onDelete: 'CASCADE' on exam_id FK
      await this.examRepo.remove(exam);
      return { success: true, message: 'Exam deleted', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE RESULT ──────────────────────────────

  async updateResult(resultId: number, dto: UpdateResultDto) {
    try {
      const result = await this.resultRepo.findOne({
        where: { id: resultId },
        relations: ['exam'],
      });
      if (!result) {
        throw new NotFoundException(
          `ExamResult with id ${resultId} not found`,
        );
      }

      // Auto-calculate percentage when marks_obtained is provided
      if (dto.marks_obtained !== undefined && result.exam?.total_marks) {
        const pct =
          (Number(dto.marks_obtained) / Number(result.exam.total_marks)) * 100;
        result.percentage = Math.round(pct * 100) / 100; // 2 decimal places

        // Auto-derive pass/fail if not explicitly set
        if (dto.status === undefined) {
          result.status = pct >= 40 ? ResultStatus.PASS : ResultStatus.FAIL;
        }
      }

      Object.assign(result, dto);
      const saved = await this.resultRepo.save(result);
      return { success: true, message: 'Result updated', data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── GET RESULTS BY CLASS ───────────────────────

  async getResultsByClass(classId: number) {
    try {
      const schoolClass = await this.classRepo.findOne({
        where: { id: classId },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${classId} not found`,
        );
      }

      // All exams for this class with their results
      const exams = await this.examRepo.find({
        where: { class_id: classId },
        order: { exam_date: 'ASC' },
      });

      const data = await Promise.all(
        exams.map(async (exam) => {
          const results = await this.resultRepo
            .createQueryBuilder('r')
            .leftJoin('r.student', 'student')
            .where('r.exam_id = :examId', { examId: exam.id })
            .select([
              'r.id',
              'r.student_id',
              'r.marks_obtained',
              'r.percentage',
              'r.status',
              'r.remarks',
              'student.id',
              'student.name',
              'student.roll_no',
            ])
            .orderBy('student.name', 'ASC')
            .getMany();

          return {
            exam_id: exam.id,
            exam_title: exam.title,
            exam_type: exam.exam_type,
            exam_date: exam.exam_date,
            total_marks: exam.total_marks,
            results,
          };
        }),
      );

      return {
        success: true,
        message: `Results for class '${schoolClass.name}'`,
        data: { class_id: classId, class_name: schoolClass.name, exams: data },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── GET RESULTS BY STUDENT ─────────────────────

  async getResultsByStudent(studentId: number) {
    try {
      const student = await this.studentRepo.findOne({
        where: { id: studentId },
      });
      if (!student) {
        throw new NotFoundException(
          `Student with id ${studentId} not found`,
        );
      }

      const results = await this.resultRepo.find({
        where: { student_id: studentId },
        relations: ['exam', 'exam.subject', 'exam.school_class'],
        order: { id: 'ASC' },
      });

      const data = results.map((r) => ({
        result_id: r.id,
        exam_id: r.exam_id,
        exam_title: r.exam?.title ?? null,
        exam_type: r.exam?.exam_type ?? null,
        exam_date: r.exam?.exam_date ?? null,
        subject_name: r.exam?.subject?.name ?? null,
        total_marks: r.exam?.total_marks ?? null,
        marks_obtained: r.marks_obtained,
        percentage: r.percentage,
        status: r.status,
        remarks: r.remarks,
      }));

      return {
        success: true,
        message: `Results for student '${student.name}'`,
        data: {
          student_id: studentId,
          student_name: student.name,
          roll_no: student.roll_no,
          results: data,
        },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE HELPERS ────────────────────────────

  private async fetchWithResults(id: number) {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['school_class', 'subject'],
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const results = await this.resultRepo
      .createQueryBuilder('r')
      .leftJoin('r.student', 'student')
      .where('r.exam_id = :id', { id })
      .select([
        'r.id',
        'r.student_id',
        'r.marks_obtained',
        'r.percentage',
        'r.status',
        'r.remarks',
        'student.id',
        'student.name',
        'student.roll_no',
      ])
      .orderBy('student.name', 'ASC')
      .getMany();

    const { school_class, subject, ...examRest } = exam;
    return {
      ...examRest,
      class_name: school_class?.name ?? null,
      subject_name: subject?.name ?? null,
      results_count: results.length,
      results,
    };
  }

  private handleUnknown(err: unknown): never {
    if (
      err instanceof BadRequestException ||
      err instanceof NotFoundException
    ) {
      throw err;
    }
    throw new InternalServerErrorException('Unexpected error', {
      cause: err as Error,
    });
  }
}
