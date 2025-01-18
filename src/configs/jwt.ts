import jwt, { decode } from "jsonwebtoken"

export class JwtAdapter {

    static async generateToken(payload: Object, duration: '2h'): Promise<string | null>{

        return new Promise((resolve)=>{
            
            //todo: generacion seed

            jwt.sign(payload, 'SEED', {expiresIn:duration}, (err, token)=>{
                
                if(err) return resolve(null)

                 resolve(token!)   
            })
        })
    }

    static validateToken<T>(token: string): Promise<T | null>  {
        return new Promise((resolve)=>{
            jwt.verify(token, 'SEED', (err, decoded)=>{
                
                if(err) return resolve(null)

                resolve(decoded as T)

            })
        })
    }
}