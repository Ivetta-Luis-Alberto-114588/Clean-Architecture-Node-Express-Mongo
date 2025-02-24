import { CityEntity } from "../../entities/customers/citiy";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";

interface IGetCityByIdUseCase {
    execute(id: string): Promise<CityEntity>
}

export class GetCityByIdUseCase implements IGetCityByIdUseCase {
    constructor(
        private readonly cityRepository: CityRepository
    ) {}

    async execute(id: string): Promise<CityEntity> {
        try {
            // Buscamos la ciudad por ID
            const city = await this.cityRepository.findById(id);
            
            // Si no existe, lanzamos un error
            if (!city) {
                throw CustomError.notFound('Ciudad no encontrada');
            }

            return city;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('get-city-by-id-use-case error');
        }
    }
}