import mongoose from "mongoose";

interface IOptions{
    p_mongoUrl: string,
    p_dbName: string
}


export class MongoDatabase {

    static async connect(options: IOptions){

        const {p_dbName, p_mongoUrl} = options

        try {
            
            await mongoose.connect(p_mongoUrl, {
                dbName: p_dbName
            })

            console.log("Mongo connected")
            console.log("App using MongoDB connection:", mongoose.connection.id);
            return true

        } catch (error) {
            console.log("Mongo connection error")
            throw error;
        }
    }
}