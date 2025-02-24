// src/infrastructure/datasources/customers/neighborhood.mongo.datasource.impl.ts
import { NeighborhoodModel } from "../../../data/mongodb/models/customers/neighborhood.model";
import { NeighborhoodDataSource } from "../../../domain/datasources/customers/neighborhood.datasource";
import { CreateNeighborhoodDto } from "../../../domain/dtos/customers/create-neighborhood.dto";
import { UpdateNeighborhoodDto } from "../../../domain/dtos/customers/update-neighborhood.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { NeighborhoodEntity } from "../../../domain/entities/customers/neighborhood";
import { CustomError } from "../../../domain/errors/custom.error";
import { NeighborhoodMapper } from "../../mappers/customers/neighborhood.mapper";

export class NeighborhoodMongoDataSourceImpl extends NeighborhoodDataSource {
    
    async findByNameForCreate(name: string, cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity | null> {
        try {
            // Búsqueda por nombre y cityId
            const neighborhood = await NeighborhoodModel.findOne({ 
                name: name.toLowerCase(),
                city: cityId
            }).populate('city');
            
            if (!neighborhood) return null;
            
            return NeighborhoodMapper.fromObjectToNeighborhoodEntity(neighborhood);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("NeighborhoodMongoDataSourceImpl, internal server error");
        }
    }
    
    async findByName(name: string, cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity> {
        try {
            const neighborhood = await NeighborhoodModel.findOne({ 
                name: name.toLowerCase(),
                city: cityId
            }).populate('city');
            
            if (!neighborhood) throw CustomError.notFound("Neighborhood not found");
            
            return NeighborhoodMapper.fromObjectToNeighborhoodEntity(neighborhood);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("NeighborhoodMongoDataSourceImpl, internal server error");
        }
    }
    
    async create(createNeighborhoodDto: CreateNeighborhoodDto): Promise<NeighborhoodEntity> {
        try {
            // Creamos el barrio con los datos del DTO
            const neighborhood = await NeighborhoodModel.create({
                name: createNeighborhoodDto.name.toLowerCase(),
                description: createNeighborhoodDto.description.toLowerCase(),
                city: createNeighborhoodDto.cityId,
                isActive: createNeighborhoodDto.isActive
            });
            
            // Populamos la referencia a city para retornar la entidad completa
            const populatedNeighborhood = await neighborhood.populate('city');
            
            return NeighborhoodMapper.fromObjectToNeighborhoodEntity(populatedNeighborhood);
        } catch (error:any) {
            // Si es un error de duplicado en MongoDB (nombre duplicado en la misma ciudad)
            if (error.code === 11000) {
                throw CustomError.badRequest("Neighborhood already exists in this city");
            }
            
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("NeighborhoodMongoDataSourceImpl, internal server error");
        }
    }
    
    async getAll(paginationDto: PaginationDto): Promise<NeighborhoodEntity[]> {
        const { limit, page } = paginationDto;
        
        try {
            const neighborhoods = await NeighborhoodModel.find()
                .populate('city')
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
            
            return neighborhoods.map(neighborhood => 
                NeighborhoodMapper.fromObjectToNeighborhoodEntity(neighborhood)
            );
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("NeighborhoodMongoDataSourceImpl, internal server error");
        }
    }
    
    async findById(id: string): Promise<NeighborhoodEntity> {
        try {
            const neighborhood = await NeighborhoodModel.findById(id).populate('city');
            if (!neighborhood) throw CustomError.notFound("Neighborhood not found");
            
            return NeighborhoodMapper.fromObjectToNeighborhoodEntity(neighborhood);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("NeighborhoodMongoDataSourceImpl, internal server error");
        }
    }
    
    async update(id: string, updateNeighborhoodDto: UpdateNeighborhoodDto): Promise<NeighborhoodEntity> {
        try {
            // Creamos un objeto con los campos a actualizar
            const updateData: any = {};
            if (updateNeighborhoodDto.name) updateData.name = updateNeighborhoodDto.name.toLowerCase();
            if (updateNeighborhoodDto.description) updateData.description = updateNeighborhoodDto.description.toLowerCase();
            if (updateNeighborhoodDto.cityId) updateData.city = updateNeighborhoodDto.cityId;
            if (updateNeighborhoodDto.isActive !== undefined) updateData.isActive = updateNeighborhoodDto.isActive;
            
            const updatedNeighborhood = await NeighborhoodModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).populate('city');
            
            if (!updatedNeighborhood) throw CustomError.notFound("Neighborhood not found");
            
            return NeighborhoodMapper.fromObjectToNeighborhoodEntity(updatedNeighborhood);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("NeighborhoodMongoDataSourceImpl, internal server error");
        }
    }
    
    async delete(id: string): Promise<NeighborhoodEntity> {
        try {
            const deletedNeighborhood = await NeighborhoodModel.findByIdAndDelete(id).populate('city');
            if (!deletedNeighborhood) throw CustomError.notFound("Neighborhood not found");
            
            return NeighborhoodMapper.fromObjectToNeighborhoodEntity(deletedNeighborhood);
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("NeighborhoodMongoDataSourceImpl, internal server error");
        }
    }
    
    async findByCity(cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity[]> {
        const { limit, page } = paginationDto;
        
        try {
            const neighborhoods = await NeighborhoodModel.find({ city: cityId })
                .populate('city')
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
            
            // Si no hay barrios, retornamos un array vacío en lugar de lanzar un error
            if (neighborhoods.length === 0) return [];
            
            return neighborhoods.map(neighborhood => 
                NeighborhoodMapper.fromObjectToNeighborhoodEntity(neighborhood)
            );
        } catch (error) {
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("NeighborhoodMongoDataSourceImpl, internal server error");
        }
    }
}