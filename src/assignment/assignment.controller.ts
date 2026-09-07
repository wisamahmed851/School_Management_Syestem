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
import { CreateAssignmentDto, UpdateAssignmentDto, UpdateSubmissionDto } from './dtos/assignment.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/assignments')
@UseGuards(AdminJwtAuthGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('assignments.create')
  create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentService.create(dto);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('assignments.index')
  findAll() {
    return this.assignmentService.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('assignments.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('assignments.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAssignmentDto) {
    return this.assignmentService.update(id, dto);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('assignments.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.remove(id);
  }

  @Put('submissions/update/:submissionId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('assignments.gradeSubmission')
  updateSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: UpdateSubmissionDto,
  ) {
    return this.assignmentService.updateSubmission(submissionId, dto);
  }
}
