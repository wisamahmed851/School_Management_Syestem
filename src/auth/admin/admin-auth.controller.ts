import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { AdminJwtAuthGuard } from './admin-jwt.guard';
import { SidebarService } from 'src/sidebar/sidebar.service';
import { EffectivePermissionsService } from 'src/common/services/permissions.service';

@Controller('admin')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly sidebarService: SidebarService,
    private readonly effectivePermissionsService: EffectivePermissionsService,
  ) {}

  @HttpCode(200)
  @Post('login')
  async login(@Body() body: AdminLoginDto) {
    const admin = await this.adminAuthService.validateEmail(
      body.email,
      body.password,
    );
    return this.adminAuthService.login(admin);
  }

  @HttpCode(200)
  @Get('profile')
  @UseGuards(AdminJwtAuthGuard)
  profileGet(@Req() req: any) {
    return this.adminAuthService.getProfile(req.user);
  }

  @HttpCode(200)
  @Post('change-password')
  @UseGuards(AdminJwtAuthGuard)
  changePassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: any,
  ) {
    return this.adminAuthService.passwordChange(body, req.user);
  }

  @HttpCode(200)
  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  logout(@Req() req: any) {
    return this.adminAuthService.logout(req.user);
  }

  /**
   * GET /admin/sidebar
   * Dynamically filtered sidebar menu for the authenticated admin.
   * Items are shown only if the admin holds the required permission.
   * Permission keys are stripped from the response — frontend gets
   * only { label, route } / { label, children[] }.
   */
  @Get('sidebar')
  @UseGuards(AdminJwtAuthGuard)
  async getSidebar(@Req() req: any) {
    const data = await this.sidebarService.getMenuForAdmin(req.user.id);
    return {
      success: true,
      message: 'Sidebar menu fetched',
      data,
    };
  }

  /**
   * GET /admin/me/permissions
   * Full flat array of every permission name the authenticated admin holds,
   * combining direct grants (AdminPermission) and role-based grants
   * (AdminRole → RolePermission → Permission).
   *
   * The frontend uses this to show/hide Create, Edit, Delete, ToggleStatus
   * buttons on individual pages — separate from sidebar visibility.
   *
   * No @RequirePermission — every authenticated admin can call this.
   */
  @Get('me/permissions')
  @UseGuards(AdminJwtAuthGuard)
  async getMyPermissions(@Req() req: any) {
    const permissions =
      await this.effectivePermissionsService.getEffectivePermissions(
        req.user.id,
      );
    return {
      success: true,
      message: 'Permissions fetched',
      data: permissions,
    };
  }
}
