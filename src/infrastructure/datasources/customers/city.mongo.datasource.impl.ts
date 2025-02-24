// src/infrastructure/datasources/customers/city.mongo.datasource.impl.ts
import { CityModel } from "../../../data/mongodb/models/customers/city.model";
import { CityDataSource } from "../../../domain/datasources/customers/city.datasource";
import { CreateCityDto } from "../../../domain/dtos/customers/create-city.dto";
import { UpdateCityDto } from "../../../domain/dtos/customers/update-city.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CityEntity } from "../../../domain/entities/customers/citiy";
import { CustomError } from "../../../domain/errors/custom.error";
import { CityMapper } from "../../mappers/customers/city.mapper";

export class CityMongoDataSourceImpl extends CityDataSource {
    
    async findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<CityEntity | null> {
        try {
            const city = await CityModel.findOne({ name: name.toLowerCase() });
            if (!city) return null;
            return CityMapper.fromObjectToCityEntity(city);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CityMongoDataSourceImpl, internal server error");
        }
    }
    
    async findByName(name: string, paginationDto: PaginationDto): Promise<CityEntity> {
        try {
            const city = await CityModel.findOne({ name: name.toLowerCase() });
            if (!city) throw CustomError.notFound("City not found");
            return CityMapper.fromObjectToCityEntity(city);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CityMongoDataSourceImpl, internal server error");
        }
    }
    
    async create(createCityDto: CreateCityDto): Promise<CityEntity> {
        try {
            // Crear la ciudad con los datos del DTO
            const city = await CityModel.create({
                name: createCityDto.name.toLowerCase(),
                description: createCityDto.description.toLowerCase(),
                isActive: createCityDto.isActive
            });
            
            return CityMapper.fromObjectToCityEntity(city);
        } catch (error:any) {
            // Si es un error de duplicado en MongoDB
            if (error.code === 11000) {
                throw CustomError.badRequest("City already exists");
            }
            
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CityMongoDataSourceImpl, internal server error");
        }
    }
    
    async getAll(paginationDto: PaginationDto): Promise<CityEntity[]> {
        const { limit, page } = paginationDto;
        
        try {
            const cities = await CityModel.find()
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
            
            // Usamos el mapper para convertir cada documento a una entidad
            return cities.map(city => CityMapper.fromObjectToCityEntity(city));
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CityMongoDataSourceImpl, internal server error");
        }
    }
    
    async findById(id: string): Promise<CityEntity> {
        try {
            const city = await CityModel.findById(id);
            if (!city) throw CustomError.notFound("City not found");
            
            return CityMapper.fromObjectToCityEntity(city);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CityMongoDataSourceImpl, internal server error");
        }
    }
    
    async update(id: string, updateCityDto: UpdateCityDto): Promise<CityEntity> {
        try {
            // Creamos un objeto con los campos a actualizar
            const updateData: any = {};
            if (updateCityDto.name) updateData.name = updateCityDto.name.toLowerCase();
            if (updateCityDto.description) updateData.description = updateCityDto.description.toLowerCase();
            if (updateCityDto.isActive !== undefined) updateData.isActive = updateCityDto.isActive;
            
            const updatedCity = await CityModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true } // Para que retorne el documento actualizado
            );
            
            if (!updatedCity) throw CustomError.notFound("City not found");
            
            return CityMapper.fromObjectToCityEntity(updatedCity);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CityMongoDataSourceImpl, internal server error");
        }
    }
    
    async delete(id: string): Promise<CityEntity> {
        try {
            const deletedCity = await CityModel.findByIdAndDelete(id);
            if (!deletedCity) throw CustomError.notFound("City not found");
            
            return CityMapper.fromObjectToCityEntity(deletedCity);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CityMongoDataSourceImpl, internal server error");
        }
    }
}