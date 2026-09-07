import { Injectable } from '@nestjs/common';
import { EffectivePermissionsService } from 'src/common/services/permissions.service';
import {
  SIDEBAR_MENU,
  SidebarItem,
  isGroup,
  SidebarLeafItem,
  SidebarGroupItem,
} from 'src/common/config/sidebar-menu.config';

/** Shape returned to the frontend — no internal "permission" metadata leaked. */
export interface MenuLeaf {
  label: string;
  route: string;
}

export interface MenuGroup {
  label: string;
  children: MenuLeaf[];
}

export type MenuItem = MenuLeaf | MenuGroup;

@Injectable()
export class SidebarService {
  constructor(
    private readonly effectivePermissionsService: EffectivePermissionsService,
  ) {}

  async getMenuForAdmin(adminId: number): Promise<MenuItem[]> {
    // Resolve this admin's full effective permission set
    const granted = await this.effectivePermissionsService.getEffectivePermissions(
      adminId,
    );
    const grantedSet = new Set(granted);

    const result: MenuItem[] = [];

    for (const item of SIDEBAR_MENU) {
      if (isGroup(item)) {
        // Filter children — keep only those whose permission is satisfied
        const visibleChildren: MenuLeaf[] = item.children
          .filter(
            (child: SidebarLeafItem) =>
              child.permission === null || grantedSet.has(child.permission),
          )
          .map((child: SidebarLeafItem) => ({
            // ✅ Strip the internal "permission" key — not needed by frontend
            label: child.label,
            route: child.route,
          }));

        // Drop the parent group entirely if no children survived
        if (visibleChildren.length > 0) {
          result.push({ label: item.label, children: visibleChildren });
        }
      } else {
        const leaf = item as SidebarLeafItem;
        if (leaf.permission === null || grantedSet.has(leaf.permission)) {
          // ✅ Strip the internal "permission" key
          result.push({ label: leaf.label, route: leaf.route });
        }
      }
    }

    return result;
  }
}
