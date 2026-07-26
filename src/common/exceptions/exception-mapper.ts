import { HttpStatus } from '@nestjs/common';
import { DomainErrorType } from './domain.exception';

const domainErrorTypeToHttpStatus: Record<DomainErrorType, HttpStatus> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  BUSINESS_RULE: HttpStatus.BAD_REQUEST,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  TOO_MANY_REQUESTS: HttpStatus.TOO_MANY_REQUESTS,
};

export function mapDomainErrorTypeToHttpStatus(
  type: DomainErrorType,
): HttpStatus {
  return domainErrorTypeToHttpStatus[type] || HttpStatus.BAD_REQUEST;
}
