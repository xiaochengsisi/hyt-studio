import { SetMetadata } from '@nestjs/common';

export const ALLOW_MCP_KEY = 'allowMcp';
/**
 * 标记接口在「首次登录强制改密」状态下也可访问。
 * 仅用于改密相关接口，其余接口在 mcp=true 时会被 guard 拦截。
 */
export const AllowPasswordChange = () => SetMetadata(ALLOW_MCP_KEY, true);
