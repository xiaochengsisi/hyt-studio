import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** 标记接口所需的角色，需配合全局 RolesGuard 使用。 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
