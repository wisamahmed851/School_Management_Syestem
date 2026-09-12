import { Injectable } from '@nestjs/common';
import { EffectivePermissionsService } from 'src/common/services/permissions.service';
import {
  SIDEBAR_MENU,
  SidebarItem,
  SidebarLeafItem,
  SidebarGroupItem,
  isGroup,
} from 'src/common/config/sidebar-menu.config';

export interface MenuAction {
  [action: string]: boolean;
}

export interface MenuLeaf {
  label: string;
  route: string;
  actions: MenuAction;
}

export interface MenuGroup {
  label: string;
  children: MenuLeaf[];
}

export type MenuItem = MenuLeaf | MenuGroup;

export interface MenuResult {
  permissions: string[];
  menu: MenuItem[];
}

@Injectable()
export class SidebarService {
  constructor(
    private readonly effectivePermissionsService: EffectivePermissionsService,
  ) {}

  async buildMenu(adminId: number): Promise<MenuResult> {
    // Fetch the admin's full effective permission set once
    const granted = await this.effectivePermissionsService.getEffectivePermissions(adminId);
    const grantedSet = new Set(granted);

    const menu: MenuItem[] = [];

    for (const item of SIDEBAR_MENU) {
      if (isGroup(item)) {
        const visibleChildren: MenuLeaf[] = [];

        for (const child of item.children) {
          const leaf = child as SidebarLeafItem;
          const visible = this.isLeafVisible(leaf, grantedSet);
          if (visible) {
            visibleChildren.push(this.buildLeaf(leaf, grantedSet));
          }
        }

        // Drop the group entirely if no children survived
        if (visibleChildren.length > 0) {
          menu.push({ label: item.label, children: visibleChildren } as MenuGroup);
        }
      } else {
        const leaf = item as SidebarLeafItem;
        if (this.isLeafVisible(leaf, grantedSet)) {
          menu.push(this.buildLeaf(leaf, grantedSet));
        }
      }
    }

    return { permissions: granted, menu };
  }

  // ── VISIBILITY RULE ───────────────────────────────────────────────────────
  // module: null  → always visible (Dashboard)
  // otherwise     → visible if the admin holds ANY permission for that module
  //                 (not restricted to .index — e.g. guardians.update is enough)
  private isLeafVisible(leaf: SidebarLeafItem, granted: Set<string>): boolean {
    if (leaf.module === null) return true;
    return leaf.actions.some((action) => granted.has(`${leaf.module}.${action}`));
  }

  // ── ACTIONS OBJECT ────────────────────────────────────────────────────────
  // For every action declared in leaf.actions, set the boolean to whether
  // this admin actually holds that specific permission name.
  private buildLeaf(leaf: SidebarLeafItem, granted: Set<string>): MenuLeaf {
    const actions: MenuAction = {};

    if (leaf.module !== null) {
      for (const action of leaf.actions) {
        actions[action] = granted.has(`${leaf.module}.${action}`);
      }
    }

    return { label: leaf.label, route: leaf.route, actions };
  }
}
