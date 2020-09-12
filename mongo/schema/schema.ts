import { Schema } from "mongoose";

export type TweetSchema = {
    user_name: string;
    user_location: string | null;
    date: Date;
    text: string;
    source: string;
    is_retweet: boolean;
    hashtags: string[] | null;
    mentions: string[] | null;
};

export type UserSchema = {
    user_name: string;
    user_description: string | null;
    user_created: Date;
    user_followers: number;
    user_friends: number;
    user_favourites: number;
    user_verified: boolean;
};

export function UsersSchema() {
    const schema = new Schema({
        user_name: Schema.Types.String,
        user_description: Schema.Types.String,
        user_created: Schema.Types.Date,
        user_followers: Schema.Types.Number,
        user_friends: Schema.Types.Number,
        user_favourites: Schema.Types.Number,
        user_verified: Schema.Types.Boolean
    });

    schema.index({ user_name: "hashed" });

    return schema;
}

export function TweetsSchema() {
    const schema = new Schema({
        user_name: Schema.Types.String,
        user_location: Schema.Types.String,

        date: Schema.Types.Date,
        text: Schema.Types.String,
        source: Schema.Types.String,

        is_retweet: Schema.Types.Boolean,
        hashtags: [Schema.Types.String],
        mentions: [Schema.Types.String]
    });

    schema.index({ user_name: 1 });
    schema.index({ user_name: -1 });

    return schema;
}