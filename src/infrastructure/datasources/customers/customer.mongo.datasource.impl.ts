// src/infrastructure/datasources/customers/customer.mongo.datasource.impl.ts
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model";
import { CustomerDataSource } from "../../../domain/datasources/customers/customer.datasource";
import { CreateCustomerDto } from "../../../domain/dtos/customers/create-customer.dto";
import { UpdateCustomerDto } from "../../../domain/dtos/customers/update-customer.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../../mappers/customers/customer.mapper";

export class CustomerMongoDataSourceImpl extends CustomerDataSource {
    
    async create(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity> {
        try {
            // Creamos el cliente con los datos del DTO
            const customer = await CustomerModel.create({
                name: createCustomerDto.name.toLowerCase(),
                email: createCustomerDto.email.toLowerCase(),
                phone: createCustomerDto.phone,
                address: createCustomerDto.address.toLowerCase(),
                neighborhood: createCustomerDto.neighborhoodId,
                isActive: createCustomerDto.isActive
            });
            
            // Populamos la referencia a neighborhood (que a su vez debería popular city)
            const populatedCustomer = await customer.populate({
                path: 'neighborhood',
                populate: {
                    path: 'city'
                }
            });
            
            return CustomerMapper.fromObjectToCustomerEntity(populatedCustomer);
        } catch (error:any) {
            // Si es un error de duplicado en MongoDB (email duplicado)
            if (error.code === 11000) {
                throw CustomError.badRequest("Customer with this email already exists");
            }
            
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, internal server error");
        }
    }
    
    async getAll(paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        const { limit, page } = paginationDto;
        
        try {
            const customers = await CustomerModel.find()
                .populate({
                    path: 'neighborhood',
                    populate: {
                        path: 'city'
                    }
                })
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
            
            return customers.map(customer => 
                CustomerMapper.fromObjectToCustomerEntity(customer)
            );
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, internal server error");
        }
    }
    
    async findById(id: string): Promise<CustomerEntity> {
        try {
            const customer = await CustomerModel.findById(id)
                .populate({
                    path: 'neighborhood',
                    populate: {
                        path: 'city'
                    }
                });
                
            if (!customer) throw CustomError.notFound("Customer not found");
            
            return CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, internal server error");
        }
    }
    
    async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity> {
        try {
            // Creamos un objeto con los campos a actualizar
            const updateData: any = {};
            if (updateCustomerDto.name) updateData.name = updateCustomerDto.name.toLowerCase();
            if (updateCustomerDto.email) updateData.email = updateCustomerDto.email.toLowerCase();
            if (updateCustomerDto.phone) updateData.phone = updateCustomerDto.phone;
            if (updateCustomerDto.address) updateData.address = updateCustomerDto.address.toLowerCase();
            if (updateCustomerDto.neighborhoodId) updateData.neighborhood = updateCustomerDto.neighborhoodId;
            if (updateCustomerDto.isActive !== undefined) updateData.isActive = updateCustomerDto.isActive;
            
            const updatedCustomer = await CustomerModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).populate({
                path: 'neighborhood',
                populate: {
                    path: 'city'
                }
            });
            
            if (!updatedCustomer) throw CustomError.notFound("Customer not found");
            
            return CustomerMapper.fromObjectToCustomerEntity(updatedCustomer);
        } catch (error:any) {
            // Si es un error de duplicado en MongoDB (email duplicado)
            if (error.code === 11000) {
                throw CustomError.badRequest("Email already in use by another customer");
            }
            
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, internal server error");
        }
    }
    
    async delete(id: string): Promise<CustomerEntity> {
        try {
            const deletedCustomer = await CustomerModel.findByIdAndDelete(id)
                .populate({
                    path: 'neighborhood',
                    populate: {
                        path: 'city'
                    }
                });
                
            if (!deletedCustomer) throw CustomError.notFound("Customer not found");
            
            return CustomerMapper.fromObjectToCustomerEntity(deletedCustomer);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, internal server error");
        }
    }
    
    async findByEmail(email: string): Promise<CustomerEntity | null> {
        try {
            const customer = await CustomerModel.findOne({ email: email.toLowerCase() })
                .populate({
                    path: 'neighborhood',
                    populate: {
                        path: 'city'
                    }
                });
                
            if (!customer) return null;
            
            return CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, internal server error");
        }
    }
    
    async findByNeighborhood(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        const { limit, page } = paginationDto;
        
        try {
            const customers = await CustomerModel.find({ neighborhood: neighborhoodId })
                .populate({
                    path: 'neighborhood',
                    populate: {
                        path: 'city'
                    }
                })
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
            
            return customers.map(customer => 
                CustomerMapper.fromObjectToCustomerEntity(customer)
            );
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, internal server error");
        }
    }
}