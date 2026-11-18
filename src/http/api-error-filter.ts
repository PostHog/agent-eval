import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";
import { ZodError } from "zod";

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (error instanceof ZodError)
      response.status(400).json({
        message: error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      });
    else if (error instanceof HttpException)
      response.status(error.getStatus()).json({ message: error.message });
    else if (error instanceof Prisma.PrismaClientKnownRequestError)
      response.status(error.code === "P2025" ? 404 : 409).json({
        message:
          error.code === "P2003"
            ? "This resource is in use or no longer exists."
            : "The saved data changed. Reload the page. Then try again.",
      });
    else
      response.status(400).json({
        message: error instanceof Error ? error.message : "The request failed.",
      });
  }
}
