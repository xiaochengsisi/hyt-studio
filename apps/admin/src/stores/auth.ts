import { reactive } from 'vue';
import type { LoginPayload, User } from '@hyt/shared';
import { request } from '../api/client';

const TOKEN_KEY = 'hyt_admin_token';
const USER_KEY = 'hyt_admin_user';

export const auth = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null,
});

export function isLoggedIn() {
  return Boolean(auth.token);
}

export async function login(payload: LoginPayload) {
  const data = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  auth.token = data.token;
  auth.user = data.user;
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function logout() {
  auth.token = '';
  auth.user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}