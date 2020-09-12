import csvParser from "csv-parser";
import { join } from "path";
import * as fs from "fs";
import { parseIncomingTweet } from "../tweet-parser/tweet.parser";
import { CSVStructure } from "./csv.structure";

export function ImportTweetDataFromCsv() {

    const csvPath = join(__dirname, "..", "dataset", "covid19_tweets.csv");

    return new Promise((resolve, reject) => {

        if (!fs.existsSync(csvPath)) {
            reject("Cannot find CSV to parse");
        }

        const parsedCSV: CSVStructure[] = [];

        fs.createReadStream(csvPath, { autoClose: true, emitClose: true })
            .pipe(csvParser({ separator: "," }))
            .on("data", data => { parsedCSV.push(data) })
            .on("end", async () => {
                console.log(`Finished reading the CSV File\nNumber of records: ${parsedCSV.length}`);

                console.log(`${new Date().toISOString()}:  Begining to Dump Data in Redis and MongoDb`);

                let promiseArr = [];
                for (let i = 0; i < parsedCSV.length; i++) {
                    promiseArr.push(parseIncomingTweet(parsedCSV[i]));
                    if (promiseArr.length > 2000) {
                        await Promise.all(promiseArr);
                        promiseArr = [];
                    }
                }
                if (promiseArr.length) {
                    await Promise.all(promiseArr);
                    promiseArr = [];
                }
                console.log(`${new Date().toISOString()}:  Finished Dumping Data`);

                resolve();
            })
            .on("error", (err) => {
                console.log("Error while reading/parsing CSV file");
                console.error(err);
                reject(err);
            });

    });
}

