import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  status: string;
  message: string;
  meta?: any;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((response: any) => {
        if (response && typeof response === "object" && "data" in response && "meta" in response) {
          return {
            status: "ok",
            message: "Success",
            meta: response.meta,
            data: response.data,
          };
        }

        return {
          status: "ok",
          message: "Success",
          data: response ?? null,
        };
      }),
    );
  }
}
