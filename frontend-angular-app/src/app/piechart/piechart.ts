import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';


export type APIResult = { key: string, count: number };

@Component({
    selector: 'piechart',
    templateUrl: './piechart.html'
})
export class PieChartComponent implements OnInit {
    // Pie
    public pieChartType: string = 'pie';
    public horizontalBarChartType: string = "line";

    public hashTagData: { Labels: string[], data: number[] } = { Labels: [], data: [] };
    public mentionData: { Labels: string[], data: number[] } = { Labels: [], data: [] };

    public covidTweetsDateData: { Labels: string[], data: number[] } = { Labels: [], data: [] };

    public chartColors = [
        {
            backgroundColor: [
                'rgba(255,0,0,0.3)', 'rgba(0,255,0,0.3)', 'rgba(0,0,255,0.3)',
                'rgba(255, 233, 71, 0.5)', 'rgba(8, 233, 71, 0.5)', 'rgba(155, 121, 151, 0.6)', 'rgba(255,0,255,0.3)'
            ]
        },
    ];

    constructor(private httpClient: HttpClient) { }

    async ngOnInit() {
        const hashTagData = await this.httpClient.get<APIResult[]>("http://localhost:22344/hashtags").toPromise();
        const mentionData = await this.httpClient.get<APIResult[]>("http://localhost:22344/mentions").toPromise();
        const covidStatData = await this.httpClient.get<APIResult[]>("http://localhost:22344/covid/tweet-stats").toPromise();

        this.hashTagData.Labels = hashTagData.map(x => x.key);
        this.hashTagData.data = hashTagData.map(x => Number(x.count));

        this.mentionData.Labels = mentionData.map(x => x.key);
        this.mentionData.data = mentionData.map(x => Number(x.count));

        this.covidTweetsDateData.Labels = covidStatData.map(x => x.key);
        this.covidTweetsDateData.data = covidStatData.map(x => Number(x.count));
    }

}