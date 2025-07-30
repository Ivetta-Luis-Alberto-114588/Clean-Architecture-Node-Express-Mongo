import { UpdateAddressDto } from '../../src/domain/dtos/customers/update-address.dto';
import mongoose from 'mongoose';

describe('UpdateAddressDto Integration', () => {
    const validObjectId = new mongoose.Types.ObjectId().toHexString();

    it('should return error if no fields are provided', () => {
        const [error, dto] = UpdateAddressDto.create({});
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should validate and trim recipientName', () => {
        const [error, dto] = UpdateAddressDto.create({ recipientName: '  John Doe  ' });
        expect(error).toBeUndefined();
        expect(dto!.recipientName).toBe('John Doe');
    });

    it('should return error for empty recipientName', () => {
        const [error, dto] = UpdateAddressDto.create({ recipientName: '   ' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should validate and trim phone', () => {
        const [error, dto] = UpdateAddressDto.create({ phone: ' 123456789 ' });
        expect(error).toBeUndefined();
        expect(dto!.phone).toBe('123456789');
    });

    it('should return error for invalid phone', () => {
        const [error, dto] = UpdateAddressDto.create({ phone: 'abc' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should validate and trim streetAddress', () => {
        const [error, dto] = UpdateAddressDto.create({ streetAddress: ' 123 Main St ' });
        expect(error).toBeUndefined();
        expect(dto!.streetAddress).toBe('123 Main St');
    });

    it('should return error for empty streetAddress', () => {
        const [error, dto] = UpdateAddressDto.create({ streetAddress: '   ' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should validate neighborhoodId as ObjectId', () => {
        const [error, dto] = UpdateAddressDto.create({ neighborhoodId: validObjectId });
        expect(error).toBeUndefined();
        expect(dto!.neighborhoodId).toBe(validObjectId);
    });

    it('should return error for invalid neighborhoodId', () => {
        const [error, dto] = UpdateAddressDto.create({ neighborhoodId: 'invalid' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should validate cityId as ObjectId', () => {
        const [error, dto] = UpdateAddressDto.create({ cityId: validObjectId });
        expect(error).toBeUndefined();
        expect(dto!.cityId).toBe(validObjectId);
    });

    it('should return error for invalid cityId', () => {
        const [error, dto] = UpdateAddressDto.create({ cityId: 'invalid' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should allow postalCode as string and trim', () => {
        const [error, dto] = UpdateAddressDto.create({ postalCode: ' 1234 ' });
        expect(error).toBeUndefined();
        expect(dto!.postalCode).toBe('1234');
    });

    it('should allow postalCode as null', () => {
        const [error, dto] = UpdateAddressDto.create({ postalCode: null });
        expect(error).toBeUndefined();
        expect(dto!.postalCode).toBeNull();
    });

    it('should return error for invalid postalCode type', () => {
        const [error, dto] = UpdateAddressDto.create({ postalCode: 1234 });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should allow additionalInfo as string and trim', () => {
        const [error, dto] = UpdateAddressDto.create({ additionalInfo: ' info ' });
        expect(error).toBeUndefined();
        expect(dto!.additionalInfo).toBe('info');
    });

    it('should allow additionalInfo as null', () => {
        const [error, dto] = UpdateAddressDto.create({ additionalInfo: null });
        expect(error).toBeUndefined();
        expect(dto!.additionalInfo).toBeNull();
    });

    it('should return error for invalid additionalInfo type', () => {
        const [error, dto] = UpdateAddressDto.create({ additionalInfo: 123 });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should allow alias as string and trim', () => {
        const [error, dto] = UpdateAddressDto.create({ alias: ' casa ' });
        expect(error).toBeUndefined();
        expect(dto!.alias).toBe('casa');
    });

    it('should allow alias as null', () => {
        const [error, dto] = UpdateAddressDto.create({ alias: null });
        expect(error).toBeUndefined();
        expect(dto!.alias).toBeNull();
    });

    it('should return error for invalid alias type', () => {
        const [error, dto] = UpdateAddressDto.create({ alias: 123 });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should allow isDefault as boolean', () => {
        const [error, dto] = UpdateAddressDto.create({ isDefault: true });
        expect(error).toBeUndefined();
        expect(dto!.isDefault).toBe(true);
    });

    it('should return error for invalid isDefault type', () => {
        const [error, dto] = UpdateAddressDto.create({ isDefault: 'yes' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should allow multiple fields at once', () => {
        const [error, dto] = UpdateAddressDto.create({
            recipientName: ' Jane ',
            phone: '123456789',
            streetAddress: ' Main St ',
            postalCode: ' 1234 ',
            neighborhoodId: validObjectId,
            cityId: validObjectId,
            additionalInfo: ' info ',
            isDefault: false,
            alias: ' casa '
        });
        expect(error).toBeUndefined();
        expect(dto!.recipientName).toBe('Jane');
        expect(dto!.phone).toBe('123456789');
        expect(dto!.streetAddress).toBe('Main St');
        expect(dto!.postalCode).toBe('1234');
        expect(dto!.neighborhoodId).toBe(validObjectId);
        expect(dto!.cityId).toBe(validObjectId);
        expect(dto!.additionalInfo).toBe('info');
        expect(dto!.isDefault).toBe(false);
        expect(dto!.alias).toBe('casa');
    });
});
