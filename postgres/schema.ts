export type PGTweetSchema = {
    id: string;
    user_name: string;
    user_location: string | null;
    date: Date;
    text: string;
    source: string;
    is_retweet: boolean;
};

export type PGTweetHashTag = {
    tweetId: string;
    hashtag: string;
}

export type PGTweetMention = {
    tweetId: string;
    mention: string;
}

export type PGUserSchema = {
    user_name: string;
    user_description: string | null;
    user_created: Date;
    user_followers: number;
    user_friends: number;
    user_favourites: number;
    user_verified: boolean;
};

