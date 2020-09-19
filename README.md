## DEV Challenge - Parsing Covid19 Tweets

### Dataset Used: https://www.kaggle.com/gpreda/covid19-tweets

#### Tech Stack:
- Node.Js
- Redis   - for caching view data
- MongoDb - for persistence
- Postgres - For Materialized views
- Angular 10

> Pre-Requisite - You need docker to run it seamlessly.

### Steps To Run:
- Use your favourite terminal - descend to the Project root directory.
- Execute command "docker-compose up -d --build --force-recreate"
- Execute command "docker ps" and look for the container <b>api-kaggle-covid-test1</b>
- Now type 'docker logs <api-kaggle-covid-test1_CONTAINER_ID> -f'

> the CSV Import will be completed when this message is printed on CONSOLE - <b>CSV Import Completed</b>

The API will start Importing the Data and will start up the WEB SERVER at PORT : 22344

It generally takes around 3-4 minutes to import the CSV into MongoDb [and Redis cache]


### Steps to Run Front-End:
- Descend to 'frontend-angular-app' directory.
- Run 'npm i && npx ng serve'
-- This will run the Frontend at http://localhost:4200


#### API endpoints Exposed:

### REDIS Endpoints
- GET [http://localhost:22344/redis/hashtags] This endpoint fetches the TOP 5 hashtags.
- GET [http://localhost:22344/redis/mentions] This endpoint retrieves the Top 5 usernames mentioned in tweets
- GET [http://localhost:22344/redis/covid/tweet-stats] This endpoint retrieves the data for the Tweets that had hashtag matching to "covid".

### PostGres Endpoints
- GET [http://localhost:22344/postgres/hashtags] This endpoint fetches the TOP 5 hashtags.
- GET [http://localhost:22344/postgres/mentions] This endpoint retrieves the Top 5 usernames mentioned in tweets
- GET [http://localhost:22344/postgres/covid/tweet-stats] This endpoint retrieves the data for the Tweets that had hashtag matching to "covid".
