import express from "express";
import { MongoConnection } from './mongo/connection';
import { RedisCache } from './cache/redis';
import { ImportTweetDataFromCsv } from "./data-import/import";
import { SortedSetKeys, RedisSortedSetResult } from './constants';
import { config } from "dotenv";
import { MongoModels } from "./mongo/models";
var cors = require('cors');

(() => {

    config();

    MongoConnection.InitDb().then(mongoConnection => {
        RedisCache.InitRedis().then(async (redisConnection) => {

            console.log(`Starting Web Server on port ${22344}`);

            const server = express();
            server.use(cors());

            // Route to Get hashtag Data.
            server.get("/hashtags", async (req, res) => {

                const fromSet = await RedisCache.getTopSixSSet(SortedSetKeys.HashTags);
                fromSet.sort((a, b) => a.count - b.count);

                const totalHashTags = fromSet.pop();

                let sumOfTop5 = 0;
                for (const val of fromSet) { sumOfTop5 += val.count; }

                fromSet.push({ count: totalHashTags!.count - sumOfTop5, key: "Others" });

                res.json(fromSet);
            });

            // Route to Get Mentions.
            server.get("/mentions", async (req, res) => {

                const fromSet = await RedisCache.getTopSixSSet(SortedSetKeys.Mentions);
                fromSet.sort((a, b) => a.count - b.count);

                const totalMentions = fromSet.pop();
                let sumOfTop5 = 0;
                for (const val of fromSet) { sumOfTop5 += val.count; }

                fromSet.push({ count: totalMentions!.count - sumOfTop5, key: "Others" });

                res.json(fromSet);
            });

            // Route to Fetch Tweet stats per Dates.
            server.get("/covid/tweet-stats", async (req, res) => {
                const distributions = await RedisCache.getCompleteSortedSet(SortedSetKeys.CovidTweetDistribution);

                const results: RedisSortedSetResult[] = [];

                // Transform KEYS to Date format -> "YYYY-MM-DD"
                for (const data of distributions) {
                    results.push({
                        count: data.count, key: data.key.replace("_", "-").replace("_", "-")
                    });
                }

                res.json(results);
            });


            server.listen(22344);

            if (!await MongoModels.UsersModel().countDocuments()) {

                console.log("Flushing complete Redis DB");
                await redisConnection.flushall();
                console.log("Redis DB Flushed");

                console.log(`Importing Data from CSV, please wait`);
                await ImportTweetDataFromCsv();
                console.log(`CSV Import Completed.`);
            }

        });
    });

})();

