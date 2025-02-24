import { NeighborhoodEntity } from "../../entities/customers/neighborhood";
import { CustomError } from "../../errors/custom.error";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface IGetNeighborhoodByIdUseCase {
    execute(id: string): Promise<NeighborhoodEntity>
}

export class GetNeighborhoodByIdUseCase implements IGetNeighborhoodByIdUseCase {
    constructor(
        private readonly neighborhoodRepository: NeighborhoodRepository
    ) {}

    async execute(id: string): Promise<NeighborhoodEntity> {
        try {
            // Buscamos el barrio por ID
            const neighborhood = await this.neighborhoodRepository.findById(id);
            
            // Si no existe, lanzamos un error
            if (!neighborhood) {
                throw CustomError.notFound('Barrio no encontrado');
            }

            return neighborhood;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('get-neighborhood-by-id-use-case error');
        }
    }
}