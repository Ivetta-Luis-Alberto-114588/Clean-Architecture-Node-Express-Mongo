// src/configs/roles.ts

export const USER_ROLES = {
    USER: 'USER_ROLE',
    ADMIN: 'ADMIN_ROLE',
    SUPER_ADMIN: 'SUPER_ADMIN_ROLE'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ALL_ROLES = Object.values(USER_ROLES);

// Helpers para validaciones
export const isValidRole = (role: string): role is UserRole => {
    return ALL_ROLES.includes(role as UserRole);
};

export const hasAdminAccess = (roles: string[]): boolean => {
    return roles.some(role =>
        role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN
    );
};

export const hasSuperAdminAccess = (roles: string[]): boolean => {
    return roles.includes(USER_ROLES.SUPER_ADMIN);
};

// Arrays para usar en middlewares
export const ADMIN_ROLES = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
export const SUPER_ADMIN_ONLY = [USER_ROLES.SUPER_ADMIN];
export const ALL_USER_ROLES = [USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
