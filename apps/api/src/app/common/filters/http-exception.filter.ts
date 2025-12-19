import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = typeof res === 'string' ? res : (res as any)?.message;
      response.status(status).json({
        statusCode: status,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      message: 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
