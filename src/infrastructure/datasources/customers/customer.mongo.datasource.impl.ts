// src/infrastructure/datasources/customers/customer.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model";
import { CustomerDataSource } from "../../../domain/datasources/customers/customer.datasource";
import { CreateCustomerDto } from "../../../domain/dtos/customers/create-customer.dto";
import { UpdateCustomerDto } from "../../../domain/dtos/customers/update-customer.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../../mappers/customers/customer.mapper";
import logger from "../../../configs/logger";
import { AddressModel } from "../../../data/mongodb/models/customers/address.model";
import { AddressEntity } from "../../../domain/entities/customers/address.entity";
import { CreateAddressDto } from "../../../domain/dtos/customers/create-address.dto";
import { UpdateAddressDto } from "../../../domain/dtos/customers/update-address.dto";
import { AddressMapper } from "../../mappers/customers/address.mapper";
import { NeighborhoodModel } from "../../../data/mongodb/models/customers/neighborhood.model";
import { CityModel } from "../../../data/mongodb/models/customers/city.model"; // <<<--- Añadir CityModel

export class CustomerMongoDataSourceImpl extends CustomerDataSource {

    // <<<--- Métodos Customer existentes --- >>>
    // (Asegúrate que findById, findByUserId, etc. estén aquí y funcionen)
    async create(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity> {
        try {
            const customer = await CustomerModel.create({
                name: createCustomerDto.name.toLowerCase(),
                email: createCustomerDto.email.toLowerCase(),
                phone: createCustomerDto.phone,
                address: createCustomerDto.address.toLowerCase(),
                neighborhood: createCustomerDto.neighborhoodId,
                isActive: createCustomerDto.isActive,
                userId: createCustomerDto.userId
            });
            // Populate the neighborhood field before mapping to entity
            const populatedCustomer = await customer.populate({ path: 'neighborhood', populate: { path: 'city' } });
            return CustomerMapper.fromObjectToCustomerEntity(populatedCustomer);
        } catch (error: any) {
            logger.error("Error creando cliente:", { error, dto: createCustomerDto });
            if (error.code === 11000) throw CustomError.badRequest(`El email '${createCustomerDto.email}' ya está registrado.`);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al crear cliente.");
        }
    }
    async getAll(paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        const { limit, page } = paginationDto;
        try {
            const customers = await CustomerModel.find()
                .populate({ path: 'neighborhood', populate: { path: 'city' } })
                .limit(limit).skip((page - 1) * limit).exec();
            return customers.map(CustomerMapper.fromObjectToCustomerEntity);
        } catch (error) {
            logger.error("Error obteniendo todos los clientes:", { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al obtener clientes.");
        }
    }
    async findById(id: string): Promise<CustomerEntity> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) throw CustomError.badRequest("ID de cliente inválido");
            const customer = await CustomerModel.findById(id)
                .populate({ path: 'neighborhood', populate: { path: 'city' } });
            if (!customer) throw CustomError.notFound(`Cliente con ID ${id} no encontrado.`);
            return CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            logger.error(`Error buscando cliente por ID ${id}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al buscar por ID.");
        }
    }
    async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) throw CustomError.badRequest("ID de cliente inválido");
            const updateData: any = {};
            if (updateCustomerDto.name) updateData.name = updateCustomerDto.name.toLowerCase();
            if (updateCustomerDto.email) updateData.email = updateCustomerDto.email.toLowerCase();
            if (updateCustomerDto.phone) updateData.phone = updateCustomerDto.phone;
            if (updateCustomerDto.address) updateData.address = updateCustomerDto.address.toLowerCase();
            if (updateCustomerDto.neighborhoodId) updateData.neighborhood = updateCustomerDto.neighborhoodId;
            if (updateCustomerDto.isActive !== undefined) updateData.isActive = updateCustomerDto.isActive;

            const updatedCustomer = await CustomerModel.findByIdAndUpdate(id, updateData, { new: true })
                .populate({ path: 'neighborhood', populate: { path: 'city' } });
            if (!updatedCustomer) throw CustomError.notFound(`Cliente con ID ${id} no encontrado para actualizar.`);
            return CustomerMapper.fromObjectToCustomerEntity(updatedCustomer);
        } catch (error: any) {
            logger.error(`Error actualizando cliente ${id}:`, { error, dto: updateCustomerDto });
            if (error.code === 11000) throw CustomError.badRequest(`El email '${updateCustomerDto.email}' ya está en uso.`);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al actualizar cliente.");
        }
    }
    async delete(id: string): Promise<CustomerEntity> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) throw CustomError.badRequest("ID de cliente inválido");
            // Considerar si se deben eliminar direcciones asociadas o marcarlas como inactivas
            const deletedCustomer = await CustomerModel.findByIdAndDelete(id)
                .populate({ path: 'neighborhood', populate: { path: 'city' } });
            if (!deletedCustomer) throw CustomError.notFound(`Cliente con ID ${id} no encontrado para eliminar.`);
            // Aquí podrías añadir lógica para eliminar/desactivar AddressModel.deleteMany({ customerId: id })
            logger.info(`Cliente ${id} eliminado.`);
            return CustomerMapper.fromObjectToCustomerEntity(deletedCustomer);
        } catch (error) {
            logger.error(`Error eliminando cliente ${id}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al eliminar cliente.");
        }
    }
    async findByEmail(email: string): Promise<CustomerEntity | null> {
        try {
            const customer = await CustomerModel.findOne({ email: email.toLowerCase() })
                .populate({ path: 'neighborhood', populate: { path: 'city' } });
            if (!customer) return null;
            return CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            logger.error(`Error buscando cliente por email ${email}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al buscar por email.");
        }
    }
    async findByNeighborhood(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        const { limit, page } = paginationDto;
        try {
            if (!mongoose.Types.ObjectId.isValid(neighborhoodId)) throw CustomError.badRequest("ID de barrio inválido");
            const customers = await CustomerModel.find({ neighborhood: neighborhoodId })
                .populate({ path: 'neighborhood', populate: { path: 'city' } })
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
            return customers.map(CustomerMapper.fromObjectToCustomerEntity);
        } catch (error) {
            logger.error(`Error buscando clientes por barrio ${neighborhoodId}:`, { error });
            if (error instanceof CustomError) { throw error; }
            throw CustomError.internalServerError("CustomerMongoDataSourceImpl, error interno del servidor al buscar por barrio.");
        }
    }
    async findByUserId(userId: string): Promise<CustomerEntity | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId)) return null; // ID inválido, devolver null
            const customer = await CustomerModel.findOne({ userId: userId })
                .populate({ path: 'neighborhood', populate: { path: 'city' } });
            if (!customer) return null;
            return CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            logger.error(`Error buscando cliente por userId ${userId}:`, { error });
            // Es importante no lanzar un 500 aquí si la búsqueda falla por otra razón
            // que no sea error del servidor, devolver null es más seguro.
            return null;
        }
    }

    // <<<--- IMPLEMENTACIÓN MÉTODOS ADDRESS --- >>>

    async createAddress(createAddressDto: CreateAddressDto): Promise<AddressEntity> {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info(`[Address] Iniciando TX para crear dirección para Cliente: ${createAddressDto.customerId}`);
        try {
            // Validar que el barrio exista y obtener la ciudad asociada
            const neighborhood = await NeighborhoodModel.findById(createAddressDto.neighborhoodId).session(session).lean();
            if (!neighborhood) {
                throw CustomError.badRequest(`Barrio con ID ${createAddressDto.neighborhoodId} no encontrado.`);
            }
            const cityId = neighborhood.city; // Obtener ID de ciudad del barrio

            // Si es la primera dirección o isDefault es true, desmarcar otras por defecto
            if (createAddressDto.isDefault) {
                await AddressModel.updateMany(
                    { customerId: createAddressDto.customerId, isDefault: true },
                    { $set: { isDefault: false } },
                    { session }
                );
                logger.debug(`[Address] Direcciones anteriores desmarcadas como default para Cliente: ${createAddressDto.customerId}`);
            } else {
                const existingAddressesCount = await AddressModel.countDocuments({ customerId: createAddressDto.customerId }).session(session);
                if (existingAddressesCount === 0) {
                    createAddressDto.isDefault = true;
                    logger.debug(`[Address] Marcando primera dirección como default para Cliente: ${createAddressDto.customerId}`);
                }
            }

            const addressData = {
                customerId: createAddressDto.customerId,
                recipientName: createAddressDto.recipientName,
                phone: createAddressDto.phone,
                streetAddress: createAddressDto.streetAddress,
                postalCode: createAddressDto.postalCode,
                neighborhood: createAddressDto.neighborhoodId, // Usar el ID validado
                city: cityId, // Usar el ID obtenido del barrio
                additionalInfo: createAddressDto.additionalInfo,
                isDefault: createAddressDto.isDefault,
                alias: createAddressDto.alias,
            };

            const newAddressArray = await AddressModel.create([addressData], { session });
            const newAddress = newAddressArray[0];
            logger.info(`[Address] Dirección ${newAddress._id} creada en sesión para Cliente: ${createAddressDto.customerId}`);

            await session.commitTransaction();
            logger.info(`[Address] TX commit para creación de dirección ${newAddress._id}`);

            const populatedAddress = await this.findAddressByIdInternal(newAddress._id.toString());
            if (!populatedAddress) throw CustomError.internalServerError("Error recuperando dirección recién creada");
            return populatedAddress;
        } catch (error) {
            logger.error(`[Address] Error en TX para crear dirección, rollback...`, { error, customerId: createAddressDto.customerId });
            await session.abortTransaction();
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al crear la dirección.");
        } finally {
            session.endSession();
            logger.info(`[Address] Sesión finalizada para creación de dirección.`);
        }
    }

    async getAddressesByCustomerId(customerId: string, paginationDto: PaginationDto): Promise<AddressEntity[]> {
        const { page, limit } = paginationDto;
        try {
            if (!mongoose.Types.ObjectId.isValid(customerId)) return [];
            const addresses = await AddressModel.find({ customerId })
                .populate({ path: 'neighborhood', populate: { path: 'city' } })
                .populate('city')
                .limit(limit).skip((page - 1) * limit)
                .sort({ isDefault: -1, createdAt: -1 });
            return AddressMapper.fromObjectListToEntityList(addresses);
        } catch (error) {
            logger.error(`[Address] Error obteniendo direcciones para cliente ${customerId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al obtener direcciones.");
        }
    }

    private async findAddressByIdInternal(addressId: string): Promise<AddressEntity | null> {
        if (!mongoose.Types.ObjectId.isValid(addressId)) return null;
        const address = await AddressModel.findById(addressId)
            .populate({ path: 'neighborhood', populate: { path: 'city' } })
            .populate('city') // Poblar ciudad explícitamente también
            .lean();
        if (!address) return null;
        try {
            return AddressMapper.fromObjectToAddressEntity(address);
        } catch (mapperError) {
            logger.error(`[Address] Error mapeando dirección ${addressId} encontrada:`, { mapperError, addressData: address });
            // Decide cómo manejar esto: devolver null o lanzar un error interno
            // Lanzar error puede ser mejor para indicar corrupción de datos o problemas de mapper.
            throw CustomError.internalServerError("Error interno al procesar los datos de la dirección.");
        }
    }

    async findAddressById(addressId: string): Promise<AddressEntity | null> {
        try {
            return await this.findAddressByIdInternal(addressId);
        } catch (error) {
            logger.error(`[Address] Error buscando dirección por ID ${addressId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al buscar dirección por ID.");
        }
    }

    async updateAddress(addressId: string, updateAddressDto: UpdateAddressDto): Promise<AddressEntity | null> {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info(`[Address] Iniciando TX para actualizar dirección: ${addressId}`);
        try {
            if (!mongoose.Types.ObjectId.isValid(addressId)) throw CustomError.badRequest("ID de dirección inválido");
            const existingAddress = await AddressModel.findById(addressId).session(session);
            if (!existingAddress) throw CustomError.notFound("Dirección no encontrada");

            const updateFields: any = {};
            let newCityId = existingAddress.city; // Mantener ciudad actual por defecto

            if (updateAddressDto.neighborhoodId && updateAddressDto.neighborhoodId !== existingAddress.neighborhood.toString()) {
                const newNeighborhood = await NeighborhoodModel.findById(updateAddressDto.neighborhoodId).session(session).lean();
                if (!newNeighborhood) throw CustomError.badRequest(`Nuevo barrio ID ${updateAddressDto.neighborhoodId} no encontrado.`);
                updateFields.neighborhood = updateAddressDto.neighborhoodId;
                newCityId = newNeighborhood.city;
                updateFields.city = newCityId;
                logger.debug(`[Address] Barrio cambiado a ${updateAddressDto.neighborhoodId}, Ciudad actualizada a ${newCityId}`);
            } else if (updateAddressDto.cityId && updateAddressDto.cityId !== existingAddress.city.toString()) {
                const newCity = await CityModel.findById(updateAddressDto.cityId).session(session).lean();
                if (!newCity) throw CustomError.badRequest(`Nueva ciudad ID ${updateAddressDto.cityId} no encontrada.`);
                updateFields.city = updateAddressDto.cityId;
                newCityId = new mongoose.Types.ObjectId(updateAddressDto.cityId);
                logger.debug(`[Address] Ciudad cambiada explícitamente a ${updateAddressDto.cityId}`);
                // Podrías añadir validación aquí para asegurar que el barrio existente pertenezca a la nueva ciudad
            }

            if (updateAddressDto.isDefault === true && !existingAddress.isDefault) {
                await AddressModel.updateMany(
                    { customerId: existingAddress.customerId, _id: { $ne: addressId }, isDefault: true },
                    { $set: { isDefault: false } }, { session }
                );
                logger.debug(`[Address] Desmarcado default anterior para Cliente: ${existingAddress.customerId}`);
                updateFields.isDefault = true;
            } else if (updateAddressDto.isDefault === false && existingAddress.isDefault) {
                // Prevenir desmarcar si es la única dirección
                const count = await AddressModel.countDocuments({ customerId: existingAddress.customerId }).session(session);
                if (count <= 1) {
                    throw CustomError.badRequest("No puedes desmarcar la única dirección como predeterminada.");
                }
                updateFields.isDefault = false;
            } else if (updateAddressDto.isDefault !== undefined) {
                updateFields.isDefault = updateAddressDto.isDefault; // Aplicar si no es cambio de true->true o false->false
            }


            // Aplicar otros campos del DTO
            if (updateAddressDto.recipientName !== undefined) updateFields.recipientName = updateAddressDto.recipientName;
            if (updateAddressDto.phone !== undefined) updateFields.phone = updateAddressDto.phone;
            if (updateAddressDto.streetAddress !== undefined) updateFields.streetAddress = updateAddressDto.streetAddress;
            if ('postalCode' in updateAddressDto) updateFields.postalCode = updateAddressDto.postalCode;
            if ('additionalInfo' in updateAddressDto) updateFields.additionalInfo = updateAddressDto.additionalInfo;
            if ('alias' in updateAddressDto) updateFields.alias = updateAddressDto.alias;

            if (Object.keys(updateFields).length === 0) {
                logger.info(`[Address] No hay campos para actualizar en dirección ${addressId}.`);
                await session.commitTransaction(); // Commit vacío para cerrar TX
                return await this.findAddressByIdInternal(addressId); // Devolver la existente
            }

            const updatedAddress = await AddressModel.findByIdAndUpdate(
                addressId,
                { $set: updateFields },
                { new: true, runValidators: true, session }
            );
            if (!updatedAddress) throw CustomError.internalServerError("Fallo al actualizar la dirección.");
            logger.info(`[Address] Dirección ${addressId} actualizada en sesión`);

            await session.commitTransaction();
            logger.info(`[Address] TX commit para actualización dirección ${addressId}`);

            const populatedAddress = await this.findAddressByIdInternal(updatedAddress._id.toString());
            if (!populatedAddress) throw CustomError.internalServerError("Error recuperando dirección actualizada");
            return populatedAddress;

        } catch (error) {
            logger.error(`[Address] Error en TX para actualizar dirección ${addressId}, rollback...`, { error });
            await session.abortTransaction();
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al actualizar la dirección.");
        } finally {
            session.endSession();
            logger.info(`[Address] Sesión finalizada para actualización dirección.`);
        }
    }

    async deleteAddress(addressId: string, customerId: string): Promise<AddressEntity | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(addressId) || !mongoose.Types.ObjectId.isValid(customerId)) {
                throw CustomError.badRequest("ID de dirección o cliente inválido");
            }
            const deletedAddress = await AddressModel.findOneAndDelete({ _id: addressId, customerId: customerId })
                .populate({ path: 'neighborhood', populate: { path: 'city' } })
                .populate('city');

            if (!deletedAddress) {
                const exists = await AddressModel.findById(addressId);
                if (exists) throw CustomError.forbiden("No tienes permiso para eliminar esta dirección.");
                else throw CustomError.notFound("Dirección no encontrada.");
            }

            if (deletedAddress.isDefault) {
                logger.warn(`[Address] Dirección default ${addressId} eliminada para cliente ${customerId}. Buscando nueva default...`);
                const nextAddress = await AddressModel.findOneAndUpdate(
                    { customerId: customerId },
                    { $set: { isDefault: true } },
                    { new: true, sort: { createdAt: 1 } }
                );
                if (nextAddress) logger.info(`[Address] Dirección ${nextAddress._id} marcada como nueva default para cliente ${customerId}.`);
                else logger.info(`[Address] No hay otras direcciones para marcar como default.`);
            }
            logger.info(`[Address] Dirección ${addressId} eliminada para cliente ${customerId}`);
            return AddressMapper.fromObjectToAddressEntity(deletedAddress);
        } catch (error) {
            logger.error(`[Address] Error eliminando dirección ${addressId} para cliente ${customerId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al eliminar la dirección.");
        }
    }

    async setDefaultAddress(addressId: string, customerId: string): Promise<boolean> {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info(`[Address] Iniciando TX para setear default: Addr ${addressId}, Cust ${customerId}`);
        try {
            if (!mongoose.Types.ObjectId.isValid(addressId) || !mongoose.Types.ObjectId.isValid(customerId)) {
                throw CustomError.badRequest("ID de dirección o cliente inválido");
            }
            const unsetResult = await AddressModel.updateMany(
                { customerId: customerId, isDefault: true, _id: { $ne: addressId } },
                { $set: { isDefault: false } }, { session }
            );
            logger.debug(`[Address] Desmarcado ${unsetResult.modifiedCount} anterior(es) default para Cliente ${customerId}`);
            const setResult = await AddressModel.updateOne(
                { _id: addressId, customerId: customerId },
                { $set: { isDefault: true } }, { session }
            );
            if (setResult.matchedCount === 0) throw CustomError.notFound("Dirección no encontrada o no pertenece al usuario.");
            if (setResult.modifiedCount === 0) logger.warn(`[Address] Dirección ${addressId} ya era default o no se modificó.`);
            else logger.info(`[Address] Dirección ${addressId} marcada como default para Cliente ${customerId}`);
            await session.commitTransaction();
            logger.info(`[Address] TX commit para setear default ${addressId}`);
            return true;
        } catch (error) {
            logger.error(`[Address] Error en TX setear default ${addressId}, rollback...`, { error });
            await session.abortTransaction();
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al marcar dirección como predeterminada.");
        } finally {
            session.endSession();
            logger.info(`[Address] Sesión finalizada para setear default.`);
        }
    }
    // <<<--- FIN IMPLEMENTACIÓN ADDRESS --- >>>
}