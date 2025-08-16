import {
  PaginatedResult,
  PaginationOptions,
} from '@common/pagination/pagination.interface';

export class PaginationHelper {
  static parse(page: any, pageSize: any): PaginationOptions {
    const sanitizedPage = Math.max(1, Math.floor(page));
    const sanitizedPageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

    return {
      page: sanitizedPage,
      pageSize: sanitizedPageSize,
      offset: (sanitizedPage - 1) * sanitizedPageSize,
      limit: sanitizedPageSize,
    };
  }

  static createResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / options.limit);

    return {
      data: data,
      meta: {
        page: options.page,
        pageSize: options.pageSize,
        total: total,
        totalPages: totalPages,
        hasNext: options.page < totalPages,
        hasPrevious: options.page > 1,
      },
    };
  }
}
