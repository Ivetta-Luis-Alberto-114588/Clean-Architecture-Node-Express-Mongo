import { UpdateNeighborhoodDto } from "../../dtos/customers/update-neighborhood.dto";
import { NeighborhoodEntity } from "../../entities/customers/neighborhood";
import { CustomError } from "../../errors/custom.error";
import { CityRepository } from "../../repositories/customers/city.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface IUpdateNeighborhoodUseCase {
    execute(id: string, updateNeighborhoodDto: UpdateNeighborhoodDto): Promise<NeighborhoodEntity>
}

export class UpdateNeighborhoodUseCase implements IUpdateNeighborhoodUseCase {
    constructor(
        private readonly neighborhoodRepository: NeighborhoodRepository,
        private readonly cityRepository: CityRepository
    ){}

    async execute(id: string, updateNeighborhoodDto: UpdateNeighborhoodDto): Promise<NeighborhoodEntity> {
        try {
            // Verificamos que el barrio exista
            const existingNeighborhood = await this.neighborhoodRepository.findById(id);
            if (!existingNeighborhood) {
                throw CustomError.notFound('update-neighborhood-use-case, Barrio no encontrado');
            }

            // Si se proporciona un nuevo cityId, verificamos que la ciudad exista
            if (updateNeighborhoodDto.cityId) {
                await this.cityRepository.findById(updateNeighborhoodDto.cityId);
            }

            // Si el barrio existe, procedemos a actualizarlo
            const updatedNeighborhood = await this.neighborhoodRepository.update(id, updateNeighborhoodDto);
            return updatedNeighborhood;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('update-neighborhood-use-case, error interno del servidor');
        }
    }
}