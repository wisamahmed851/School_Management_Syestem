import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSubjectTeacher } from './entity/class-subject-teacher.entity';
import {
  CreateClassSubjectDto,
  UpdateClassSubjectDto,
} from './dtos/class-subject.dto';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';

@Injectable()
export class ClassSubjectService {
  constructor(
    @InjectRepository(ClassSubjectTeacher)
    private readonly mappingRepo: Repository<ClassSubjectTeacher>,

    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,

    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,

    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
  ) {}

  // ─────────────────────────────── CREATE ────────────────────────────────────

  async create(dto: CreateClassSubjectDto) {
    try {
      // 1. Validate class exists
      const schoolClass = await this.classRepo.findOne({
        where: { id: dto.class_id },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${dto.class_id} not found`,
        );
      }

      // 2. Validate subject exists
      const subject = await this.subjectRepo.findOne({
        where: { id: dto.subject_id },
      });
      if (!subject) {
        throw new NotFoundException(
          `Subject with id ${dto.subject_id} not found`,
        );
      }

      // 3. Validate teacher exists (if provided)
      if (dto.teacher_id !== undefined) {
        const teacher = await this.teacherRepo.findOne({
          where: { id: dto.teacher_id },
        });
        if (!teacher) {
          throw new NotFoundException(
            `Teacher with id ${dto.teacher_id} not found`,
          );
        }
      }

      // 4. Unique constraint check — provide a clear conflict error
      const existing = await this.mappingRepo.findOne({
        where: { class_id: dto.class_id, subject_id: dto.subject_id },
      });
      if (existing) {
        throw new BadRequestException(
          `Subject '${subject.name}' is already mapped to class '${schoolClass.name}'. ` +
            `Use PUT /admin/class-subjects/update/${existing.id} to change the teacher assignment.`,
        );
      }

      const mapping = this.mappingRepo.create({
        class_id: dto.class_id,
        subject_id: dto.subject_id,
        teacher_id: dto.teacher_id,
      });
      const saved = await this.mappingRepo.save(mapping);

      // Re-fetch with full relations
      return {
        success: true,
        message: `Subject '${subject.name}' mapped to class '${schoolClass.name}'`,
        data: await this.fetchOne(saved.id),
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND BY CLASS ─────────────────────────────

  async findByClass(classId: number) {
    try {
      const schoolClass = await this.classRepo.findOne({
        where: { id: classId },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${classId} not found`,
        );
      }

      const mappings = await this.mappingRepo.find({
        where: { class_id: classId },
        relations: ['subject', 'teacher'],
        order: { id: 'ASC' },
      });

      const data = mappings.map((m) => ({
        id: m.id,
        class_id: m.class_id,
        subject_id: m.subject_id,
        subject_name: m.subject?.name ?? null,
        subject_code: m.subject?.code ?? null,
        teacher_id: m.teacher_id,
        teacher_name: m.teacher?.name ?? null,
        status: m.status,
      }));

      return {
        success: true,
        message: `Subjects for class '${schoolClass.name}'`,
        data: { class_id: classId, class_name: schoolClass.name, subjects: data },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND BY TEACHER ───────────────────────────

  async findByTeacher(teacherId: number) {
    try {
      const teacher = await this.teacherRepo.findOne({
        where: { id: teacherId },
      });
      if (!teacher) {
        throw new NotFoundException(
          `Teacher with id ${teacherId} not found`,
        );
      }

      const mappings = await this.mappingRepo.find({
        where: { teacher_id: teacherId },
        relations: ['school_class', 'subject'],
        order: { id: 'ASC' },
      });

      const data = mappings.map((m) => ({
        id: m.id,
        class_id: m.class_id,
        class_name: m.school_class?.name ?? null,
        subject_id: m.subject_id,
        subject_name: m.subject?.name ?? null,
        subject_code: m.subject?.code ?? null,
        status: m.status,
      }));

      return {
        success: true,
        message: `Assignments for teacher '${teacher.name}'`,
        data: {
          teacher_id: teacherId,
          teacher_name: teacher.name,
          assignments: data,
        },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE (reassign teacher) ─────────────────

  async update(id: number, dto: UpdateClassSubjectDto) {
    try {
      const mapping = await this.mappingRepo.findOne({ where: { id } });
      if (!mapping) {
        throw new NotFoundException(
          `ClassSubjectTeacher mapping with id ${id} not found`,
        );
      }

      if (dto.teacher_id !== undefined) {
        if (dto.teacher_id !== null) {
          const teacher = await this.teacherRepo.findOne({
            where: { id: dto.teacher_id },
          });
          if (!teacher) {
            throw new NotFoundException(
              `Teacher with id ${dto.teacher_id} not found`,
            );
          }
        }
        mapping.teacher_id = dto.teacher_id;
      }

      const saved = await this.mappingRepo.save(mapping);
      return {
        success: true,
        message: 'Teacher assignment updated',
        data: await this.fetchOne(saved.id),
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── REMOVE ────────────────────────────────────

  async remove(id: number) {
    try {
      const mapping = await this.mappingRepo.findOne({ where: { id } });
      if (!mapping) {
        throw new NotFoundException(
          `ClassSubjectTeacher mapping with id ${id} not found`,
        );
      }

      await this.mappingRepo.remove(mapping);
      return { success: true, message: 'Mapping removed', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE HELPERS ───────────────────────────

  private async fetchOne(id: number) {
    const m = await this.mappingRepo.findOne({
      where: { id },
      relations: ['school_class', 'subject', 'teacher'],
    });
    if (!m) throw new NotFoundException('Mapping not found');
    return {
      id: m.id,
      class_id: m.class_id,
      class_name: m.school_class?.name ?? null,
      subject_id: m.subject_id,
      subject_name: m.subject?.name ?? null,
      subject_code: m.subject?.code ?? null,
      teacher_id: m.teacher_id,
      teacher_name: m.teacher?.name ?? null,
      status: m.status,
      created_at: m.created_at,
      updated_at: m.updated_at,
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
