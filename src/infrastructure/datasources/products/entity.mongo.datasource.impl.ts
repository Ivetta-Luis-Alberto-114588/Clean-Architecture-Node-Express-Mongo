import { UnitModel } from "../../../data/mongodb/models/unit.model";
import { UnitDataSource } from "../../../domain/datasources/products/unit.datasource";
import { CreateUnitDto } from "../../../domain/dtos/products/create-unit.dto";
import { UpdateUnitDto } from "../../../domain/dtos/products/udpate-unit.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { UnitEntity } from "../../../domain/entities/products/unit.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { UnitMapper } from "../../mappers/products/unit.mapper";


export class UnitMongoDatasourceImpl implements UnitDataSource {
    
    async findByName(name: string, paginationDto: PaginationDto): Promise<UnitEntity[]> {
        const {limit, page} = paginationDto
        
        try {
            // Buscamos todos los documentos que coincidan con el nombre usando find en lugar de findOne
        const units = await UnitModel.find({ name: name })
                        .limit(limit)
                        .skip(page * limit)
                        .exec();

        // Si no hay resultados, lanzamos un error
        if (units.length === 0) {
            throw CustomError.notFound("No units found with that name");
        }

        // Mapeamos cada resultado a UnitEntity
        return units.map(unit => UnitMapper.fromObjectToUnitEntity(unit));
            

            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
                
            console.log(error)
            throw CustomError.internalServerError("UnitMonogoDataSourceImpl, internal server error")            
        }
    }
    
    
    async create(createUnitDto: CreateUnitDto): Promise<UnitEntity> {
        try {
            // Creamos el documento en la base de datos
            const x = await UnitModel.create(createUnitDto)

            // Retornamos el objeto mapeado
            return UnitMapper.fromObjectToUnitEntity(x)


        } catch (error) {            
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
                
            console.log(error)
            throw CustomError.internalServerError("UnitMonogoDataSourceImpl, internal server error")
        }
    }


   async getAll(paginationDto: PaginationDto): Promise<UnitEntity[]> {
        const {limit, page} = paginationDto
        
        try {
            const x = await UnitModel.find()
                .limit(limit)
                .skip(page * limit)
                .exec()
            
            // Retornamos el objeto mapeado, pero lo tengo que aplicar de a uno en uno
            return x.map(x => UnitMapper.fromObjectToUnitEntity(x))


        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }
    
            console.log(error)
            throw CustomError.internalServerError("UnitMonogoDataSourceImpl, internal server error")
        }
    }


    async findById(id: string): Promise<UnitEntity> {        
        
        try {

            // Buscamos el documento en la base de datos
            const x = await UnitModel.findById(id)
            
            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("Unit not found")
            
            // Retornamos el objeto mapeado
            return UnitMapper.fromObjectToUnitEntity(x)

            
        } catch (error) {
            // Si ya es un CustomError, lo propagamos
            if(error instanceof CustomError) { throw error }

            console.log(error)
            throw CustomError.internalServerError("UnitMonogoDataSourceImpl, internal server error")
        }

    }


    async updateUnit(id: string, updateUnitDto: UpdateUnitDto): Promise<UnitEntity> {
        const {name, description, isActive} = updateUnitDto

        try {
            // Buscamos el documento en la base de datos
            const x = await UnitModel.findByIdAndUpdate(id, {name, description, isActive}, {new: true})

            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("Unit not found")

            // Retornamos el objeto mapeado
            return UnitMapper.fromObjectToUnitEntity(x)

            
        } catch (error) {
             // Si ya es un CustomError, lo propagamos
             if(error instanceof CustomError) { throw error }

             console.log(error)
             throw CustomError.internalServerError("UnitMonogoDataSourceImpl, internal server error")           
        }
    }


    async deleteUnit(id: string): Promise<UnitEntity> {
        try {
            // Buscamos el documento en la base de datos
            const x = await UnitModel.findByIdAndDelete(id, {new: true})

            // Si no existe, lanzamos un error
            if(!x) throw CustomError.notFound("Unit not found")

            // Retornamos el objeto mapeado
            return UnitMapper.fromObjectToUnitEntity(x)
            
        } catch (error) {
             // Si ya es un CustomError, lo propagamos
             if(error instanceof CustomError) { throw error }

             console.log(error)
             throw CustomError.internalServerError("UnitMonogoDataSourceImpl, internal server error")                
        }
    }

}