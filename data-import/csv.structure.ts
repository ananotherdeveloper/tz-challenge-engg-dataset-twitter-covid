export type CSVStructure = {
    user_name: string;
    user_location: string | null;
    user_description: string | null;
    user_created: string;
    user_followers: number;
    user_friends: number;
    user_favourites: number;
    user_verified: string;
    date: string;
    text: string;
    hashtags: string[];
    source: string;
    is_retweet: string;
}