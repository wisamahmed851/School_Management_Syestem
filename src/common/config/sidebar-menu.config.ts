/**
 * Static sidebar menu configuration for the admin panel.
 *
 * Each leaf item declares the exact permission name required to see it.
 * These names MUST match what is seeded by PermissionsSeederService —
 * they are derived directly from the @RequirePermission() decorators
 * applied to every /admin/* controller route.
 *
 * Filtering rules (applied in SidebarService.getMenuForAdmin):
 *  - permission: null  → always shown to any authenticated admin
 *  - permission: <str> → shown only if admin's effective permissions include it
 *  - parent groups     → shown only if at least one child survives filtering
 */

export interface SidebarLeafItem {
  label: string;
  route: string;
  permission: string | null;
}

export interface SidebarGroupItem {
  label: string;
  children: SidebarLeafItem[];
}

export type SidebarItem = SidebarLeafItem | SidebarGroupItem;

export function isGroup(item: SidebarItem): item is SidebarGroupItem {
  return 'children' in item;
}

export const SIDEBAR_MENU: SidebarItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    permission: null, // always visible to any logged-in admin
  },
  {
    label: 'User Management',
    children: [
      { label: 'Admins',       route: '/admins',       permission: 'admins.index'       },
      { label: 'Users',        route: '/users',         permission: 'users.index'        },
      { label: 'Roles',        route: '/roles',         permission: 'roles.index'        },
      { label: 'Permissions',  route: '/permissions',   permission: 'permissions.index'  },
    ],
  },
  {
    label: 'Academics',
    children: [
      { label: 'Classes',              route: '/classes',        permission: 'classes.index'        },
      { label: 'Subjects',             route: '/subjects',       permission: 'subjects.index'       },
      { label: 'Class-Subject-Teacher',route: '/class-subjects', permission: 'class-subjects.index' },
      { label: 'Teachers',             route: '/teachers',       permission: 'teachers.index'       },
      { label: 'Guardians',            route: '/guardians',      permission: 'guardians.index'      },
      { label: 'Students',             route: '/students',       permission: 'students.index'       },
    ],
  },
  {
    label: 'Operations',
    children: [
      { label: 'Attendance',  route: '/attendance',  permission: 'attendance.index'  },
      { label: 'Assignments', route: '/assignments', permission: 'assignments.index' },
    ],
  },
];
