import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guardian } from 'src/guardian/entity/guardian.entity';
import { Student } from 'src/student/entity/student.entity';
import { Attendance } from 'src/attendance/entity/attendance.entity';
import { AssignmentSubmission } from 'src/assignment/entity/assignment-submission.entity';

@Injectable()
export class ParentPortalService {
  constructor(
    @InjectRepository(Guardian)
    private readonly guardianRepo: Repository<Guardian>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,

    @InjectRepository(AssignmentSubmission)
    private readonly submissionRepo: Repository<AssignmentSubmission>,
  ) {}

  // ─────────────────────────────── RESOLVE GUARDIAN ──────────────────────────

  /**
   * Look up the Guardian record that is linked to this User account.
   * Every parent portal method calls this first.
   * Throws ForbiddenException — not NotFoundException — so callers can't
   * enumerate whether a Guardian record exists at all.
   */
  private async resolveGuardian(userId: number): Promise<Guardian> {
    const guardian = await this.guardianRepo.findOne({
      where: { user_id: userId },
    });
    if (!guardian) {
      throw new ForbiddenException(
        'No guardian profile is linked to your account. ' +
          'Contact the school administration.',
      );
    }
    return guardian;
  }

  /**
   * Verify that a student belongs to this guardian.
   * Throws ForbiddenException if the check fails — never reveals that the
   * student exists under a different guardian.
   */
  private async verifyOwnership(
    guardianId: number,
    studentId: number,
  ): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, guardian_id: guardianId },
      relations: ['school_class'],
    });
    if (!student) {
      throw new ForbiddenException(
        'You do not have access to this student record.',
      );
    }
    return student;
  }

  // ─────────────────────────────── GET MY CHILDREN ───────────────────────────

  async getMyChildren(userId: number) {
    try {
      const guardian = await this.resolveGuardian(userId);

      const students = await this.studentRepo.find({
        where: { guardian_id: guardian.id },
        relations: ['school_class'],
        order: { name: 'ASC' },
      });

      // Return only the fields a parent should see — no internal audit fields
      const data = students.map((s) => ({
        id: s.id,
        name: s.name,
        roll_no: s.roll_no,
        gender: s.gender,
        dob: s.dob,
        identity_number: s.identity_number,
        admission_date: s.admission_date,
        status: s.status,
        class_id: s.class_id,
        class_name: s.school_class?.name ?? null,
        class_section: s.school_class?.section ?? null,
      }));

      return {
        success: true,
        message: `${data.length} child record(s) linked to your guardian profile`,
        data,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── GET CHILD ATTENDANCE ──────────────────────

  async getChildAttendance(userId: number, studentId: number) {
    try {
      const guardian = await this.resolveGuardian(userId);
      await this.verifyOwnership(guardian.id, studentId);

      const records = await this.attendanceRepo.find({
        where: { student_id: studentId },
        order: { date: 'DESC' },
      });

      // Summary counts
      const summary = records.reduce(
        (acc, r) => {
          acc[r.status] = (acc[r.status] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const data = records.map((r) => ({
        id: r.id,
        date: r.date,
        status: r.status,
        class_id: r.class_id,
      }));

      return {
        success: true,
        message: 'Attendance history',
        data: {
          student_id: studentId,
          total: records.length,
          summary: {
            present: summary['present'] ?? 0,
            absent: summary['absent'] ?? 0,
            late: summary['late'] ?? 0,
          },
          records: data,
        },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── GET CHILD ASSIGNMENTS ─────────────────────

  async getChildAssignments(userId: number, studentId: number) {
    try {
      const guardian = await this.resolveGuardian(userId);
      await this.verifyOwnership(guardian.id, studentId);

      const submissions = await this.submissionRepo
        .createQueryBuilder('sub')
        .leftJoin('sub.assignment', 'assignment')
        .leftJoin('assignment.subject', 'subject')
        .where('sub.student_id = :studentId', { studentId })
        .select([
          'sub.id',
          'sub.assignment_id',
          'sub.submitted_at',
          'sub.status',
          'sub.marks_obtained',
          'sub.feedback',
          'sub.created_at',
          // Assignment fields
          'assignment.id',
          'assignment.title',
          'assignment.description',
          'assignment.due_date',
          // Subject fields
          'subject.id',
          'subject.name',
          'subject.code',
        ])
        .orderBy('assignment.due_date', 'DESC')
        .getMany();

      const data = submissions.map((sub) => ({
        submission_id: sub.id,
        assignment_id: sub.assignment_id,
        assignment_title: (sub as any).assignment?.title ?? null,
        assignment_description: (sub as any).assignment?.description ?? null,
        due_date: (sub as any).assignment?.due_date ?? null,
        subject_name: (sub as any).assignment?.subject?.name ?? null,
        subject_code: (sub as any).assignment?.subject?.code ?? null,
        submitted_at: sub.submitted_at,
        status: sub.status,
        marks_obtained: sub.marks_obtained,
        feedback: sub.feedback,
      }));

      return {
        success: true,
        message: 'Assignment submissions',
        data: {
          student_id: studentId,
          total: data.length,
          submissions: data,
        },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE ───────────────────────────────────

  private handleUnknown(err: unknown): never {
    if (
      err instanceof ForbiddenException ||
      err instanceof NotFoundException
    ) {
      throw err;
    }
    throw new InternalServerErrorException('Unexpected error', {
      cause: err as Error,
    });
  }
}
