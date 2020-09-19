import mongoose from "mongoose";

export class MongoConnection {

    private static dbConnection: mongoose.Mongoose;

    public static async InitDb(): Promise<mongoose.Mongoose> {

        if (this.dbConnection) {
            console.log("Mongodb already initialised");
            return this.dbConnection;
        }

        this.dbConnection = await mongoose.connect(`mongodb://${process.env.mongo_host}:${process.env.mongo_port}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            poolSize: 100,
            dbName: "kaggletweet"
        });

        console.log("Mongo connected sucessfully");

        return this.dbConnection;
    }

    public static getDbConnection(): mongoose.Mongoose {
        return this.dbConnection;
    }
}
