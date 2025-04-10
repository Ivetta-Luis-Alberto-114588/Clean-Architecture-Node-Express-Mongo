// src/domain/use-cases/auth/register-user.use-case.ts
import { JwtAdapter } from "../../../configs/jwt";
import { RegisterUserDto } from "../../dtos/auth/register-user.dto";
import { CustomError } from "../../errors/custom.error";
import { AuthRepository } from "../../repositories/auth.repository";
import { CustomerRepository } from "../../repositories/customers/customer.repository"; // <<<--- IMPORTAR
import { CreateCustomerDto } from "../../dtos/customers/create-customer.dto"; // <<<--- IMPORTAR
import logger from "../../../configs/logger"; // <<<--- IMPORTAR Logger

// ... (interfaces IUserWithToken y SignToken sin cambios) ...
interface IRegisterUserUseCase {
    execute(registerUserDto: RegisterUserDto): Promise<IUserWithToken>
}
interface IUserWithToken {
    user: {
        id: string,
        name: string,
        email: string,
        password: string,
        role: string[],
        token: string,
    },
}
type SignToken = (payload: Object, duration?: "2h") => Promise<string | null>


export class RegisterUserUseCase implements IRegisterUserUseCase {

    // <<<--- Inyectar CustomerRepository --- >>>
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly customerRepository: CustomerRepository, // <<<--- AÑADIR
        private readonly signToken: SignToken = JwtAdapter.generateToken
    ) { }

    async execute(registerUserDto: RegisterUserDto): Promise<IUserWithToken> {

        // 1. Registrar el usuario
        const user = await this.authRepository.register(registerUserDto);
        logger.info(`Usuario registrado: ${user.email} (ID: ${user.id})`);

        // 2. Crear el registro Customer asociado (con datos básicos)
        try {
            // Verificar si ya existe un cliente con ese email (por si acaso, aunque register ya lo hace para User)
            const existingCustomer = await this.customerRepository.findByEmail(user.email);
            if (existingCustomer) {
                // Esto podría pasar si un invitado compró antes y ahora se registra.
                // Podríamos vincular el userId al cliente existente o lanzar error.
                // Por ahora, lanzaremos un error para mantenerlo simple.
                logger.warn(`Intento de registro para email ${user.email} que ya existe como Customer ${existingCustomer.id}`);
                // Podrías actualizar el cliente existente con el userId aquí si esa es tu lógica de negocio
                // await this.customerRepository.update(existingCustomer.id, { userId: user.id });
                // O lanzar error:
                throw CustomError.badRequest('El email ya está en uso por un cliente existente.');
            }

            // <<<--- ¡NECESITAS UN ID DE BARRIO VÁLIDO AQUÍ! --- >>>
            const defaultNeighborhoodId = 'ID_BARRIO_POR_DEFECTO'; // ¡¡¡ REEMPLAZAR !!!
            logger.warn(`Usando ID de barrio por defecto '${defaultNeighborhoodId}' para nuevo cliente ${user.email}. Implementar selección/obtención real.`);

            const [errorDto, createCustomerDto] = CreateCustomerDto.create({
                name: user.name, // Usar nombre del usuario
                email: user.email, // Usar email del usuario
                phone: '0000000000', // Placeholder - El usuario debe actualizarlo
                address: 'Dirección pendiente', // Placeholder
                neighborhoodId: defaultNeighborhoodId, // ¡¡¡ REEMPLAZAR !!!
                isActive: true,
                // No establecemos userId aquí, lo hacemos en el modelo al crear
            });

            if (errorDto) {
                // Si falla la creación del DTO del cliente, el usuario ya está creado.
                // Esto indica un problema de configuración (ej: ID de barrio inválido).
                logger.error(`Error creando CreateCustomerDto para usuario ${user.id}: ${errorDto}`);
                // Podrías intentar eliminar el usuario creado o marcarlo para revisión.
                // Por simplicidad, lanzamos error interno.
                throw CustomError.internalServerError(`Error preparando datos del cliente: ${errorDto}`);
            }

            // Crear el cliente y vincularlo al usuario
            const customerData = {
                ...createCustomerDto!,
                userId: user.id // <<<--- Añadir el userId aquí para vincular
            };
            // Usamos directamente el modelo para asegurar que el userId se guarda
            // ya que el método create del repositorio podría no manejarlo explícitamente aún.
            // O mejor, modificamos el repositorio/datasource para aceptar userId opcionalmente.
            // Por ahora, asumimos que el repositorio/datasource create puede manejarlo o lo hacemos directo:

            // await CustomerModel.create(customerData); // Si se hace directo (menos ideal)
            // O preferiblemente, modificar create en repo/datasource para aceptar userId
            await this.customerRepository.create(customerData as CreateCustomerDto); // Asumimos que create lo maneja


            logger.info(`Cliente creado y vinculado para usuario: ${user.email}`);

        } catch (customerError) {
            // Si falla la creación del cliente, el usuario YA está creado en la BD.
            // Esto es problemático. Debería idealmente hacerse en una transacción,
            // pero Mongoose no soporta transacciones entre diferentes operaciones create fácilmente.
            logger.error(`¡FALLO CRÍTICO! Usuario ${user.id} creado pero no se pudo crear/vincular Customer.`, { error: customerError });
            // ¿Qué hacer? ¿Eliminar el usuario? ¿Marcarlo?
            // Por ahora, lanzamos el error, pero esto deja un usuario sin cliente.
            if (customerError instanceof CustomError) throw customerError;
            throw CustomError.internalServerError('Error creando el perfil del cliente asociado al usuario.');
        }

        // 3. Generar Token (sin cambios)
        const token = await this.signToken({ id: user.id }, '2h');
        if (!token) throw CustomError.internalServerError("register-use-case, Error generating token");

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password, // Considera no devolver la contraseña hasheada
                role: user.role,
                token: token
            },
        };
    }
}