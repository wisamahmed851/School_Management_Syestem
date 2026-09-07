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
import { AssignmentService } from './assignment.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  UpdateSubmissionDto,
} from './dtos/assignment.dto';
import { UserJwtAuthGuard } from 'src/auth/user/user-jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/users/entity/user.entity';

@Controller('user/teacher/assignments')
@UseGuards(UserJwtAuthGuard, RolesGuard)
@Roles('teacher')
export class TeacherAssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  /**
   * POST /user/teacher/assignments/store
   * Create an assignment for a class the teacher is mapped to teach.
   * subject_id is required. teacher_id in the body is ignored — always set
   * server-side to the calling teacher's id.
   */
  @Post('store')
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: User) {
    return this.assignmentService.createByTeacher(dto, user.id);
  }

  /**
   * GET /user/teacher/assignments/index
   * List all assignments where teacher_id = this teacher.
   */
  @Get('index')
  findAll(@CurrentUser() user: User) {
    return this.assignmentService.getMyAssignments(user.id);
  }

  /**
   * GET /user/teacher/assignments/findOne/:id
   * Get a single assignment (with full submission list) — ownership enforced.
   */
  @Get('findOne/:id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.assignmentService.findOneByTeacher(id, user.id);
  }

  /**
   * PUT /user/teacher/assignments/update/:id
   * Update title, description, or due_date — class/subject/teacher locked.
   * Ownership enforced.
   */
  @Put('update/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser() user: User,
  ) {
    return this.assignmentService.updateByTeacher(id, dto, user.id);
  }

  /**
   * DELETE /user/teacher/assignments/remove/:id
   * Delete an assignment the teacher owns. Cascades to all submission rows.
   */
  @Delete('remove/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.assignmentService.removeByTeacher(id, user.id);
  }

  /**
   * PUT /user/teacher/assignments/submissions/update/:submissionId
   * Grade a student's submission — teacher must own the parent assignment.
   * Valid status: pending | submitted | late | graded.
   */
  @Put('submissions/update/:submissionId')
  gradeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser() user: User,
  ) {
    return this.assignmentService.gradeSubmissionByTeacher(
      submissionId,
      dto,
      user.id,
    );
  }
}
