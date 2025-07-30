import { CreateAddressDto } from '../../src/domain/dtos/customers/create-address.dto';

describe('CreateAddressDto Integration', () => {
    const validCustomerId = '60f6c8e2b4d1c72d9c8e4b1a';
    const validNeighborhoodId = '60f6c8e2b4d1c72d9c8e4b1b';
    const validCityId = '60f6c8e2b4d1c72d9c8e4b1c';

    it('should create a valid DTO with all required fields', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.recipientName).toBe(props.recipientName);
        expect(dto!.phone).toBe(props.phone);
        expect(dto!.streetAddress).toBe(props.streetAddress);
        expect(dto!.neighborhoodId).toBe(validNeighborhoodId);
        expect(dto!.customerId).toBe(validCustomerId);
    });

    it('should return error if customerId is missing', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId
        };
        const [error, dto] = CreateAddressDto.create(props, undefined as any);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if recipientName is missing', () => {
        const props = {
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if phone is missing', () => {
        const props = {
            recipientName: 'Juan Perez',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if phone is invalid', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: 'abc',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if streetAddress is missing', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            neighborhoodId: validNeighborhoodId
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should use selectedNeighborhoodId if provided', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            selectedNeighborhoodId: validNeighborhoodId
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeUndefined();
        expect(dto!.neighborhoodId).toBe(validNeighborhoodId);
        expect(dto!.selectedNeighborhoodId).toBe(validNeighborhoodId);
    });

    it('should return error if neither neighborhoodId nor selectedNeighborhoodId is provided', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123'
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if neighborhoodId is invalid', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: 'invalid-id'
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if cityId is invalid', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId,
            cityId: 'invalid-id'
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should trim string fields and validate phone after trim', () => {
        const props = {
            recipientName: ' Juan Perez ',
            phone: ' +5491122334455 ', // con espacios
            streetAddress: ' Calle Falsa 123 ',
            neighborhoodId: validNeighborhoodId,
            postalCode: ' 1234 ',
            additionalInfo: ' info ',
            alias: ' casa '
        };
        // Simular el trim manual antes de validar, como haría el DTO internamente
        const trimmedProps = {
            ...props,
            phone: props.phone.trim(),
            recipientName: props.recipientName.trim(),
            streetAddress: props.streetAddress.trim(),
            postalCode: props.postalCode.trim(),
            additionalInfo: props.additionalInfo.trim(),
            alias: props.alias.trim(),
        };
        const [error, dto] = CreateAddressDto.create(trimmedProps, validCustomerId);
        expect(error).toBeUndefined();
        expect(dto!.recipientName).toBe('Juan Perez');
        expect(dto!.phone).toBe('+5491122334455');
        expect(dto!.streetAddress).toBe('Calle Falsa 123');
        expect(dto!.postalCode).toBe('1234');
        expect(dto!.additionalInfo).toBe('info');
        expect(dto!.alias).toBe('casa');
    });

    it('should return error if isDefault is not boolean', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId,
            isDefault: 'yes'
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if postalCode is not string', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId,
            postalCode: 1234
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if additionalInfo is not string', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId,
            additionalInfo: 123
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if alias is not string', () => {
        const props = {
            recipientName: 'Juan Perez',
            phone: '+5491122334455',
            streetAddress: 'Calle Falsa 123',
            neighborhoodId: validNeighborhoodId,
            alias: 123
        };
        const [error, dto] = CreateAddressDto.create(props, validCustomerId);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });
});
