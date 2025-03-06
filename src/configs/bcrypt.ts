// src/configs/bcrypt.ts
import { compareSync, hashSync } from "bcryptjs"

export class BcryptAdapter {
    static hash(password: string): string {        
        // Siempre especificar un salt rounds (10 es un valor común)
        return hashSync(password, 10);
    }
    
    static compare(originalPassword: string, hashedPassword: string): boolean {
        // Implementar un log para depuración
        const result = compareSync(originalPassword, hashedPassword);
        console.log(`Comparing passwords - Original: [hidden], Hashed: ${hashedPassword}, Result: ${result}`);
        return result;
    } 
}