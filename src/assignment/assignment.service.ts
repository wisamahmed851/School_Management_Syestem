import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entity/assignment.entity';
import {
  AssignmentSubmission,
  SubmissionStatus,
} from './entity/assignment-submission.entity';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  UpdateSubmissionDto,
} from './dtos/assignment.dto';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Student } from 'src/student/entity/student.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';
import { ClassSubjectTeacher } from 'src/class-subject/entity/class-subject-teacher.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,

    @InjectRepository(AssignmentSubmission)
    private readonly submissionRepo: Repository<AssignmentSubmission>,

    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,

    @InjectRepository(ClassSubjectTeacher)
    private readonly classSubjectRepo: Repository<ClassSubjectTeacher>,
  ) {}

  // ─────────────────────────────── CREATE ────────────────────────────────────

  async create(dto: CreateAssignmentDto) {
    try {
      // 1. Validate required FK: class must exist
      const schoolClass = await this.classRepo.findOne({
        where: { id: dto.class_id },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${dto.class_id} not found`,
        );
      }

      // 2. Validate optional FK: teacher (if provided)
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

      // 3. Validate subject_id: if provided, the subject must be mapped to this class
      //    via a ClassSubjectTeacher record — not just exist in isolation.
      if (dto.subject_id !== undefined) {
        const mapping = await this.classSubjectRepo.findOne({
          where: { class_id: dto.class_id, subject_id: dto.subject_id },
        });
        if (!mapping) {
          throw new BadRequestException(
            `Subject id ${dto.subject_id} is not mapped to class id ${dto.class_id}. ` +
              'Create the mapping first via POST /admin/class-subjects/store.',
          );
        }
      }

      // 3. Create and persist the Assignment
      const assignment = this.assignmentRepo.create({
        class_id: dto.class_id,
        subject_id: dto.subject_id,
        teacher_id: dto.teacher_id,
        title: dto.title,
        description: dto.description,
        due_date: dto.due_date,
      });
      const savedAssignment = await this.assignmentRepo.save(assignment);

      // 4. Auto-generate a pending AssignmentSubmission for every student
      //    currently enrolled in this class
      const studentsInClass = await this.studentRepo.find({
        where: { class_id: dto.class_id },
        select: { id: true, name: true },
      });

      if (studentsInClass.length > 0) {
        const submissions = studentsInClass.map((student) =>
          this.submissionRepo.create({
            assignment_id: savedAssignment.id,
            student_id: student.id,
            status: SubmissionStatus.PENDING,
          }),
        );
        await this.submissionRepo.save(submissions);
      }

      // Return the full assignment with submissions
      const full = await this.fetchWithSubmissions(savedAssignment.id);
      return {
        success: true,
        message: `Assignment created. ${studentsInClass.length} submission record(s) auto-generated.`,
        data: full,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ALL ──────────────────────────────────

  async findAll() {
    try {
      const assignments = await this.assignmentRepo.find({
        relations: ['school_class', 'teacher'],
        order: { due_date: 'ASC', id: 'ASC' },
      });

      const data = assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        subject_id: a.subject_id,
        class_id: a.class_id,
        class_name: a.school_class?.name ?? null,
        teacher_id: a.teacher_id,
        teacher_name: a.teacher?.name ?? null,
        created_at: a.created_at,
        updated_at: a.updated_at,
      }));

      return { success: true, message: 'Assignment list', data };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ONE ──────────────────────────────────

  async findOne(id: number) {
    try {
      const assignment = await this.fetchWithSubmissions(id);
      return { success: true, message: 'Assignment fetched', data: assignment };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE ────────────────────────────────────

  async update(id: number, dto: UpdateAssignmentDto) {
    try {
      const assignment = await this.assignmentRepo.findOne({ where: { id } });
      if (!assignment) throw new NotFoundException('Assignment not found');

      // Re-validate FKs only when changed
      if (dto.class_id !== undefined && dto.class_id !== assignment.class_id) {
        const cls = await this.classRepo.findOne({ where: { id: dto.class_id } });
        if (!cls) {
          throw new NotFoundException(
            `SchoolClass with id ${dto.class_id} not found`,
          );
        }
      }

      if (dto.teacher_id !== undefined && dto.teacher_id !== assignment.teacher_id) {
        const teacher = await this.teacherRepo.findOne({
          where: { id: dto.teacher_id },
        });
        if (!teacher) {
          throw new NotFoundException(
            `Teacher with id ${dto.teacher_id} not found`,
          );
        }
      }

      Object.assign(assignment, dto);
      const saved = await this.assignmentRepo.save(assignment);
      const full = await this.fetchWithSubmissions(saved.id);
      return { success: true, message: 'Assignment updated', data: full };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── REMOVE ────────────────────────────────────

  async remove(id: number) {
    try {
      const assignment = await this.assignmentRepo.findOne({ where: { id } });
      if (!assignment) throw new NotFoundException('Assignment not found');

      // Submissions are deleted automatically via onDelete: 'CASCADE' on the FK
      await this.assignmentRepo.remove(assignment);
      return { success: true, message: 'Assignment deleted', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE SUBMISSION ─────────────────────────

  async updateSubmission(submissionId: number, dto: UpdateSubmissionDto) {
    try {
      const submission = await this.submissionRepo.findOne({
        where: { id: submissionId },
      });
      if (!submission) {
        throw new NotFoundException(
          `Submission with id ${submissionId} not found`,
        );
      }

      // Auto-set submitted_at when status moves to submitted/graded
      if (
        dto.status === SubmissionStatus.SUBMITTED ||
        dto.status === SubmissionStatus.GRADED ||
        dto.status === SubmissionStatus.LATE
      ) {
        if (!submission.submitted_at) {
          submission.submitted_at = new Date().toISOString().split('T')[0];
        }
      }

      Object.assign(submission, dto);
      const saved = await this.submissionRepo.save(submission);
      return {
        success: true,
        message: 'Submission updated',
        data: saved,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: CREATE ────────────────────────────

  /**
   * Teacher creates an assignment for a class they teach.
   * Ownership rule: a ClassSubjectTeacher record with
   *   class_id = dto.class_id AND subject_id = dto.subject_id AND teacher_id = teacher.id
   * must exist — the teacher must be specifically assigned to teach that subject
   * in that class.
   * teacher_id on the saved Assignment is always forced to teacher.id — the
   * client value is intentionally ignored.
   */
  async createByTeacher(dto: CreateAssignmentDto, teacherUserId: number) {
    try {
      const teacher = await this.resolveTeacherByUser(teacherUserId);

      // subject_id is required when creating via teacher portal
      if (!dto.subject_id) {
        throw new BadRequestException(
          'subject_id is required when creating an assignment as a teacher.',
        );
      }

      // Validate class exists
      const schoolClass = await this.classRepo.findOne({
        where: { id: dto.class_id },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `SchoolClass with id ${dto.class_id} not found`,
        );
      }

      // Verify the teacher teaches this subject in this class
      const mapping = await this.classSubjectRepo.findOne({
        where: {
          class_id: dto.class_id,
          subject_id: dto.subject_id,
          teacher_id: teacher.id,
        },
      });
      if (!mapping) {
        throw new ForbiddenException(
          `You do not teach subject id ${dto.subject_id} in class '${schoolClass.name}'. ` +
            'Ensure the class-subject mapping exists and is assigned to you via ' +
            'PUT /admin/class-subjects/update/:id.',
        );
      }

      // Force teacher_id — never trust the client
      const assignment = this.assignmentRepo.create({
        class_id: dto.class_id,
        subject_id: dto.subject_id,
        teacher_id: teacher.id,   // ← always overridden
        title: dto.title,
        description: dto.description,
        due_date: dto.due_date,
      });
      const savedAssignment = await this.assignmentRepo.save(assignment);

      const studentsInClass = await this.studentRepo.find({
        where: { class_id: dto.class_id },
        select: { id: true, name: true },
      });

      if (studentsInClass.length > 0) {
        const submissions = studentsInClass.map((s) =>
          this.submissionRepo.create({
            assignment_id: savedAssignment.id,
            student_id: s.id,
            status: SubmissionStatus.PENDING,
          }),
        );
        await this.submissionRepo.save(submissions);
      }

      const full = await this.fetchWithSubmissions(savedAssignment.id);
      return {
        success: true,
        message: `Assignment created. ${studentsInClass.length} submission record(s) auto-generated.`,
        data: full,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: GET MY ASSIGNMENTS ─────────────────

  async getMyAssignments(teacherUserId: number) {
    try {
      const teacher = await this.resolveTeacherByUser(teacherUserId);

      const assignments = await this.assignmentRepo.find({
        where: { teacher_id: teacher.id },
        relations: ['school_class', 'subject'],
        order: { due_date: 'ASC', id: 'ASC' },
      });

      const data = assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        subject_id: a.subject_id,
        subject_name: (a as any).subject?.name ?? null,
        class_id: a.class_id,
        class_name: a.school_class?.name ?? null,
        created_at: a.created_at,
        updated_at: a.updated_at,
      }));

      return {
        success: true,
        message: `${data.length} assignment(s) assigned to you`,
        data,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: FIND ONE ───────────────────────────

  async findOneByTeacher(id: number, teacherUserId: number) {
    try {
      const teacher = await this.resolveTeacherByUser(teacherUserId);
      await this.assertTeacherOwnsAssignment(id, teacher.id);
      const full = await this.fetchWithSubmissions(id);
      return { success: true, message: 'Assignment fetched', data: full };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: UPDATE ─────────────────────────────

  async updateByTeacher(id: number, dto: UpdateAssignmentDto, teacherUserId: number) {
    try {
      const teacher = await this.resolveTeacherByUser(teacherUserId);
      const assignment = await this.assertTeacherOwnsAssignment(id, teacher.id);

      // Teachers may only update title, description, due_date.
      // class_id, subject_id, teacher_id are locked after creation.
      const safeDto: Partial<UpdateAssignmentDto> = {};
      if (dto.title !== undefined)       safeDto.title = dto.title;
      if (dto.description !== undefined) safeDto.description = dto.description;
      if (dto.due_date !== undefined)    safeDto.due_date = dto.due_date;

      Object.assign(assignment, safeDto);
      const saved = await this.assignmentRepo.save(assignment);
      const full = await this.fetchWithSubmissions(saved.id);
      return { success: true, message: 'Assignment updated', data: full };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: REMOVE ─────────────────────────────

  async removeByTeacher(id: number, teacherUserId: number) {
    try {
      const teacher = await this.resolveTeacherByUser(teacherUserId);
      const assignment = await this.assertTeacherOwnsAssignment(id, teacher.id);

      await this.assignmentRepo.remove(assignment);
      return { success: true, message: 'Assignment deleted', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TEACHER: GRADE SUBMISSION ───────────────────

  /**
   * Teacher grades a submission — verifies the submission's parent assignment
   * belongs to this teacher before allowing any update.
   */
  async gradeSubmissionByTeacher(
    submissionId: number,
    dto: UpdateSubmissionDto,
    teacherUserId: number,
  ) {
    try {
      const teacher = await this.resolveTeacherByUser(teacherUserId);

      const submission = await this.submissionRepo.findOne({
        where: { id: submissionId },
      });
      if (!submission) {
        throw new NotFoundException(
          `Submission with id ${submissionId} not found`,
        );
      }

      // Verify the parent assignment belongs to this teacher
      await this.assertTeacherOwnsAssignment(
        submission.assignment_id,
        teacher.id,
      );

      if (
        dto.status === SubmissionStatus.SUBMITTED ||
        dto.status === SubmissionStatus.GRADED ||
        dto.status === SubmissionStatus.LATE
      ) {
        if (!submission.submitted_at) {
          submission.submitted_at = new Date().toISOString().split('T')[0];
        }
      }

      Object.assign(submission, dto);
      const saved = await this.submissionRepo.save(submission);
      return { success: true, message: 'Submission updated', data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE HELPERS ─────────────────────────────

  /** Resolve a Teacher record by their linked User id. Throws ForbiddenException if none. */
  private async resolveTeacherByUser(userId: number): Promise<import('src/teacher/entity/teacher.entity').Teacher> {
    const teacher = await this.teacherRepo.findOne({ where: { user_id: userId } });
    if (!teacher) {
      throw new ForbiddenException(
        'No teacher profile is linked to your account. ' +
          'Contact the school administration.',
      );
    }
    return teacher;
  }

  /**
   * Load an Assignment and verify it belongs to the given teacher.
   * Returns the Assignment entity if ownership passes.
   * Throws NotFoundException if the assignment doesn't exist,
   * ForbiddenException if it belongs to a different teacher.
   */
  private async assertTeacherOwnsAssignment(
    assignmentId: number,
    teacherId: number,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with id ${assignmentId} not found`);
    }
    if (assignment.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You do not have permission to modify this assignment.',
      );
    }
    return assignment;
  }

  // ─────────────────────────────── PRIVATE HELPERS (existing) ──────────────────

  /**
   * Fetch an assignment with its class, teacher, and all submission rows.
   * Each submission row includes the student's name and roll_no.
   */
  private async fetchWithSubmissions(id: number) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id },
      relations: ['school_class', 'teacher'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const submissions = await this.submissionRepo
      .createQueryBuilder('sub')
      .leftJoin('sub.student', 'student')
      .where('sub.assignment_id = :id', { id })
      .select([
        'sub.id',
        'sub.assignment_id',
        'sub.student_id',
        'sub.submitted_at',
        'sub.status',
        'sub.marks_obtained',
        'sub.feedback',
        'sub.created_at',
        'sub.updated_at',
        'student.id',
        'student.name',
        'student.roll_no',
      ])
      .orderBy('student.name', 'ASC')
      .getMany();

    const { school_class, teacher, ...assignmentRest } = assignment;

    return {
      ...assignmentRest,
      class_name: school_class?.name ?? null,
      teacher_name: teacher?.name ?? null,
      submissions_count: submissions.length,
      submissions,
    };
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
