/**
 * Static sidebar menu configuration for the admin panel.
 *
 * Each leaf item declares:
 *   - module: the permission module key (e.g. 'guardians') — used to determine
 *             both visibility (any permission for this module) and the actions
 *             object attached to the response
 *   - actions: the exhaustive list of actions that actually exist for this module,
 *              derived directly from ADMIN_PERMISSIONS in permissions-seeder.service.ts.
 *              Do NOT add actions here that are not seeded — they would always be false.
 *
 * Visibility rule (applied in SidebarService.buildMenu):
 *   - permission: null  → always visible to any logged-in admin (Dashboard)
 *   - otherwise         → visible if the admin has ANY permission whose name
 *                         starts with '<module>.' (not just .index specifically)
 *   - parent groups     → visible if at least one child survives
 */

export interface SidebarLeafItem {
  label: string;
  route: string;
  module: string | null;   // null = always visible (Dashboard)
  actions: string[];        // exhaustive list of seeded actions for this module
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
    module: null,
    actions: [],
  },
  {
    label: 'User Management',
    children: [
      {
        label: 'Admins', route: '/admins', module: 'admins',
        actions: ['create', 'index', 'findOne', 'update', 'toggleStatus', 'remove'],
      },
      {
        label: 'Users', route: '/users', module: 'users',
        actions: ['create', 'index', 'findOne', 'update', 'toggleStatus'],
      },
      {
        label: 'Roles', route: '/roles', module: 'roles',
        actions: ['create', 'index', 'findOne', 'update', 'toggleStatus', 'remove'],
      },
      {
        label: 'Permissions', route: '/permissions', module: 'permissions',
        actions: ['create', 'index', 'findOne', 'update', 'toggleStatus', 'remove'],
      },
    ],
  },
  {
    label: 'Academics',
    children: [
      {
        label: 'Classes', route: '/classes', module: 'classes',
        actions: ['create', 'index', 'findOne', 'update', 'toggleStatus', 'remove'],
      },
      {
        label: 'Subjects', route: '/subjects', module: 'subjects',
        actions: ['create', 'index', 'findOne', 'update', 'toggleStatus', 'remove'],
      },
      {
        label: 'Class-Subject-Teacher', route: '/class-subjects', module: 'class-subjects',
        actions: ['create', 'index', 'update', 'remove'],
      },
      {
        label: 'Teachers', route: '/teachers', module: 'teachers',
        actions: ['create', 'index', 'findOne', 'update', 'toggleStatus', 'remove'],
      },
      {
        // guardians has NO toggleStatus — intentionally absent from actions list
        label: 'Guardians', route: '/guardians', module: 'guardians',
        actions: ['create', 'index', 'findOne', 'update', 'remove'],
      },
      {
        label: 'Students', route: '/students', module: 'students',
        actions: ['create', 'index', 'findOne', 'update', 'toggleStatus', 'remove'],
      },
    ],
  },
  {
    label: 'Operations',
    children: [
      {
        // attendance has non-standard actions: mark (not create), no findOne, no remove
        label: 'Attendance', route: '/attendance', module: 'attendance',
        actions: ['mark', 'index', 'update'],
      },
      {
        // assignments has gradeSubmission instead of a generic "grade"
        label: 'Assignments', route: '/assignments', module: 'assignments',
        actions: ['create', 'index', 'findOne', 'update', 'remove', 'gradeSubmission'],
      },
    ],
  },
];
