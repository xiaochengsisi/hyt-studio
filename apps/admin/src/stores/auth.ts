import { reactive } from 'vue';
import type { LoginPayload, LoginResult, User } from '@hyt/shared';
import { request } from '../api/client';

// 仅缓存非敏感的会话展示信息（user / 是否需改密）；令牌本身由 httpOnly Cookie 保管，
// 不再写入 localStorage，规避 XSS 窃取令牌的风险。
const USER_KEY = 'hyt_admin_user';
const MCP_KEY = 'hyt_admin_mcp';

export const auth = reactive({
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null,
  mustChangePassword: localStorage.getItem(MCP_KEY) === '1',
});

export function isLoggedIn() {
  return Boolean(auth.user);
}

export async function login(payload: LoginPayload) {
  const data = await request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  auth.user = data.user;
  auth.mustChangePassword = Boolean(data.mustChangePassword);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(MCP_KEY, auth.mustChangePassword ? '1' : '0');
}

/** 首次登录强制改密：校验原密码后换取不含 mcp 的新令牌（Cookie 已由后端刷新） */
export async function changePassword(oldPassword: string, newPassword: string) {
  const data = await request<LoginResult>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  auth.user = data.user;
  auth.mustChangePassword = false;
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(MCP_KEY, '0');
}

/** 登出：调用后端清除 httpOnly Cookie，并清理本地缓存的会话展示信息 */
export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // 忽略网络错误：无论如何都要清理本地状态
  }
  auth.user = null;
  auth.mustChangePassword = false;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(MCP_KEY);
}

/** 应用启动时调用：用 Cookie 向 /auth/me 校验会话并恢复登录态 */
export async function restore() {
  try {
    const data = await request<User & { mcp?: boolean }>('/auth/me');
    auth.user = data as User;
    auth.mustChangePassword = Boolean((data as { mcp?: boolean }).mcp);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    localStorage.setItem(MCP_KEY, auth.mustChangePassword ? '1' : '0');
  } catch {
    auth.user = null;
    auth.mustChangePassword = false;
  }
}
