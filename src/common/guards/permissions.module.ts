import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { EffectivePermissionsService } from '../services/permissions.service';

/**
 * Global module — both PermissionsGuard and EffectivePermissionsService are
 * exported globally. DataSource is provided by TypeOrmModule.forRootAsync in
 * AppModule, so no repository imports are needed here.
 */
@Global()
@Module({
  providers: [PermissionsGuard, EffectivePermissionsService],
  exports: [PermissionsGuard, EffectivePermissionsService],
})
export class PermissionsGuardModule {}
