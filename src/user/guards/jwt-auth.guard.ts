// user/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  // Override optional: kalau mau custom error message saat token invalid/expired
  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException("Invalid or expired token");
    }
    return user;
  }
}
