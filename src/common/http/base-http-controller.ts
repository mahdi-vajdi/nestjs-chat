import { Response } from 'express';
import { Result } from '@common/result/result';
import { StdResponse } from '@common/std-response/std-response';
import { StdStatus } from '@common/std-response/std-status';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

export abstract class BaseHttpController {
  protected respond<T>(response: Response, result: Result<T>) {
    const stdResponse = StdResponse.fromResult<T>(result);

    response.status(this.fromStdStatus(stdResponse.status)).send(stdResponse);
  }

  private fromStdStatus(status: StdStatus): HttpStatus {
    switch (status) {
      case StdStatus.SUCCESS:
        return HttpStatus.OK;
      case StdStatus.BAD_REQUEST:
        return HttpStatus.BAD_REQUEST;
      case StdStatus.UNAUTHORIZED:
        return HttpStatus.UNAUTHORIZED;
      case StdStatus.FORBIDDEN:
        return HttpStatus.FORBIDDEN;
      case StdStatus.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case StdStatus.INTERNAL_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
