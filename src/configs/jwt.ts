// src/configs/jwt.ts
import jwt from "jsonwebtoken"
import { envs } from "./envs"
import { SignOptions } from "jsonwebtoken"

const JWT_SEED: string = envs.JWT_SEED

export class JwtAdapter {

    //el payload es la informacion que quiero guardar en el token
    static async generateToken(payload: Object, duration: string | any = '2h'): Promise<string | null> {

        return new Promise((resolve) => {
            const options: SignOptions = {
                expiresIn: duration
            };

            // Usamos la versión sincrónica para evitar problemas de tipos
            try {
                const token = jwt.sign(payload, JWT_SEED, options);
                resolve(token);
            } catch (err) {
                console.error('Error al generar token:', err);
                resolve(null);
            }
        })
    }


    //aca valido el token y devuelvo el payload
    static validateToken<T>(token: string): Promise<T | null> {
        return new Promise((resolve) => {
            try {
                const decoded = jwt.verify(token, JWT_SEED);
                resolve(decoded as T);
            } catch (err) {
                //si hay un error devuelvo null
                console.error('Error al validar token:', err);
                resolve(null);
            }
        })
    }
}