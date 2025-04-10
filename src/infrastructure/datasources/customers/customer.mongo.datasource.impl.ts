// src/infrastructure/datasources/customers/customer.mongo.datasource.impl.ts
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model";
import { CustomerDataSource } from "../../../domain/datasources/customers/customer.datasource";
import { CreateCustomerDto } from "../../../domain/dtos/customers/create-customer.dto";
import { UpdateCustomerDto } from "../../../domain/dtos/customers/update-customer.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../../mappers/customers/customer.mapper";
import logger from "../../../configs/logger"; // Importar logger

export class CustomerMongoDataSourceImpl extends CustomerDataSource {

    // ... (métodos create, getAll, findById, update, delete, findByEmail, findByNeighborhood existentes) ...
    async create(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity> {
        try {
            const customer = await CustomerModel.create({
                name: createCustomerDto.name.toLowerCase(),
                email: createCustomerDto.email.toLowerCase(),
                phone: createCustomerDto.phone,
                address: createCustomerDto.address.toLowerCase(),
                neighborhood: createCustomerDto.neighborhoodId,
                isActive: createCustomerDto.isActive,
                // userId se establecerá por separado si es necesario (ej. en RegisterUserUseCase)
            });

            const populatedCustomer = await customer.populate({
                path: 'neighborhood',
                populate: { path: 'city' }
            });

            return CustomerMapper.fromObjectToCustomerEntity(populatedCustomer);
        } catch (error: any) {
            logger.error("Error creando cliente:", { error, dto: createCustomerDto });
            if (error.code === 11000) {
                throw CustomError.badRequest(`El email '${createCustomerDto.email}' ya está registrado.`);
            }
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al crear cliente.");
        }
    }

    async getAll(paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        const { limit, page } = paginationDto;
        try {
            const customers = await CustomerModel.find()
                .populate({ path: 'neighborhood', populate: { path: 'city' } })
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
            return customers.map(CustomerMapper.fromObjectToCustomerEntity);
        } catch (error) {
            logger.error("Error obteniendo todos los clientes:", { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al obtener clientes.");
        }
    }

    async findById(id: string): Promise<CustomerEntity> {
        try {
            const customer = await CustomerModel.findById(id)
                .populate({ path: 'neighborhood', populate: { path: 'city' } });
            if (!customer) throw CustomError.notFound(`Cliente con ID ${id} no encontrado.`);
            return CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            logger.error(`Error buscando cliente por ID ${id}:`, { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al buscar por ID.");
        }
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity> {
        try {
            const updateData: any = {};
            if (updateCustomerDto.name) updateData.name = updateCustomerDto.name.toLowerCase();
            if (updateCustomerDto.email) updateData.email = updateCustomerDto.email.toLowerCase();
            if (updateCustomerDto.phone) updateData.phone = updateCustomerDto.phone;
            if (updateCustomerDto.address) updateData.address = updateCustomerDto.address.toLowerCase();
            if (updateCustomerDto.neighborhoodId) updateData.neighborhood = updateCustomerDto.neighborhoodId;
            if (updateCustomerDto.isActive !== undefined) updateData.isActive = updateCustomerDto.isActive;
            // No permitir actualizar userId directamente aquí

            const updatedCustomer = await CustomerModel.findByIdAndUpdate(id, updateData, { new: true })
                .populate({ path: 'neighborhood', populate: { path: 'city' } });

            if (!updatedCustomer) throw CustomError.notFound(`Cliente con ID ${id} no encontrado para actualizar.`);

            return CustomerMapper.fromObjectToCustomerEntity(updatedCustomer);
        } catch (error: any) {
            logger.error(`Error actualizando cliente ${id}:`, { error, dto: updateCustomerDto });
            if (error.code === 11000) {
                throw CustomError.badRequest(`El email '${updateCustomerDto.email}' ya está en uso por otro cliente.`);
            }
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al actualizar cliente.");
        }
    }

    async delete(id: string): Promise<CustomerEntity> {
        try {
            const deletedCustomer = await CustomerModel.findByIdAndDelete(id)
                .populate({ path: 'neighborhood', populate: { path: 'city' } });
            if (!deletedCustomer) throw CustomError.notFound(`Cliente con ID ${id} no encontrado para eliminar.`);
            return CustomerMapper.fromObjectToCustomerEntity(deletedCustomer);
        } catch (error) {
            logger.error(`Error eliminando cliente ${id}:`, { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al eliminar cliente.");
        }
    }

    async findByEmail(email: string): Promise<CustomerEntity | null> {
        try {
            const customer = await CustomerModel.findOne({ email: email.toLowerCase() })
                .populate({ path: 'neighborhood', populate: { path: 'city' } });
            if (!customer) return null;
            return CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            logger.error(`Error buscando cliente por email ${email}:`, { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al buscar por email.");
        }
    }

    async findByNeighborhood(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        const { limit, page } = paginationDto;
        try {
            const customers = await CustomerModel.find({ neighborhood: neighborhoodId })
                .populate({ path: 'neighborhood', populate: { path: 'city' } })
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
            return customers.map(CustomerMapper.fromObjectToCustomerEntity);
        } catch (error) {
            logger.error(`Error buscando clientes por barrio ${neighborhoodId}:`, { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al buscar por barrio.");
        }
    }

    // <<<--- IMPLEMENTACIÓN NUEVO MÉTODO --- >>>
    async findByUserId(userId: string): Promise<CustomerEntity | null> {
        try {
            const customer = await CustomerModel.findOne({ userId: userId })
                .populate({
                    path: 'neighborhood',
                    populate: { path: 'city' }
                }); // Poblar barrio y ciudad anidada

            if (!customer) return null;

            return CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            logger.error(`Error buscando cliente por userId ${userId}:`, { error });
            // No lanzar CustomError aquí directamente, devolver null o dejar que el UseCase maneje
            // throw CustomError.internalServerError("Error al buscar cliente por ID de usuario.");
            return null; // Opcional: podrías lanzar un error si prefieres
        }
    }
    // <<<--- FIN IMPLEMENTACIÓN --- >>>
}