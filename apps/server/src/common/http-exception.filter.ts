import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const msg = (res as any).message;
        message = Array.isArray(msg) ? msg : msg || exception.message;
      }
    } else if (exception instanceof Error) {
      // 未知异常：生产环境绝不可把内部细节（SQL / 表名 / 路径 / 堆栈）回显给客户端，
      // 仅返回通用错误，详细信息落服务端日志，避免信息泄露。
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      message = 'Internal server error';
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
