import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Attendance,
  MarkedByType,
} from './entity/attendance.entity';
import { MarkAttendanceDto, UpdateAttendanceDto } from './dtos/attendance.dto';
import { Student } from 'src/student/entity/student.entity';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';
import { Admin } from 'src/admin/entity/admin.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,

    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,

    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  // ─────────────────────────────── SHARED UPSERT CORE ─────────────────────────

  /**
   * Internal upsert engine used by both admin and teacher mark flows.
   * Validates class + every student, checks class membership, then upserts.
   */
  private async markCore(
    dto: MarkAttendanceDto,
    markedById: number,
    markedByType: MarkedByType,
  ): Promise<Attendance[]> {
    const schoolClass = await this.classRepo.findOne({
      where: { id: dto.class_id },
    });
    if (!schoolClass) {
      throw new NotFoundException(
        `SchoolClass with id ${dto.class_id} not found`,
      );
    }

    const results: Attendance[] = [];

    for (const record of dto.records) {
      const student = await this.studentRepo.findOne({
        where: { id: record.student_id },
      });
      if (!student) {
        throw new NotFoundException(
          `Student with id ${record.student_id} not found`,
        );
      }

      if (student.class_id !== dto.class_id) {
        throw new BadRequestException(
          `Student '${student.name}' (id: ${student.id}) belongs to class id ${student.class_id}, ` +
            `not class id ${dto.class_id}. ` +
            'All students in a single mark request must belong to the same class.',
        );
      }

      let attendance = await this.attendanceRepo.findOne({
        where: { student_id: record.student_id, date: dto.date },
      });

      if (attendance) {
        attendance.status = record.status;
        attendance.marked_by_id = markedById;
        attendance.marked_by_type = markedByType;
        attendance.class_id = dto.class_id;
      } else {
        attendance = this.attendanceRepo.create({
          student_id: record.student_id,
          class_id: dto.class_id,
          date: dto.date,
          status: record.status,
          marked_by_id: markedById,
          marked_by_type: markedByType,
        });
      }

      results.push(await this.attendanceRepo.save(attendance));
    }

    return results;
  }

  // ─────────────────────────────── ADMIN: MARK ─────────────────────────────────

  async mark(dto: MarkAttendanceDto, adminId: number) {
    try {
      const results = await this.markCore(dto, adminId, MarkedByType.ADMIN);
      return {
        success: true,
        message: `Attendance marked for ${results.length} student(s) on ${dto.date}`,
        data: results,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: MARK ───────────────────────────────

  /**
   * Teacher-facing attendance marking.
   * 1. Resolves Teacher by user_id (throws ForbiddenException if none linked).
   * 2. Verifies that SchoolClass.class_teacher_id === teacher.id
   *    (throws ForbiddenException if the teacher is not the homeroom teacher).
   * 3. Delegates to markCore() with marked_by_type = 'teacher'.
   */
  async markByTeacher(dto: MarkAttendanceDto, teacherUserId: number) {
    try {
      // 1. Resolve teacher from user account
      const teacher = await this.teacherRepo.findOne({
        where: { user_id: teacherUserId },
      });
      if (!teacher) {
        throw new ForbiddenException(
          'No teacher profile is linked to your account. ' +
            'Contact the school administration.',
        );
      }

      // 2. Verify class ownership
      const schoolClass = await this.classRepo.findOne({
        where: { id: dto.class_id },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${dto.class_id} not found`,
        );
      }
      if (schoolClass.class_teacher_id !== teacher.id) {
        throw new ForbiddenException(
          `You are not the class teacher for '${schoolClass.name}'. ` +
            'Only the assigned class teacher can mark attendance for this class.',
        );
      }

      // 3. Mark with teacher identity
      const results = await this.markCore(dto, teacher.id, MarkedByType.TEACHER);
      return {
        success: true,
        message: `Attendance marked for ${results.length} student(s) on ${dto.date}`,
        data: results,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: GET MY CLASS ───────────────────────

  /**
   * Resolves the Teacher from their user account and returns the SchoolClass
   * where class_teacher_id = teacher.id. Returns null data with a clear message
   * if the teacher is not yet assigned as a homeroom teacher.
   */
  async getMyClass(teacherUserId: number) {
    try {
      const teacher = await this.teacherRepo.findOne({
        where: { user_id: teacherUserId },
      });
      if (!teacher) {
        throw new ForbiddenException(
          'No teacher profile is linked to your account.',
        );
      }

      const schoolClass = await this.classRepo.findOne({
        where: { class_teacher_id: teacher.id },
      });

      if (!schoolClass) {
        return {
          success: true,
          message: 'You are not currently assigned as a class teacher for any class.',
          data: null,
        };
      }

      return {
        success: true,
        message: `You are the class teacher for '${schoolClass.name}'`,
        data: {
          class_id: schoolClass.id,
          class_name: schoolClass.name,
          section: schoolClass.section,
          status: schoolClass.status,
        },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: GET CLASS ATTENDANCE ───────────────

  /**
   * Teacher-scoped getByClass — same ownership check as markByTeacher.
   */
  async getByClassForTeacher(classId: number, date: string, teacherUserId: number) {
    try {
      const teacher = await this.teacherRepo.findOne({
        where: { user_id: teacherUserId },
      });
      if (!teacher) {
        throw new ForbiddenException(
          'No teacher profile is linked to your account.',
        );
      }

      const schoolClass = await this.classRepo.findOne({
        where: { id: classId },
      });
      if (!schoolClass) {
        throw new NotFoundException(`SchoolClass with id ${classId} not found`);
      }
      if (schoolClass.class_teacher_id !== teacher.id) {
        throw new ForbiddenException(
          `You are not the class teacher for '${schoolClass.name}'.`,
        );
      }

      return this.getByClass(classId, date);
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── GET BY CLASS + DATE ─────────────────────────

  async getByClass(classId: number, date: string) {
    try {
      const schoolClass = await this.classRepo.findOne({
        where: { id: classId },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${classId} not found`,
        );
      }

      const records = await this.attendanceRepo
        .createQueryBuilder('a')
        .leftJoin('a.student', 'student')
        .where('a.class_id = :classId', { classId })
        .andWhere('a.date = :date', { date })
        .select([
          'a.id',
          'a.student_id',
          'a.class_id',
          'a.date',
          'a.status',
          'a.marked_by_id',
          'a.marked_by_type',
          'a.created_at',
          'a.updated_at',
          'student.id',
          'student.name',
          'student.roll_no',
        ])
        .orderBy('student.name', 'ASC')
        .getMany();

      // Enrich each record with the marker's display name
      const enriched = await this.enrichWithMarkerName(records);

      return {
        success: true,
        message: `Attendance for class '${schoolClass.name}' on ${date}`,
        data: {
          class_id: classId,
          class_name: schoolClass.name,
          date,
          total: enriched.length,
          records: enriched,
        },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── GET BY STUDENT ──────────────────────────────

  async getByStudent(studentId: number) {
    try {
      const student = await this.studentRepo.findOne({
        where: { id: studentId },
      });
      if (!student) {
        throw new NotFoundException(
          `Student with id ${studentId} not found`,
        );
      }

      const records = await this.attendanceRepo.find({
        where: { student_id: studentId },
        order: { date: 'DESC' },
        relations: [],
      });

      const enriched = await this.enrichWithMarkerName(records);

      return {
        success: true,
        message: `Attendance history for student '${student.name}'`,
        data: {
          student_id: studentId,
          student_name: student.name,
          roll_no: student.roll_no,
          total_records: enriched.length,
          records: enriched,
        },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE SINGLE RECORD ────────────────────────

  async update(id: number, dto: UpdateAttendanceDto) {
    try {
      const attendance = await this.attendanceRepo.findOne({ where: { id } });
      if (!attendance) {
        throw new NotFoundException(
          `Attendance record with id ${id} not found`,
        );
      }

      if (dto.status !== undefined) {
        attendance.status = dto.status;
      }

      const saved = await this.attendanceRepo.save(attendance);
      return {
        success: true,
        message: 'Attendance record updated',
        data: saved,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE HELPERS ─────────────────────────────

  /**
   * Enrich attendance records with a human-readable marked_by_name field
   * by batch-loading admin and teacher names for records in the given set.
   */
  private async enrichWithMarkerName(
    records: Attendance[],
  ): Promise<Array<Record<string, unknown>>> {
    // Separate ids by type for two targeted lookups
    const adminIds = [
      ...new Set(
        records
          .filter((r) => r.marked_by_type === MarkedByType.ADMIN && r.marked_by_id)
          .map((r) => r.marked_by_id),
      ),
    ];
    const teacherIds = [
      ...new Set(
        records
          .filter((r) => r.marked_by_type === MarkedByType.TEACHER && r.marked_by_id)
          .map((r) => r.marked_by_id),
      ),
    ];

    const adminMap = new Map<number, string>();
    const teacherMap = new Map<number, string>();

    if (adminIds.length > 0) {
      const admins = await this.adminRepo
        .createQueryBuilder('a')
        .whereInIds(adminIds)
        .select(['a.id', 'a.name'])
        .getMany();
      admins.forEach((a) => adminMap.set(a.id, a.name ?? `Admin #${a.id}`));
    }

    if (teacherIds.length > 0) {
      const teachers = await this.teacherRepo
        .createQueryBuilder('t')
        .whereInIds(teacherIds)
        .select(['t.id', 't.name'])
        .getMany();
      teachers.forEach((t) => teacherMap.set(t.id, t.name));
    }

    return records.map((r) => {
      let marked_by_name: string | null = null;
      if (r.marked_by_id) {
        if (r.marked_by_type === MarkedByType.ADMIN) {
          marked_by_name = adminMap.get(r.marked_by_id) ?? null;
        } else if (r.marked_by_type === MarkedByType.TEACHER) {
          marked_by_name = teacherMap.get(r.marked_by_id) ?? null;
        }
      }
      return { ...r, marked_by_name };
    });
  }

  private handleUnknown(err: unknown): never {
    if (
      err instanceof BadRequestException ||
      err instanceof NotFoundException ||
      err instanceof ForbiddenException
    ) {
      throw err;
    }
    throw new InternalServerErrorException('Unexpected error', {
      cause: err as Error,
    });
  }
}
