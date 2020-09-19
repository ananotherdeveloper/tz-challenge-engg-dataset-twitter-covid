import { CSVStructure } from '../data-import/csv.structure';
import { UserSchema, TweetSchema } from '../mongo/schema/schema';
import { RedisCache } from '../cache/redis';
import { Query } from 'mongoose';
import { SortedSetKeys, SortedSetCountAllHashes } from '../constants';
import { MongoModels } from '../mongo/models';
import { v4 } from "uuid";
import { PGTweetHashTag, PGTweetMention, PGTweetSchema } from '../postgres/schema';
import { PgRepository } from '../postgres/pg.repository';

export async function parseIncomingTweet(data: CSVStructure) {

    const pgRepo = new PgRepository();

    data = parseHashtags(data);
    const mentions = extractMentionsFromTweet(data.text);

    const hashtags = data.hashtags;
    const tweetDate = new Date(data.date);

    // Prepare User Model
    const user: UserSchema = {
        user_created: new Date(data.user_created),
        user_description: data.user_description,
        user_favourites: data.user_favourites,
        user_followers: data.user_followers,
        user_friends: data.user_friends,
        user_name: data.user_name,
        user_verified: data.user_verified.toLowerCase() === "false" ? false : true
    };

    // Tweet Model
    const tweet: TweetSchema = {
        user_name: data.user_name,
        user_location: data.user_location,
        date: tweetDate,
        text: data.text,
        source: data.source,
        is_retweet: data.is_retweet.toLowerCase() === "false" ? false : true,
        hashtags: hashtags,
        mentions: mentions
    };

    const promises: (Promise<any> | Query<any>)[] = [];

    promises.push(MongoModels.UsersModel().updateOne(
        { user_name: user.user_name }, user,
        { upsert: true, multi: false, setDefaultsOnInsert: true }
    ));
    promises.push(MongoModels.TweetsModel().create(tweet));

    promises.push(...hashtags.map(hashtag => {
        return Promise.all([
            RedisCache.incrementSSetCount(SortedSetKeys.HashTags, hashtag),

            // Maintain a COUNT in ALL hashtag HASH.
            RedisCache.incrementSSetCount(SortedSetKeys.HashTags, SortedSetCountAllHashes.HashTagsAll),
        ])
    }));


    promises.push(...mentions.map(mention => {
        return Promise.all([
            RedisCache.incrementSSetCount(SortedSetKeys.Mentions, mention),

            // Maintain a COUNT in ALL mention HASH.
            RedisCache.incrementSSetCount(SortedSetKeys.Mentions, SortedSetCountAllHashes.MentionsAll),
        ])
    }));

    hashtags.forEach(hashtag => {

        if (!hashtag.toLowerCase().includes("covid")) { return; }

        // Count COVID hash-tagged tweets by date distribution.
        promises.push(
            RedisCache.incrementSSetCount(SortedSetKeys.CovidTweetDistribution, `${tweetDate.getFullYear()}_${tweetDate.getMonth() + 1}_${tweetDate.getDate()}`)
        );
    });

    handlePostgresInsertions(promises, tweet, pgRepo);

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error(error);
    }
}

function extractMentionsFromTweet(tweet: string): string[] {

    const mentions = [];
    for (let i = 0; i < tweet.length; i++) {

        if (tweet[i] === "@") {
            let mention = "";
            for (let j = i + 1; j < tweet.length; j++) {
                if (tweet[j] !== " " && tweet[j] !== "\\") {
                    mention += tweet[j];
                } else {
                    break;
                }
            }
            if (mention) {
                mentions.push(mention);
            }
        }
    }

    return mentions;
}

function parseHashtags(data: CSVStructure) {

    if (data.hashtags && data.hashtags.length) {

        if (typeof data.hashtags === "string") {

            const newStr = (data.hashtags as unknown as string).replace("[", "").replace("]", "");
            data.hashtags = newStr.split(",").map(x => x.replace("'", "").replace("'", "").trim());

        } else if (Array.isArray(data.hashtags)) {

            data.hashtags = data.hashtags.map(x => x.trim());

        }

    } else {
        data.hashtags = [];
    }

    return data;
}

function handlePostgresInsertions(promises: any[], tweet: TweetSchema, repo: PgRepository) {
    const id = v4();

    const tweets: PGTweetSchema = { id, ...tweet } as any;
    const tweetHashtags: PGTweetHashTag[] = (tweet.hashtags || []).map(x => ({ tweetId: id, hashtag: x })) || [];
    const tweetMentions: PGTweetMention[] = (tweet.mentions || []).map(x => ({ tweetId: id, mention: x })) || [];

    delete (tweets as any).hashtags;
    delete (tweets as any).mentions;

    promises.push(repo.insertTweet(tweets));

    tweetHashtags.forEach(ht => promises.push(repo.insertTweetHashtag(ht)));
    tweetMentions.forEach(m => promises.push(repo.insertTweetMention(m)));
}