import { AuthDatasourceImpl } from '../../../../src/infrastructure/datasources/auth.mongo.datasource.impl';
import { CustomError } from '../../../../src/domain/errors/custom.error';
import { UserEntity } from '../../../../src/domain/entities/user.entity';
import { UserMapper } from '../../../../src/infrastructure/mappers/user.mapper';
import { UserModel } from '../../../../src/data/mongodb/models/user.model';
import logger from '../../../../src/configs/logger';

describe('AuthDatasourceImpl', () => {
    const hashPassword = jest.fn((p) => 'hashed_' + p);
    const comparePassword = jest.fn((p, h) => h === 'hashed_' + p);
    const ds = new AuthDatasourceImpl(hashPassword, comparePassword);
    const userDoc = { _id: '507f1f77bcf86cd799439011', name: 'Test', email: 'test@test.com', password: 'hashed_pass', roles: ['USER_ROLE'], save: jest.fn() };
    const userEntity = new UserEntity('507f1f77bcf86cd799439011', 'Test', 'test@test.com', 'hashed_pass', ['USER_ROLE']);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should login successfully', async () => {
            jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userDoc as any);
            comparePassword.mockReturnValue(true);
            jest.spyOn(UserMapper, 'fromObjectToUserEntity').mockReturnValue(userEntity);
            const result = await ds.login({ email: 'test@test.com', password: 'pass' });
            expect(result).toBe(userEntity);
        });
        it('should throw if user not found', async () => {
            jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);
            await expect(ds.login({ email: 'notfound@test.com', password: 'pass' })).rejects.toThrow('User does not exist');
        });
        it('should throw if password invalid', async () => {
            jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userDoc as any);
            comparePassword.mockReturnValue(false);
            await expect(ds.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Password is not valid');
        });
        it('should throw internalServerError on unknown error', async () => {
            jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce(new Error('fail'));
            await expect(ds.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow('Internal server error during login');
        });
    });

    describe('register', () => {
        it('should register successfully', async () => {
            jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);
            jest.spyOn(UserModel, 'create').mockResolvedValueOnce(userDoc as any);
            userDoc.save.mockResolvedValueOnce(userDoc);
            jest.spyOn(UserMapper, 'fromObjectToUserEntity').mockReturnValue(userEntity);
            const result = await ds.register({ name: 'Test', email: 'test@test.com', password: 'pass' });
            expect(result).toBe(userEntity);
        });
        it('should throw if user already exists', async () => {
            jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userDoc as any);
            await expect(ds.register({ name: 'Test', email: 'test@test.com', password: 'pass' })).rejects.toThrow('User already exists');
        });
        it('should throw internalServerError on unknown error', async () => {
            jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce(new Error('fail'));
            await expect(ds.register({ name: 'Test', email: 'test@test.com', password: 'pass' })).rejects.toThrow('Internal server error during registration');
        });
    });

    describe('findByEmail', () => {
        it('should return user entity if found', async () => {
            jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userDoc as any);
            jest.spyOn(UserMapper, 'fromObjectToUserEntity').mockReturnValue(userEntity);
            const result = await ds.findByEmail('test@test.com');
            expect(result).toBe(userEntity);
        });
        it('should return null if not found', async () => {
            jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);
            const result = await ds.findByEmail('notfound@test.com');
            expect(result).toBeNull();
        });
        it('should return null on error', async () => {
            jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce(new Error('fail'));
            const result = await ds.findByEmail('fail@test.com');
            expect(result).toBeNull();
        });
    });

    describe('updatePassword', () => {
        it('should return true if password updated', async () => {
            jest.spyOn(UserModel, 'updateOne').mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1, acknowledged: true, upsertedCount: 0, upsertedId: null });
            const result = await ds.updatePassword('507f1f77bcf86cd799439011', 'newhash');
            expect(result).toBe(true);
        });
        it('should return false if user not found', async () => {
            jest.spyOn(UserModel, 'updateOne').mockResolvedValueOnce({ matchedCount: 0, modifiedCount: 0, acknowledged: true, upsertedCount: 0, upsertedId: null });
            const result = await ds.updatePassword('notfound', 'newhash');
            expect(result).toBe(false);
        });
        it('should return true if password not modified', async () => {
            jest.spyOn(UserModel, 'updateOne').mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 0, acknowledged: true, upsertedCount: 0, upsertedId: null });
            const result = await ds.updatePassword('507f1f77bcf86cd799439011', 'samehash');
            expect(result).toBe(true);
        });
        it('should throw internalServerError on error', async () => {
            jest.spyOn(UserModel, 'updateOne').mockRejectedValueOnce(new Error('fail'));
            await expect(ds.updatePassword('507f1f77bcf86cd799439011', 'fail')).rejects.toThrow('Error al actualizar la contraseña');
        });
    });

    describe('getAllPaginated', () => {
        it('should return paginated users', async () => {
            jest.spyOn(UserModel, 'countDocuments').mockResolvedValueOnce(2);
            jest.spyOn(UserModel, 'find').mockReturnValueOnce({ skip: () => ({ limit: () => ({ sort: () => ({ exec: () => Promise.resolve([userDoc, userDoc]) }) }) }) } as any);
            jest.spyOn(UserMapper, 'fromObjectToUserEntity').mockReturnValue(userEntity);
            const result = await ds.getAllPaginated({ page: 1, limit: 2 });
            expect(result.total).toBe(2);
            expect(result.users.length).toBe(2);
        });
        it('should throw if mapping fails', async () => {
            jest.spyOn(UserModel, 'countDocuments').mockResolvedValueOnce(1);
            jest.spyOn(UserModel, 'find').mockReturnValueOnce({ skip: () => ({ limit: () => ({ sort: () => ({ exec: () => Promise.resolve([userDoc]) }) }) }) } as any);
            jest.spyOn(UserMapper, 'fromObjectToUserEntity').mockImplementation(() => { throw new Error('fail map'); });
            await expect(ds.getAllPaginated({ page: 1, limit: 1 })).rejects.toThrow('Error al obtener usuarios paginados');
        });
        it('should throw internalServerError on error', async () => {
            jest.spyOn(UserModel, 'countDocuments').mockRejectedValueOnce(new Error('fail'));
            jest.spyOn(UserModel, 'find').mockReturnValueOnce({ skip: () => ({ limit: () => ({ sort: () => ({ exec: () => Promise.resolve([userDoc]) }) }) }) } as any);
            await expect(ds.getAllPaginated({ page: 1, limit: 1 })).rejects.toThrow('Error al obtener usuarios paginados');
        });
    });

    describe('findById', () => {
        it('should return user entity if found and id valid', async () => {
            jest.spyOn(UserModel, 'findById').mockResolvedValueOnce(userDoc as any);
            jest.spyOn(UserMapper, 'fromObjectToUserEntity').mockReturnValue(userEntity);
            const result = await ds.findById('507f1f77bcf86cd799439011');
            expect(result).toBe(userEntity);
        });
        it('should return null if id invalid', async () => {
            const result = await ds.findById('badid');
            expect(result).toBeUndefined();
        });
        it('should return null if user not found', async () => {
            jest.spyOn(UserModel, 'findById').mockResolvedValueOnce(null);
            const result = await ds.findById('507f1f77bcf86cd799439011');
            expect(result).toBeNull();
        });
        it('should return null on error', async () => {
            jest.spyOn(UserModel, 'findById').mockRejectedValueOnce(new Error('fail'));
            const result = await ds.findById('507f1f77bcf86cd799439011');
            expect(result).toBeNull();
        });
    });
});
