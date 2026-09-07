import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Student } from './entity/student.entity';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Guardian } from 'src/guardian/entity/guardian.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,

    @InjectRepository(Guardian)
    private readonly guardianRepo: Repository<Guardian>,
  ) {}

  // ─────────────────────────────── CREATE ────────────────────────────────────

  async create(dto: CreateStudentDto) {
    try {
      // 1. Both FKs are required — validate they exist and name the missing one clearly
      const schoolClass = await this.classRepo.findOne({
        where: { id: dto.class_id },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${dto.class_id} not found. ` +
            'Create the class first via POST /admin/classes/store.',
        );
      }

      const guardian = await this.guardianRepo.findOne({
        where: { id: dto.guardian_id },
      });
      if (!guardian) {
        throw new NotFoundException(
          `Guardian with id ${dto.guardian_id} not found. ` +
            'Create the guardian first via POST /admin/guardians/store.',
        );
      }

      // 2. Unique constraints
      const rollDup = await this.studentRepo.findOne({
        where: { roll_no: dto.roll_no },
      });
      if (rollDup) {
        throw new BadRequestException(
          `Roll number '${dto.roll_no}' is already assigned to another student`,
        );
      }

      const identityDup = await this.studentRepo.findOne({
        where: { identity_number: dto.identity_number },
      });
      if (identityDup) {
        throw new BadRequestException(
          `Identity number '${dto.identity_number}' is already registered`,
        );
      }

      // 3. Create and save
      const student = this.studentRepo.create({
        name: dto.name,
        roll_no: dto.roll_no,
        dob: dto.dob,
        gender: dto.gender,
        identity_number: dto.identity_number,
        class_id: dto.class_id,
        guardian_id: dto.guardian_id,
        admission_date: dto.admission_date,
      });
      const saved = await this.studentRepo.save(student);

      // Re-fetch with full relations for the response
      const full = await this.fetchWithRelations(saved.id);
      return { success: true, message: 'Student created successfully', data: full };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ALL ──────────────────────────────────

  async findAll() {
    try {
      const students = await this.studentRepo.find({
        relations: ['school_class', 'guardian'],
        order: { id: 'ASC' },
      });

      // Shape: return only class name and guardian name — not the full nested objects
      const data = students.map((s) => ({
        ...s,
        class_name: s.school_class?.name ?? null,
        guardian_name: s.guardian?.name ?? null,
        school_class: undefined,
        guardian: undefined,
      }));

      return { success: true, message: 'Student list', data };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ONE ──────────────────────────────────

  async findOne(id: number) {
    try {
      const student = await this.fetchWithRelations(id);
      return { success: true, message: 'Student fetched', data: student };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE ────────────────────────────────────

  async update(id: number, dto: UpdateStudentDto) {
    try {
      const student = await this.studentRepo.findOne({ where: { id } });
      if (!student) throw new NotFoundException('Student not found');

      // Re-validate FKs only when they are being changed
      if (dto.class_id !== undefined && dto.class_id !== student.class_id) {
        const cls = await this.classRepo.findOne({ where: { id: dto.class_id } });
        if (!cls) {
          throw new NotFoundException(
            `SchoolClass with id ${dto.class_id} not found`,
          );
        }
      }

      if (dto.guardian_id !== undefined && dto.guardian_id !== student.guardian_id) {
        const guardian = await this.guardianRepo.findOne({
          where: { id: dto.guardian_id },
        });
        if (!guardian) {
          throw new NotFoundException(
            `Guardian with id ${dto.guardian_id} not found`,
          );
        }
      }

      // Unique checks excluding self
      if (dto.roll_no && dto.roll_no !== student.roll_no) {
        const dup = await this.studentRepo.findOne({
          where: { roll_no: dto.roll_no, id: Not(id) },
        });
        if (dup) {
          throw new BadRequestException(
            `Roll number '${dto.roll_no}' is already assigned to another student`,
          );
        }
      }

      if (dto.identity_number && dto.identity_number !== student.identity_number) {
        const dup = await this.studentRepo.findOne({
          where: { identity_number: dto.identity_number, id: Not(id) },
        });
        if (dup) {
          throw new BadRequestException(
            `Identity number '${dto.identity_number}' is already registered`,
          );
        }
      }

      Object.assign(student, dto);
      const saved = await this.studentRepo.save(student);
      const full = await this.fetchWithRelations(saved.id);
      return { success: true, message: 'Student updated', data: full };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TOGGLE STATUS ─────────────────────────────

  async toggleStatus(id: number) {
    try {
      const student = await this.studentRepo.findOne({ where: { id } });
      if (!student) throw new NotFoundException('Student not found');

      student.status = student.status === 1 ? 0 : 1;
      const saved = await this.studentRepo.save(student);
      const msg = saved.status === 1 ? 'Student activated' : 'Student deactivated';
      return { success: true, message: msg, data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── REMOVE ────────────────────────────────────

  async remove(id: number) {
    try {
      const student = await this.studentRepo.findOne({ where: { id } });
      if (!student) throw new NotFoundException('Student not found');

      await this.studentRepo.remove(student);
      return { success: true, message: 'Student deleted', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE HELPERS ───────────────────────────

  /**
   * Fetch a student with full relations and shape the response so
   * class and guardian info is always present on findOne / create / update.
   */
  private async fetchWithRelations(id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['school_class', 'guardian'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const { school_class, guardian, ...rest } = student;
    return {
      ...rest,
      class_id: school_class?.id ?? rest.class_id,
      class_name: school_class?.name ?? null,
      guardian_id: guardian?.id ?? rest.guardian_id,
      guardian_name: guardian?.name ?? null,
      guardian_relation: guardian?.relation_to_student ?? null,
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
