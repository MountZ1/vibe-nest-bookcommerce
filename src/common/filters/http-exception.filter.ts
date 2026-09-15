import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as any).message || "Terjadi kesalahan";

    response.status(status).json({
      status: "error",
      message: Array.isArray(message) ? message[0] : message,
      data: null,
    });
  }
}
