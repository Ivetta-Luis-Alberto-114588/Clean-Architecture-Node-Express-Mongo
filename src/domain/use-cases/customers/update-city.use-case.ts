import { UpdateCityDto } from "../../dtos/customers/update-city.dto";
import { CityEntity } from "../../entities/customers/citiy";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";

interface IUpdateCityUseCase {
    execute(id: string, updateCityDto: UpdateCityDto): Promise<CityEntity>
}

export class UpdateCityUseCase implements IUpdateCityUseCase {
    constructor(
        private readonly cityRepository: CityRepository
    ){}

    async execute(id: string, updateCityDto: UpdateCityDto): Promise<CityEntity> {
        try {
            // Verificamos que la ciudad exista
            const existingCity = await this.cityRepository.findById(id);
            if (!existingCity) {
                throw CustomError.notFound('update-city-use-case, Ciudad no encontrada');
            }

            // Si la ciudad existe, procedemos a actualizarla
            const updatedCity = await this.cityRepository.update(id, updateCityDto);
            return updatedCity;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('update-city-use-case, error interno del servidor');
        }
    }
}