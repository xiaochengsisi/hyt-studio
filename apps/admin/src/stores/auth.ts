import { reactive } from 'vue';
import type { LoginPayload, LoginResult, User } from '@hyt/shared';
import { request } from '../api/client';

const TOKEN_KEY = 'hyt_admin_token';
const USER_KEY = 'hyt_admin_user';
const MCP_KEY = 'hyt_admin_mcp';

export const auth = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null,
  mustChangePassword: localStorage.getItem(MCP_KEY) === '1',
});

export function isLoggedIn() {
  return Boolean(auth.token);
}

export async function login(payload: LoginPayload) {
  const data = await request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  auth.token = data.token;
  auth.user = data.user;
  auth.mustChangePassword = Boolean(data.mustChangePassword);
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(MCP_KEY, auth.mustChangePassword ? '1' : '0');
}

/** 首次登录强制改密：校验原密码后换取不含 mcp 的新令牌 */
export async function changePassword(oldPassword: string, newPassword: string) {
  const data = await request<LoginResult>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  auth.token = data.token;
  auth.user = data.user;
  auth.mustChangePassword = false;
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(MCP_KEY, '0');
}

export function logout() {
  auth.token = '';
  auth.user = null;
  auth.mustChangePassword = false;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(MCP_KEY);
}
