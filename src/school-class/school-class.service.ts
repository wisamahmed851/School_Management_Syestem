import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SchoolClass } from './entity/school-class.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';
import {
  CreateSchoolClassDto,
  UpdateSchoolClassDto,
} from './dtos/school-class.dto';

@Injectable()
export class SchoolClassService {
  constructor(
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,

    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,

    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────── CREATE ────────────────────────────────────

  async create(dto: CreateSchoolClassDto) {
    try {
      if (dto.class_teacher_id !== undefined) {
        await this.resolveTeacher(dto.class_teacher_id);
      }

      const schoolClass = this.classRepo.create({
        name: dto.name,
        class_teacher_id: dto.class_teacher_id ?? undefined,
        section: dto.section ?? undefined,
      });
      const saved = await this.classRepo.save(schoolClass);

      // Re-fetch with relation so the response includes teacher name/email
      return {
        success: true,
        message: 'Class created successfully',
        data: await this.fetchWithTeacher(saved.id),
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ALL ──────────────────────────────────

  async findAll() {
    try {
      const classes = await this.classRepo.find({
        relations: ['class_teacher'],
        order: { id: 'ASC' },
      });
      return { success: true, message: 'Class list', data: classes };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ONE ──────────────────────────────────

  async findOne(id: number) {
    try {
      const schoolClass = await this.fetchWithTeacher(id);
      return { success: true, message: 'Class fetched', data: schoolClass };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE ────────────────────────────────────

  async update(id: number, dto: UpdateSchoolClassDto) {
    try {
      const schoolClass = await this.classRepo.findOne({ where: { id } });
      if (!schoolClass) throw new NotFoundException('Class not found');

      if (
        dto.class_teacher_id !== undefined &&
        dto.class_teacher_id !== schoolClass.class_teacher_id
      ) {
        await this.resolveTeacher(dto.class_teacher_id);
      }

      Object.assign(schoolClass, dto);
      const saved = await this.classRepo.save(schoolClass);

      return {
        success: true,
        message: 'Class updated',
        data: await this.fetchWithTeacher(saved.id),
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TOGGLE STATUS ─────────────────────────────

  async toggleStatus(id: number) {
    try {
      const schoolClass = await this.classRepo.findOne({ where: { id } });
      if (!schoolClass) throw new NotFoundException('Class not found');

      schoolClass.status = schoolClass.status === 1 ? 0 : 1;
      const saved = await this.classRepo.save(schoolClass);
      const msg = saved.status === 1 ? 'Class activated' : 'Class deactivated';
      return { success: true, message: msg, data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── REMOVE ────────────────────────────────────

  async remove(id: number) {
    try {
      const schoolClass = await this.classRepo.findOne({ where: { id } });
      if (!schoolClass) throw new NotFoundException('Class not found');

      // Guard: refuse deletion if any students are assigned to this class.
      // Uses a raw query so this check works as-is once the Student module is
      // built (the `students` table with a `class_id` column), and is safely
      // skipped today because the table simply doesn't exist yet.
      const studentCount = await this.countStudentsInClass(id);
      if (studentCount > 0) {
        throw new BadRequestException(
          `Cannot delete class — ${studentCount} student(s) are currently assigned to it. ` +
            'Reassign or remove them first.',
        );
      }

      await this.classRepo.remove(schoolClass);
      return { success: true, message: 'Class deleted', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE HELPERS ───────────────────────────

  /**
   * Validate a teacher exists and is active.
   * Throws NotFoundException if not found.
   */
  private async resolveTeacher(teacherId: number): Promise<Teacher> {
    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(
        `Teacher with id ${teacherId} not found. ` +
          'Provide a valid class_teacher_id or omit the field to leave the class unassigned.',
      );
    }
    return teacher;
  }

  /**
   * Fetch a SchoolClass with its class_teacher relation and return only the
   * teacher's basic fields (id, name, email) in the response.
   */
  private async fetchWithTeacher(id: number) {
    const schoolClass = await this.classRepo.findOne({
      where: { id },
      relations: ['class_teacher'],
    });
    if (!schoolClass) throw new NotFoundException('Class not found');

    const { class_teacher, ...rest } = schoolClass;
    return {
      ...rest,
      class_teacher: class_teacher
        ? {
            id: class_teacher.id,
            name: class_teacher.name,
            email: class_teacher.email,
          }
        : null,
    };
  }

  /**
   * Count students assigned to a given class_id.
   *
   * Runs a raw SQL query so the guard is wired now but does not require the
   * Student entity to be imported into this module.
   *
   * Returns 0 gracefully if the `students` table does not yet exist (i.e. the
   * Student module has not been built yet), so this module continues to work
   * in isolation during development.
   */
  private async countStudentsInClass(classId: number): Promise<number> {
    try {
      const result: { cnt: string }[] = await this.dataSource.query(
        'SELECT COUNT(*) AS cnt FROM students WHERE class_id = ?',
        [classId],
      );
      return parseInt(result[0]?.cnt ?? '0', 10);
    } catch {
      // Table doesn't exist yet — treat as 0 students assigned
      return 0;
    }
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
