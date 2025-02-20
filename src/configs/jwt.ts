import jwt, { decode } from "jsonwebtoken"
import { envs } from "./envs"

const JWT_SEED = envs.JWT_SEED

export class JwtAdapter {

    //el payload es la informacion que quiero guardar en el token
    static async generateToken(payload: Object, duration: string = '2h'): Promise<string | null>{

        return new Promise((resolve)=>{            
            
            jwt.sign(payload, JWT_SEED, {expiresIn:duration}, (err, token)=>{
                
                if(err) return resolve(null)

                 resolve(token!)   
            })
        })
    }


    //aca valido el token y devuelvo el payload
    static validateToken<T>(token: string): Promise<T | null>  {
        return new Promise((resolve)=>{
            jwt.verify(token, JWT_SEED, (err, decoded)=>{
                
                if(err) return resolve(null)

                resolve(decoded as T)

            })
        }) 
    }
}