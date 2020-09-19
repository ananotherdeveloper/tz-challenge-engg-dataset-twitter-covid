export enum SortedSetKeys {
    HashTags = "HashTags",
    Mentions = "Mentions",
    CovidTweetDistribution = "CovidTweetDistribution"
}

export enum SortedSetCountAllHashes {
    HashTagsAll = "___||__||___AllHashTags__||__||___",
    MentionsAll = "___||__||___AllMentions__||__||___"
}

export enum MongoCollections {
    Users = "Users",
    Tweets = "Tweets"
}

export type RedisSortedSetResult = { key: string, count: number };

export type PostgresResult = RedisSortedSetResult;