import { CreateAddressUseCase } from '../../../../../src/domain/use-cases/customers/create-address.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { AddressEntity } from '../../../../../src/domain/entities/customers/address.entity';

describe('CreateAddressUseCase', () => {
    let customerRepository: any;
    let neighborhoodRepository: any;
    let useCase: CreateAddressUseCase;
    const userId = 'user1';
    const customerId = 'customer1';
    const validProps = {
        recipientName: 'John Doe',
        phone: '+5491112345678',
        streetAddress: 'Main St 123',
        postalCode: '1000',
        neighborhoodId: '60f6c2f9b60b5c001c8d4e1a',
        cityId: '60f6c2f9b60b5c001c8d4e1b',
        additionalInfo: 'Near park',
        isDefault: true,
        alias: 'Casa',
    };

    beforeEach(() => {
        customerRepository = {
            findByUserId: jest.fn(),
            createAddress: jest.fn(),
        };
        neighborhoodRepository = {
            findById: jest.fn(),
        };
        useCase = new CreateAddressUseCase(customerRepository, neighborhoodRepository);
    });

    it('should create address when data is valid', async () => {
        customerRepository.findByUserId.mockResolvedValue({ id: customerId });
        neighborhoodRepository.findById.mockResolvedValue({ id: validProps.neighborhoodId });
        const address: AddressEntity = {
            id: 'addr1',
            customerId,
            recipientName: validProps.recipientName,
            phone: validProps.phone,
            streetAddress: validProps.streetAddress,
            postalCode: validProps.postalCode,
            // neighborhoodId and cityId are not part of AddressEntity, only neighborhood and city objects are needed
            additionalInfo: validProps.additionalInfo,
            isDefault: validProps.isDefault,
            alias: validProps.alias,
            neighborhood: {
                id: validProps.neighborhoodId,
                name: 'Centro',
                description: 'Barrio céntrico',
                isActive: true,
                city: { id: validProps.cityId, name: 'Córdoba', description: 'Ciudad de Córdoba', isActive: true }
            },
            city: { id: validProps.cityId, name: 'Córdoba', description: 'Ciudad de Córdoba', isActive: true },
            fullAddress: 'Main St 123, Centro, Córdoba',
        };
        customerRepository.createAddress.mockResolvedValue(address);

        const result = await useCase.execute(userId, validProps);
        expect(customerRepository.findByUserId).toHaveBeenCalledWith(userId);
        expect(neighborhoodRepository.findById).toHaveBeenCalledWith(validProps.neighborhoodId);
        expect(customerRepository.createAddress).toHaveBeenCalled();
        expect(result).toEqual(address);
    });

    it('should throw CustomError if customer not found', async () => {
        customerRepository.findByUserId.mockResolvedValue(null);
        await expect(useCase.execute(userId, validProps)).rejects.toBeInstanceOf(CustomError);
        await expect(useCase.execute(userId, validProps)).rejects.toThrow('Perfil de cliente no encontrado para este usuario.');
    });

    it('should throw CustomError if DTO validation fails', async () => {
        customerRepository.findByUserId.mockResolvedValue({ id: customerId });
        // Missing recipientName
        const invalidProps = { ...validProps, recipientName: undefined };
        await expect(useCase.execute(userId, invalidProps)).rejects.toBeInstanceOf(CustomError);
        await expect(useCase.execute(userId, invalidProps)).rejects.toThrow('Nombre del destinatario es requerido');
    });

    it('should throw CustomError if neighborhood does not exist', async () => {
        customerRepository.findByUserId.mockResolvedValue({ id: customerId });
        neighborhoodRepository.findById.mockRejectedValue(CustomError.notFound('not found'));
        await expect(useCase.execute(userId, validProps)).rejects.toBeInstanceOf(CustomError);
        await expect(useCase.execute(userId, validProps)).rejects.toThrow('El barrio seleccionado (ID: 60f6c2f9b60b5c001c8d4e1a) no existe.');
    });

    it('should throw CustomError if repository throws CustomError', async () => {
        customerRepository.findByUserId.mockResolvedValue({ id: customerId });
        neighborhoodRepository.findById.mockResolvedValue({ id: validProps.neighborhoodId });
        customerRepository.createAddress.mockRejectedValue(CustomError.badRequest('fail'));
        await expect(useCase.execute(userId, validProps)).rejects.toBeInstanceOf(CustomError);
    });

    it('should throw internalServerError if unknown error occurs', async () => {
        customerRepository.findByUserId.mockResolvedValue({ id: customerId });
        neighborhoodRepository.findById.mockResolvedValue({ id: validProps.neighborhoodId });
        customerRepository.createAddress.mockRejectedValue(new Error('fail'));
        await expect(useCase.execute(userId, validProps)).rejects.toThrow('Error al guardar la dirección.');
    });
});
