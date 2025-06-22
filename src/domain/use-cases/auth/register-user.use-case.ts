// src/domain/use-cases/auth/register-user.use-case.ts
import { JwtAdapter } from "../../../configs/jwt";
import { envs } from "../../../configs/envs"; // Importar envs
import { RegisterUserDto } from "../../dtos/auth/register-user.dto";
import { CustomError } from "../../errors/custom.error";
import { AuthRepository } from "../../repositories/auth.repository";
import { CustomerRepository } from "../../repositories/customers/customer.repository"; // Importar CustomerRepository
import { CreateCustomerDto } from "../../dtos/customers/create-customer.dto"; // Importar CreateCustomerDto
import logger from "../../../configs/logger"; // Importar Logger

// Interfaces (sin cambios)
interface IRegisterUserUseCase {
    execute(registerUserDto: RegisterUserDto): Promise<IUserWithToken>
}

interface IUserWithToken {
    user: {
        id: string,
        name: string,
        email: string,
        // Considera NO devolver la contraseña, ni siquiera hasheada
        // password?: string, // Comentado por seguridad
        roles: string[],
        token: string,
    },
}

// Tipo de función para firmar token (sin cambios)
type SignToken = (payload: Object, duration?: string) => Promise<string | null>

export class RegisterUserUseCase implements IRegisterUserUseCase {

    // Inyectar CustomerRepository
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly customerRepository: CustomerRepository, // Añadir
        private readonly signToken: SignToken = JwtAdapter.generateToken // Mantener la flexibilidad
    ) { }

    async execute(registerUserDto: RegisterUserDto): Promise<IUserWithToken> {

        // 1. Registrar el usuario
        const user = await this.authRepository.register(registerUserDto);
        logger.info(`Usuario registrado: ${user.email} (ID: ${user.id})`);

        // 2. Crear el registro Customer asociado (con datos básicos)
        try {
            // Verificar si ya existe un cliente con ese email (importante para consistencia)
            const existingCustomer = await this.customerRepository.findByEmail(user.email);
            if (existingCustomer) {
                // Escenario: Un invitado compró antes y ahora se registra.
                // Acción: Vincular el userId al cliente existente.
                // (Asegúrate que tu CustomerRepository.update puede manejar la actualización de userId)
                logger.warn(`Cliente existente encontrado para email ${user.email} (ID: ${existingCustomer.id}). Vinculando con nuevo User ID: ${user.id}`);
                // await this.customerRepository.update(existingCustomer.id.toString(), { userId: user.id });
                // Nota: Si el cliente existente YA tiene un userId diferente, podrías lanzar un error o loguear una inconsistencia grave.
                if (existingCustomer.userId && existingCustomer.userId !== user.id) {
                    logger.error(`¡INCONSISTENCIA GRAVE! Cliente ${existingCustomer.id} con email ${user.email} ya está vinculado a OTRO usuario (${existingCustomer.userId}). No se vinculó al nuevo usuario ${user.id}.`);
                    // Considera lanzar un error aquí si esto no debería ocurrir.
                    // throw CustomError.internalServerError(`Conflicto de usuario para el email ${user.email}`);
                } else if (!existingCustomer.userId) {
                    // Solo actualiza si no tiene userId o si el ID coincide (caso raro)
                    await this.customerRepository.update(existingCustomer.id.toString(), { userId: user.id });
                    logger.info(`Cliente existente ${existingCustomer.id} vinculado exitosamente al usuario ${user.id}.`);
                }

            } else {
                // No existe cliente previo, crear uno nuevo.
                // ¡¡¡ IMPORTANTE: OBTENER ID DE BARRIO POR DEFECTO DESDE CONFIGURACIÓN !!!
                const defaultNeighborhoodId = envs.DEFAULT_NEIGHBORHOOD_ID; // Asegúrate que esta variable exista en envs.ts y .env
                if (!defaultNeighborhoodId) {
                    logger.error("DEFAULT_NEIGHBORHOOD_ID no está configurado en las variables de entorno.");
                    throw CustomError.internalServerError("Error de configuración interna del servidor [NEIGHBORHOOD].");
                }
                logger.info(`Usando ID de barrio por defecto '${defaultNeighborhoodId}' para nuevo cliente ${user.email}.`);


                // Crear DTO para el nuevo cliente
                const [errorDto, createCustomerDto] = CreateCustomerDto.create({
                    name: user.name, // Usar nombre del usuario
                    email: user.email, // Usar email del usuario
                    phone: '0000000000', // Placeholder - El usuario debe actualizarlo después
                    address: 'Dirección pendiente', // Placeholder
                    neighborhoodId: defaultNeighborhoodId, // ID de barrio por defecto desde envs
                    isActive: true,
                    userId: user.id
                    // userId se añadirá explícitamente antes de llamar al repositorio
                });

                if (errorDto) {
                    // Si falla la creación del DTO del cliente, el usuario ya está creado.
                    // Indica un problema (ej: ID de barrio por defecto inválido en .env).
                    logger.error(`Error creando CreateCustomerDto para usuario ${user.id}: ${errorDto}. El usuario ${user.id} fue creado pero el cliente no.`);
                    // Decisión: ¿Eliminar usuario? ¿Marcarlo? Por ahora, lanzar error interno.
                    // Esto DEJA UN USUARIO SIN CLIENTE en la BD. Idealmente, usar transacciones.
                    throw CustomError.internalServerError(`Error preparando datos del cliente: ${errorDto}`);
                }

                // Añadir el userId al DTO antes de pasarlo al repositorio
                const customerDataWithUserId = {
                    ...createCustomerDto!,
                    userId: user.id // Vincular al crear
                };

                // Crear el cliente usando el repositorio (asumiendo que maneja el userId)
                await this.customerRepository.create(createCustomerDto!);
                logger.info(`Nuevo Cliente creado y vinculado para usuario: ${user.email}`);
            }

        } catch (customerError) {
            // Si falla la creación/vinculación del cliente, el usuario YA está creado en la BD.
            // ¡Esto es un estado inconsistente! Idealmente, debería haber una transacción.
            logger.error(`¡FALLO CRÍTICO! Usuario ${user.id} (${user.email}) creado, pero NO se pudo crear/vincular el perfil de Cliente. Revisión manual necesaria.`, { error: customerError instanceof Error ? { message: customerError.message, stack: customerError.stack } : customerError });
            // Lanzamos el error para detener el proceso y que el usuario no reciba token.
            if (customerError instanceof CustomError) throw customerError;
            throw CustomError.internalServerError('Error crítico al configurar el perfil del cliente asociado al usuario.');
        }

        // 3. Generar Token (sin cambios)
        const token = await this.signToken({ id: user.id }, '2h'); // Duración estándar para login/registro
        if (!token) {
            // Si falla la generación del token, el usuario y cliente (probablemente) están creados.
            logger.error(`Fallo al generar token para usuario recién registrado ${user.id} (${user.email})`);
            throw CustomError.internalServerError("Error al generar el token de autenticación.");
        }        // 4. Devolver la respuesta
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                // password: user.password, // No devolver contraseña
                roles: user.roles,
                token: token // Devolver el token generado
            },
        };
    }
}