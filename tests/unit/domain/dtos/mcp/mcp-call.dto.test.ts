// tests/unit/domain/dtos/mcp/mcp-call.dto.test.ts
import { MCPCallDto } from "../../../../../src/domain/dtos/mcp/mcp-call.dto";

describe('MCPCallDto', () => {
  describe('create', () => {
    test('should create valid DTO when all required fields are provided', () => {
      const validData = {
        toolName: 'get_customers',
        arguments: { page: 1, limit: 10 }
      };

      const [error, dto] = MCPCallDto.create(validData);

      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
      expect(dto!.toolName).toBe('get_customers');
      expect(dto!.args).toEqual({ page: 1, limit: 10 });
    });

    test('should trim toolName whitespace', () => {
      const validData = {
        toolName: '  get_products  ',
        arguments: { search: 'test' }
      };

      const [error, dto] = MCPCallDto.create(validData);

      expect(error).toBeUndefined();
      expect(dto!.toolName).toBe('get_products');
    });

    test('should return error when toolName is missing', () => {
      const invalidData = {
        arguments: { page: 1 }
      };

      const [error, dto] = MCPCallDto.create(invalidData);

      expect(error).toBe('Tool name is required');
      expect(dto).toBeUndefined();
    });

    test('should return error when toolName is empty string', () => {
      const invalidData = {
        toolName: '',
        arguments: { page: 1 }
      };

      const [error, dto] = MCPCallDto.create(invalidData);

      expect(error).toBe('Tool name must be a non-empty string');
      expect(dto).toBeUndefined();
    });

    test('should return error when toolName is not string', () => {
      const invalidData = {
        toolName: 123,
        arguments: { page: 1 }
      };

      const [error, dto] = MCPCallDto.create(invalidData);

      expect(error).toBe('Tool name must be a non-empty string');
      expect(dto).toBeUndefined();
    });

    test('should return error when arguments is missing', () => {
      const invalidData = {
        toolName: 'get_customers'
      };

      const [error, dto] = MCPCallDto.create(invalidData);

      expect(error).toBe('Arguments must be an object');
      expect(dto).toBeUndefined();
    });

    test('should return error when arguments is not an object', () => {
      const invalidData = {
        toolName: 'get_customers',
        arguments: 'invalid'
      };

      const [error, dto] = MCPCallDto.create(invalidData);

      expect(error).toBe('Arguments must be an object');
      expect(dto).toBeUndefined();
    });
  });

  describe('validateRequiredArgs', () => {
    test('should return undefined when all required fields are present', () => {
      const dto = new (MCPCallDto as any)('get_customer_by_id', { id: '123', name: 'test' });
      
      const error = dto.validateRequiredArgs(['id']);

      expect(error).toBeUndefined();
    });

    test('should return error when required field is missing', () => {
      const dto = new (MCPCallDto as any)('get_customer_by_id', { name: 'test' });
      
      const error = dto.validateRequiredArgs(['id']);

      expect(error).toBe("Required field 'id' is missing");
    });

    test('should return error when required field is null', () => {
      const dto = new (MCPCallDto as any)('get_customer_by_id', { id: null, name: 'test' });
      
      const error = dto.validateRequiredArgs(['id']);

      expect(error).toBe("Required field 'id' is missing");
    });

    test('should return error when required field is undefined', () => {
      const dto = new (MCPCallDto as any)('get_customer_by_id', { id: undefined, name: 'test' });
      
      const error = dto.validateRequiredArgs(['id']);

      expect(error).toBe("Required field 'id' is missing");
    });

    test('should validate multiple required fields', () => {
      const dto = new (MCPCallDto as any)('test_tool', { id: '123' });
      
      const error = dto.validateRequiredArgs(['id', 'name']);

      expect(error).toBe("Required field 'name' is missing");
    });
  });
});
