import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { envs } from "./envs"
import { UserEntity } from "../domain/entities/user.entity";

const baseSecret = envs.JWT_SEED

export class JwtPersonal {

    // Función para generar una semilla única por usuario usando bcrypt
    async getUserSecret(userId: string) {
    // Creamos una combinación única usando el ID de usuario y la semilla base
        const uniqueString = `${userId}-${baseSecret}`;
        // Generamos un hash con bcrypt (10 es el factor de costo, ajústalo según tus necesidades)
        const hashedSecret = await bcrypt.hash(uniqueString, 10);
        // Tomamos los primeros 32 caracteres del hash como semilla
        return hashedSecret.substring(0, 32);
    }
  
  
    // Generar token con semilla personalizada
  async generateUserToken(user: UserEntity) {
        const userSecret = await this.getUserSecret(user.id);
        return jwt.sign(
        { userId: user.id, email: user.email },
        userSecret,
        { expiresIn: '1h' }
        );
    }
  
  
    // Verificar token con semilla personalizada
  async verifyUserToken(token: string) {
        // Primero decodificamos sin verificar para obtener el userId
        const decoded = jwt.decode(token);
        if (!decoded) {
            throw new Error('Token malformado');
        }

        }
}