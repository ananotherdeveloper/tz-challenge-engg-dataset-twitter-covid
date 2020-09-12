import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { ChartsModule } from 'ng2-charts';
import { HttpClientModule } from '@angular/common/http';
import { PieChartComponent } from './piechart/piechart';

@NgModule({
  imports: [BrowserModule, FormsModule, ChartsModule, HttpClientModule],
  declarations: [AppComponent, PieChartComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
