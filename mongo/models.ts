import { UsersSchema, TweetsSchema } from "./schema/schema";
import { MongoCollections } from "../constants";
import { MongoConnection } from "./connection";
import { Document, Model } from "mongoose";

export class MongoModels {

    private static _userModel: Model<Document, {}>;
    private static _tweetModel: Model<Document, {}>;

    public static UsersModel() {
        if (!this._userModel) {
            this._userModel = MongoConnection.getDbConnection().model(MongoCollections.Users, UsersSchema());
        }
        return this._userModel;
    }

    public static TweetsModel() {
        if (!this._tweetModel) {
            this._tweetModel = MongoConnection.getDbConnection().model(MongoCollections.Tweets, TweetsSchema());
        }
        return this._tweetModel;
    }
}