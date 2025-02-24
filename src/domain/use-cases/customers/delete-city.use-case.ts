import { CityEntity } from "../../entities/customers/citiy";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";

interface IDeleteCityUseCase {
    execute(id: string): Promise<CityEntity>    
}

export class DeleteCityUseCase implements IDeleteCityUseCase {
    constructor(
        private readonly cityRepository: CityRepository
    ){}

    async execute(id: string): Promise<CityEntity> {
        try {
            // Buscamos la ciudad
            const city = await this.cityRepository.findById(id);

            // Si no existe lanzamos un error
            if (!city) {
                throw CustomError.notFound("delete-city-use-case, ciudad no encontrada");
            }

            // Eliminamos la ciudad y la guardamos en deletedCity
            const deletedCity = await this.cityRepository.delete(id);
            
            return deletedCity;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("delete-city-use-case, error interno del servidor");            
        }
    }
}