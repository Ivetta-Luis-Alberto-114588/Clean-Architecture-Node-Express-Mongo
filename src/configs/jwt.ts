import jwt from "jsonwebtoken"

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
}