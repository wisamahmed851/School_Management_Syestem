import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ParentPortalService } from './parent-portal.service';
import { UserJwtAuthGuard } from 'src/auth/user/user-jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/users/entity/user.entity';

@Controller('user/parent')
@UseGuards(UserJwtAuthGuard, RolesGuard)
@Roles('parent')
export class ParentPortalController {
  constructor(private readonly parentPortalService: ParentPortalService) {}

  /**
   * GET /user/parent/children
   * Return all children linked to the authenticated guardian's profile.
   */
  @Get('children')
  getMyChildren(@CurrentUser() user: User) {
    return this.parentPortalService.getMyChildren(user.id);
  }

  /**
   * GET /user/parent/children/:student_id/attendance
   * Return the attendance history for one of the guardian's children.
   * Ownership is enforced server-side — returns 403 if the student
   * doesn't belong to this guardian.
   */
  @Get('children/:student_id/attendance')
  getChildAttendance(
    @CurrentUser() user: User,
    @Param('student_id', ParseIntPipe) studentId: number,
  ) {
    return this.parentPortalService.getChildAttendance(user.id, studentId);
  }

  /**
   * GET /user/parent/children/:student_id/assignments
   * Return all assignment submissions for one of the guardian's children,
   * including assignment title, due date, status, marks, and feedback.
   * Ownership is enforced server-side.
   */
  @Get('children/:student_id/assignments')
  getChildAssignments(
    @CurrentUser() user: User,
    @Param('student_id', ParseIntPipe) studentId: number,
  ) {
    return this.parentPortalService.getChildAssignments(user.id, studentId);
  }
}
