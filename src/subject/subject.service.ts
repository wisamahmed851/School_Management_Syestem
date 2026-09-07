import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Subject } from './entity/subject.entity';
import { CreateSubjectDto, UpdateSubjectDto } from './dtos/subject.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  // ─────────────────────────────── CREATE ────────────────────────────────────

  async create(dto: CreateSubjectDto) {
    try {
      const codeDup = await this.subjectRepo.findOne({
        where: { code: dto.code },
      });
      if (codeDup) {
        throw new BadRequestException(
          `Subject code '${dto.code}' is already in use`,
        );
      }

      const subject = this.subjectRepo.create(dto);
      const saved = await this.subjectRepo.save(subject);
      return { success: true, message: 'Subject created', data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ALL ──────────────────────────────────

  async findAll() {
    try {
      const subjects = await this.subjectRepo.find({ order: { name: 'ASC' } });
      return { success: true, message: 'Subject list', data: subjects };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ONE ──────────────────────────────────

  async findOne(id: number) {
    try {
      const subject = await this.subjectRepo.findOne({ where: { id } });
      if (!subject) throw new NotFoundException('Subject not found');
      return { success: true, message: 'Subject fetched', data: subject };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE ────────────────────────────────────

  async update(id: number, dto: UpdateSubjectDto) {
    try {
      const subject = await this.subjectRepo.findOne({ where: { id } });
      if (!subject) throw new NotFoundException('Subject not found');

      if (dto.code && dto.code !== subject.code) {
        const dup = await this.subjectRepo.findOne({
          where: { code: dto.code, id: Not(id) },
        });
        if (dup) {
          throw new BadRequestException(
            `Subject code '${dto.code}' is already in use`,
          );
        }
      }

      Object.assign(subject, dto);
      const saved = await this.subjectRepo.save(subject);
      return { success: true, message: 'Subject updated', data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TOGGLE STATUS ─────────────────────────────

  async toggleStatus(id: number) {
    try {
      const subject = await this.subjectRepo.findOne({ where: { id } });
      if (!subject) throw new NotFoundException('Subject not found');

      subject.status = subject.status === 1 ? 0 : 1;
      const saved = await this.subjectRepo.save(subject);
      const msg = saved.status === 1 ? 'Subject activated' : 'Subject deactivated';
      return { success: true, message: msg, data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── REMOVE ────────────────────────────────────

  async remove(id: number) {
    try {
      const subject = await this.subjectRepo.findOne({ where: { id } });
      if (!subject) throw new NotFoundException('Subject not found');

      // Guard: refuse deletion if any ClassSubjectTeacher mapping references this subject
      const mappingCount: { cnt: string }[] = await this.subjectRepo.query(
        'SELECT COUNT(*) AS cnt FROM class_subject_teachers WHERE subject_id = ?',
        [id],
      );
      const count = parseInt(mappingCount[0]?.cnt ?? '0', 10);
      if (count > 0) {
        throw new BadRequestException(
          `Cannot delete subject — it is mapped to ${count} class(es). ` +
            'Remove the class-subject mapping(s) first via DELETE /admin/class-subjects/remove/:id.',
        );
      }

      await this.subjectRepo.remove(subject);
      return { success: true, message: 'Subject deleted', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE ───────────────────────────────────

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
