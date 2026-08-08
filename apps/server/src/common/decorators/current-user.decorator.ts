import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  id: number;
  username: string;
  role: string;
}

/** Extract the authenticated user from the request. */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext): JwtUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser | undefined;
    return data && user ? (user as any)[data] : user;
  },
);