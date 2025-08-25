import { Response } from 'express';
import { Result } from '@common/result/result';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { StdResponse } from '@common/std-response/std-response';
import { StdStatus } from '@common/std-response/std-status';

export abstract class BaseHttpController {
  protected respond(
    response: Response,
    result: Result<any>,
    customStatus?: HttpStatus,
  ) {
    const stdResponse = StdResponse.fromResult<any, any>(result);
    const status = customStatus ?? this.fromStdStatus(stdResponse.status);

    response.status(status).send(stdResponse);
  }

  private fromStdStatus(status: StdStatus): HttpStatus {
    switch (status) {
      case StdStatus.SUCCESS:
        return HttpStatus.OK;
      case StdStatus.INVALID_ARGUMENT:
        return HttpStatus.BAD_REQUEST;
      case StdStatus.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case StdStatus.UNAUTHENTICATED:
        return HttpStatus.UNAUTHORIZED;
      case StdStatus.PERMISSION_DENIED:
        return HttpStatus.FORBIDDEN;
      case StdStatus.VALIDATION_FAILURE:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case StdStatus.ALREADY_EXISTS:
        return HttpStatus.CONFLICT;
      case StdStatus.INTERNAL_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        // This will throw a compile time error if any case isn't handled
        return status;
    }
  }
}
