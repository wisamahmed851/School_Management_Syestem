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

@Controller('admin')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly sidebarService: SidebarService,
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
   * GET /admin/me/menu
   *
   * Returns both:
   *   permissions — flat array of every permission name this admin holds
   *                 (direct + via roles). Used for one-off frontend checks.
   *   menu        — filtered sidebar where each visible leaf has an "actions"
   *                 object showing exactly which actions this admin can perform.
   *
   * Visibility rule: a menu item is shown if the admin holds ANY permission
   * for that module (not just .index). Having only guardians.update still
   * shows the Guardians entry with actions.update = true.
   *
   * No @RequirePermission — every authenticated admin can call this.
   */
  @Get('me/menu')
  @UseGuards(AdminJwtAuthGuard)
  async getMyMenu(@Req() req: any) {
    const result = await this.sidebarService.buildMenu(req.user.id);
    return {
      success: true,
      message: 'Menu fetched',
      data: result,
    };
  }
}
