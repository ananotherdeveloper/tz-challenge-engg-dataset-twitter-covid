import * as pg from "pg";

export class PostgresConnection {

    private static client: pg.Pool;

    public static getClient() {
        return PostgresConnection.client;
    }

    public static async init() {
        if (!PostgresConnection.client) {

            PostgresConnection.client = new pg.Pool({
                database: 'testdb',
                host: process.env.postgres_host,
                port: Number(process.env.postgres_port),
                user: 'postgres',
                password: 'pass123'
            });

            await PostgresConnection.client.connect();

            const tweet = `CREATE TABLE IF NOT EXISTS Tweet 
                (id VARCHAR (500)  PRIMARY KEY, user_name VARCHAR (500) ,user_location VARCHAR (500) ,date timestamp,text VARCHAR (500)  ,source VARCHAR (1000) ,is_retweet boolean)`;

            const tweetMention = `CREATE TABLE IF NOT EXISTS TweetHashTag 
                (tweetId VARCHAR (500), hashtag VARCHAR (150))`;

            const tweetHashtag = `CREATE TABLE IF NOT EXISTS TweetMention 
                (tweetId VARCHAR (500), mention VARCHAR (150))`;

            const data = await Promise.all([
                this.client.query(tweet),
                this.client.query(tweetMention),
                this.client.query(tweetHashtag)
            ]);

            const mat_hashtag = `
                CREATE MATERIALIZED VIEW IF NOT EXISTS public.hashtag_count
                TABLESPACE pg_default
                AS
                SELECT count(*) AS htcount,
                    twh.hashtag
                FROM tweethashtag twh
                GROUP BY twh.hashtag
                WITH DATA;

                ALTER TABLE public.hashtag_count
                    OWNER TO postgres;

                CREATE INDEX IF NOT EXISTS idx_mat_ht
                    ON public.hashtag_count USING btree
                    (htcount DESC)
                    TABLESPACE pg_default;
            `;

            const mat_mention = `
                CREATE MATERIALIZED VIEW IF NOT EXISTS public.mat_mention
                TABLESPACE pg_default
                AS
                SELECT count(*) AS mcount,
                    twm.mention
                FROM tweetmention twm
                GROUP BY twm.mention
                WITH DATA;

                ALTER TABLE public.mat_mention
                    OWNER TO postgres;


                CREATE INDEX IF NOT EXISTS idx_mat_mention_count
                    ON public.mat_mention USING btree
                    (mcount DESC)
                    TABLESPACE pg_default;
            `;

            const mat_date_distribution = `
                CREATE MATERIALIZED VIEW IF NOT EXISTS  public.mat_covid_tweet_distribution
                TABLESPACE pg_default
                AS
                SELECT count(*) AS date_count,
                    date(tw.date) AS date_part
                FROM tweethashtag twh
                    JOIN tweet tw ON twh.tweetid::text = tw.id::text
                WHERE twh.hashtag::text ~~ '%covid%'::text
                GROUP BY (date(tw.date))
                WITH DATA;

                ALTER TABLE public.mat_covid_tweet_distribution
                    OWNER TO postgres;
            `;

            await this.client.query(mat_hashtag);
            await this.client.query(mat_mention);
            await this.client.query(mat_date_distribution);
        }

        return PostgresConnection.client;
    }
}