import { Module } from '@nestjs/common';
import { SidebarService } from './sidebar.service';
import { EffectivePermissionsService } from 'src/common/services/permissions.service';

@Module({
  providers: [SidebarService, EffectivePermissionsService],
  exports: [SidebarService],
})
export class SidebarModule {}
