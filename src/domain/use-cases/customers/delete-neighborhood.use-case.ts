import { NeighborhoodEntity } from "../../entities/customers/neighborhood";
import { CustomError } from "../../errors/custom.error";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface IDeleteNeighborhoodUseCase {
    execute(id: string): Promise<NeighborhoodEntity>    
}

export class DeleteNeighborhoodUseCase implements IDeleteNeighborhoodUseCase {
    constructor(
        private readonly neighborhoodRepository: NeighborhoodRepository
    ){}

    async execute(id: string): Promise<NeighborhoodEntity> {
        try {
            // Buscamos el barrio
            const neighborhood = await this.neighborhoodRepository.findById(id);

            // Si no existe lanzamos un error
            if (!neighborhood) {
                throw CustomError.notFound("delete-neighborhood-use-case, barrio no encontrado");
            }

            // Eliminamos el barrio y lo guardamos en deletedNeighborhood
            const deletedNeighborhood = await this.neighborhoodRepository.delete(id);
            
            return deletedNeighborhood;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("delete-neighborhood-use-case, error interno del servidor");            
        }
    }
}