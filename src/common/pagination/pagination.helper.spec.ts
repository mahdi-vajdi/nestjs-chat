import { PaginationHelper } from './pagination.helper';

describe('PaginationHelper', () => {
  describe('parse', () => {
    it('should parse valid page and pageSize', () => {
      const result = PaginationHelper.parse('2', '20');
      expect(result).toEqual({ page: 2, pageSize: 20, limit: 20, offset: 20 });
    });

    it('should fall back to defaults for invalid or missing values', () => {
      expect(PaginationHelper.parse(undefined, undefined)).toEqual({
        page: 1,
        pageSize: 15,
        limit: 15,
        offset: 0,
      });
      expect(PaginationHelper.parse('invalid', 'invalid')).toEqual({
        page: 1,
        pageSize: 15,
        limit: 15,
        offset: 0,
      });
      expect(PaginationHelper.parse('-1', '0')).toEqual({
        page: 1,
        pageSize: 1,
        limit: 1,
        offset: 0,
      });
    });
  });

  describe('createResult', () => {
    it('should calculate metadata correctly', () => {
      const result = PaginationHelper.createResult([{ id: 1 }, { id: 2 }], 10, {
        page: 1,
        pageSize: 2,
        offset: 0,
        limit: 2,
      });
      expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.meta).toEqual({
        total: 10,
        page: 1,
        pageSize: 2,
        totalPages: 5,
        hasNext: true,
        hasPrevious: false,
      });
    });

    it('should handle edge cases', () => {
      const result = PaginationHelper.createResult([], 0, {
        page: 2,
        pageSize: 10,
        offset: 10,
        limit: 10,
      });
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrevious).toBe(true);
    });
  });
});
