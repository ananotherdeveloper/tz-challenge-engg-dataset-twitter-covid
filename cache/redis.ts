import Redis from "ioredis";
import { SortedSetKeys, RedisSortedSetResult } from "../constants";

export class RedisCache {

    private static connection: Redis.Redis;

    public static async InitRedis() {

        if (RedisCache.connection) {
            throw new Error("Redis already initialised. Can be initialized only Once");
        }

        RedisCache.connection = new Redis(undefined, { db: 1, host: `${process.env.redis_host}`, port: Number(`${process.env.redis_port}`) });

        try {
            await RedisCache.connection.ping();
            console.log("Redis connected succesfully");

            return RedisCache.connection;
        } catch (error) {
            console.error("Cannot connect to redis");
            process.exit(2);
        }
    }

    public static incrementSSetCount = async (type: SortedSetKeys, hash: string) => await RedisCache.connection.zincrby(type, 1, hash);
    public static decrementSSetCount = async (type: SortedSetKeys, hash: string) => await RedisCache.connection.zincrby(type, -1, hash);
    public static getScoreSSetByHash = async (type: SortedSetKeys, hash: string) => await RedisCache.connection.zscore(type, hash);

    public static getCompleteSortedSet = async (type: SortedSetKeys) => await RedisCache.connection.zrange(type, 0, -1, "WITHSCORES").then(data => {
        return RedisCache.parseSortedSetResult(data);
    });

    public static getTopSixSSet = async (type: SortedSetKeys) => RedisCache.connection.zrange(type, -6, -1, "WITHSCORES").then(data => {
        return RedisCache.parseSortedSetResult(data);
    });

    private static parseSortedSetResult(data: string[]): RedisSortedSetResult[] {

        // data will always be an even length result array.
        // where the first element is "HASH" and second is "SCORE"
        // this is how we are parsing it.

        const results: RedisSortedSetResult[] = [];

        for (let i = 0; i < data.length; i = i + 2) {
            results.push({ key: data[i], count: Number(data[i + 1]) });
        }
        return results;
    }

}