import { Pool } from "pg";
import { PostgresConnection } from "./pg.connection";
import { PGTweetHashTag, PGTweetMention, PGTweetSchema } from "./schema";
import { PostgresResult } from '../constants';
import moment from 'moment';

export class PgRepository {

    private client: Pool;

    constructor() {
        this.client = PostgresConnection.getClient();
    }

    async insertTweet(model: Partial<PGTweetSchema>) {

        const query = {
            text: 'INSERT INTO Tweet(id, user_name,user_location,date,text,source,is_retweet) VALUES($1, $2, $3, $4,$5,$6,$7)',
            values: Object.values(model),
        }

        await this.client.query(query);
        return model;
    }

    async insertTweetHashtag(model: PGTweetHashTag) {

        const query = {
            text: "Insert into TweetHashTag (tweetId,hashtag) VALUES ($1, $2)",
            values: Object.values(model)
        }
        return await this.client.query(query);
    }

    async insertTweetMention(model: PGTweetMention) {
        const query = {
            text: "Insert into TweetMention (tweetId,mention) VALUES ($1, $2)",
            values: Object.values(model)
        }
        return await this.client.query(query);
    }

    async refreshMatViews() {
        const view1 = `REFRESH MATERIALIZED VIEW mat_covid_tweet_distribution WITH DATA;`;
        const view2 = `REFRESH MATERIALIZED VIEW hashtag_count WITH DATA;`;
        const view3 = `REFRESH MATERIALIZED VIEW mat_mention WITH DATA;`;

        await Promise.all([
            this.client.query(view1),
            this.client.query(view2),
            this.client.query(view3),
        ]);
    }

    async getTotalMentions(): Promise<number> {
        const query = `SELECT count(*) FROM public.TweetMention`;

        const data = await this.client.query(query);
        return +data.rows[0].count;
    }

    async getTotalHashTags(): Promise<number> {
        const query = `SELECT count(*) FROM public.TweetHashTag`;

        const data = ((await this.client.query(query)).rows[0]).count;
        return +data;
    }

    async getTopFiveMentions(): Promise<PostgresResult[]> {
        const query = `SELECT * FROM public.mat_mention order by mcount desc LIMIT 5`;

        const data = await (await this.client.query(query)).rows.map(x => ({ key: x.mention, count: +x.mcount }));
        return data as any;
    }

    async getTopFiveHashtags(): Promise<PostgresResult[]> {
        const query = `SELECT * FROM public.hashtag_count order by htcount DESC LIMIT 5`;

        const data = (await this.client.query(query)).rows.map(x => ({ key: x.hashtag, count: +x.htcount }));
        return data as any;
    }

    async getDateDistributions(): Promise<PostgresResult[]> {
        const query = `SELECT * FROM public.mat_covid_tweet_distribution;`;

        const data = (await this.client.query(query)).rows.map(x => ({ key: moment(x.date_part).format("YYYY-MM-DD"), count: +x.date_count }));

        data.sort((a, b) => {
            if (moment(a.key).isBefore(moment(b.key))) {
                return -1;
            }
            return 1;
        });

        return data;
    }

}