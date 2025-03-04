import { Request, Response } from 'express';
import { UserEntity } from '../../src/domain/entities/user.entity';
import { JwtAdapter } from '../../src/configs/jwt';

// Crear un mock de Request de Express
export const mockRequest = (data: any = {}): Partial<Request> => {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    ...data,
  };
};

// Crear un mock de Response de Express
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

// Generar un token JWT para pruebas
export const generateTestToken = async (user: UserEntity): Promise<string> => {
  const token = await JwtAdapter.generateToken({ id: user.id });
  if (!token) throw new Error('Failed to generate test token');
  return token;
};

// Crear un usuario de prueba
export const createTestUser = (): UserEntity => {
  return new UserEntity(
    'test-id',
    'Test User',
    'test@example.com',
    'hashedpassword',
    ['USER_ROLE'],
    'https://example.com/avatar.jpg'
  );
};