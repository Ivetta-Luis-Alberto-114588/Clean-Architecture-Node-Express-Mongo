import { ValidateOrderStatusTransitionUseCase } from '../../../../../src/domain/use-cases/order/validate-order-status-transition.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('ValidateOrderStatusTransitionUseCase', () => {

    let orderStatusRepository: any;
    let logger: any;
    let useCase: ValidateOrderStatusTransitionUseCase;

    beforeEach(() => {
        orderStatusRepository = {
            validateTransition: jest.fn(),
            findById: jest.fn(),
        };
        logger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            http: jest.fn(),
        };
        useCase = new ValidateOrderStatusTransitionUseCase(orderStatusRepository, logger);
    });


    it('should validate transition', async () => {
        orderStatusRepository.findById.mockImplementation((id: string) => {
            if (id === '1') return Promise.resolve({ code: 'A', isActive: true });
            if (id === '2') return Promise.resolve({ code: 'B', isActive: true });
            return Promise.resolve(null);
        });
        orderStatusRepository.validateTransition.mockResolvedValue(true);
        const result = await useCase.execute('1', '2');
        expect(orderStatusRepository.findById).toHaveBeenCalledWith('1');
        expect(orderStatusRepository.findById).toHaveBeenCalledWith('2');
        expect(orderStatusRepository.validateTransition).toHaveBeenCalledWith('1', '2');
        expect(logger.info).toHaveBeenCalledWith('Validación de transición A -> B: permitida');
        expect(result).toBe(true);
    });


    it('should throw CustomError if fromStatus not found', async () => {
        orderStatusRepository.findById.mockImplementation((id: string) => {
            if (id === '1') return Promise.resolve(null);
            if (id === '2') return Promise.resolve({ code: 'B', isActive: true });
        });
        await expect(useCase.execute('1', '2')).rejects.toThrow('Estado de origen no encontrado');
    });

    it('should throw CustomError if toStatus not found', async () => {
        orderStatusRepository.findById.mockImplementation((id: string) => {
            if (id === '1') return Promise.resolve({ code: 'A', isActive: true });
            if (id === '2') return Promise.resolve(null);
        });
        await expect(useCase.execute('1', '2')).rejects.toThrow('Estado de destino no encontrado');
    });

    it('should throw CustomError if toStatus is not active', async () => {
        orderStatusRepository.findById.mockImplementation((id: string) => {
            if (id === '1') return Promise.resolve({ code: 'A', isActive: true });
            if (id === '2') return Promise.resolve({ code: 'B', isActive: false });
        });
        await expect(useCase.execute('1', '2')).rejects.toThrow('No se puede transicionar a un estado inactivo');
    });

    it('should throw CustomError if repository throws', async () => {
        orderStatusRepository.findById.mockImplementation((id: string) => {
            if (id === '1') return Promise.resolve({ code: 'A', isActive: true });
            if (id === '2') return Promise.resolve({ code: 'B', isActive: true });
        });
        orderStatusRepository.validateTransition.mockRejectedValue(CustomError.internalServerError('fail'));
        await expect(useCase.execute('1', '2')).rejects.toBeInstanceOf(CustomError);
    });
});
