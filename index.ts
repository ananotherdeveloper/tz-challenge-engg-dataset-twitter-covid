import express from "express";
import { MongoConnection } from './mongo/connection';
import { RedisCache } from './cache/redis';
import { ImportTweetDataFromCsv } from "./data-import/import";
import { SortedSetKeys, RedisSortedSetResult } from './constants';
import { config } from "dotenv";
import { MongoModels } from "./mongo/models";
import { PostgresConnection } from './postgres/pg.connection';
import { PgRepository } from './postgres/pg.repository';
import moment from "moment";
var cors = require('cors');

(() => {

    config();
    let intervalId: NodeJS.Timeout;

    MongoConnection.InitDb().then(mongoConnection => {
        RedisCache.InitRedis().then(async (redisConnection) => {

            try {
                await new Promise((res, rej) => setTimeout(() => { res(); }, 15 * 1000));
                await PostgresConnection.init();
                console.log("Postgres Connected sucessfully");
            } catch (error) {
                console.error("Postgres not available");
                process.exit(1);
            }

            console.log(`Starting Web Server on port ${22344}`);

            const postgresRepo = new PgRepository();

            const server = express();
            server.use(cors());

            //#region REDIS END POINTS

            // Route to Get hashtag Data.
            server.get("/redis/hashtags", async (req, res) => {

                const fromSet = await RedisCache.getTopSixSSet(SortedSetKeys.HashTags);
                fromSet.sort((a, b) => a.count - b.count);

                const totalHashTags = fromSet.pop();

                let sumOfTop5 = 0;
                for (const val of fromSet) { sumOfTop5 += val.count; }

                fromSet.push({ count: totalHashTags!.count - sumOfTop5, key: "Others" });

                res.json(fromSet);
            });

            // Route to Get Mentions.
            server.get("/redis/mentions", async (req, res) => {

                const fromSet = await RedisCache.getTopSixSSet(SortedSetKeys.Mentions);
                fromSet.sort((a, b) => a.count - b.count);

                const totalMentions = fromSet.pop();
                let sumOfTop5 = 0;
                for (const val of fromSet) { sumOfTop5 += val.count; }

                fromSet.push({ count: totalMentions!.count - sumOfTop5, key: "Others" });

                res.json(fromSet);
            });

            // Route to Fetch Tweet stats per Dates.
            server.get("/redis/covid/tweet-stats", async (req, res) => {
                const distributions = await RedisCache.getCompleteSortedSet(SortedSetKeys.CovidTweetDistribution);

                const results: RedisSortedSetResult[] = [];

                // Transform KEYS to Date format -> "YYYY-MM-DD"
                for (const data of distributions) {
                    results.push({
                        count: data.count, key: data.key.replace("_", "-").replace("_", "-")
                    });
                }

                results.sort((a, b) => {
                    if (moment(a.key).isBefore(moment(b.key))) {
                        return -1;
                    }
                    return 1;
                });

                res.json(results.sort());
            });

            //#endregion


            //#region Postgres END POINTS

            // Route to Get hashtag Data.
            server.get("/postgres/hashtags", async (req, res) => {

                const fromMatView = await postgresRepo.getTopFiveHashtags();
                const totalHashTags = await postgresRepo.getTotalHashTags();

                let sumOfTop5 = 0;
                for (const val of fromMatView) { sumOfTop5 += val.count; }

                fromMatView.push({ count: totalHashTags - sumOfTop5, key: "Others" });

                res.json(fromMatView);
            });

            // Route to Get Mentions.
            server.get("/postgres/mentions", async (req, res) => {

                const fromMatView = await postgresRepo.getTopFiveMentions();
                const totalHashTags = await postgresRepo.getTotalMentions();

                let sumOfTop5 = 0;
                for (const val of fromMatView) { sumOfTop5 += val.count; }

                fromMatView.push({ count: totalHashTags - sumOfTop5, key: "Others" });

                res.json(fromMatView);
            });

            // Route to Fetch Tweet stats per Dates.
            server.get("/postgres/covid/tweet-stats", async (req, res) => {
                const distributions = await postgresRepo.getDateDistributions();

                res.json(distributions);
            });

            //#endregion

            server.listen(22344);
            // refresh postgres MAT VIEW every 5 minutes.
            intervalId = setInterval(() => postgresRepo.refreshMatViews(), 1000 * 60 * 2);
            process.on("exit", () => { clearInterval(intervalId); });

            if (!await MongoModels.UsersModel().countDocuments()) {

                console.log("Flushing complete Redis DB");
                await redisConnection.flushall();
                console.log("Redis DB Flushed");

                console.log(`Importing Data from CSV, please wait`);
                await ImportTweetDataFromCsv();
                console.log(`CSV Import Completed.`);
                await postgresRepo.refreshMatViews();
            }
        });
    });

})();

