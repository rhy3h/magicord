import request from "request";

export class WeatherAPI {
  private api_key: string;

  constructor(apiKey: string) {
    this.api_key = apiKey;
  }

  public getTaipeiWeather() {
    return new Promise((resolve, reject) => {
      request.get(
        `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${this.api_key}&format=JSON&locationName=%E8%87%BA%E5%8C%97%E5%B8%82`,
        {},
        (error, response, body) => {
          if (error) {
            reject();
            return;
          }

          const weather = JSON.parse(body);
          if (weather.success != "true") {
            reject();
            return;
          }

          const timeStamp = ["早", "中", "晚"];
          const minT = weather.records.location[0].weatherElement.find(
            (w: any) => {
              return w.elementName == "MinT";
            }
          );
          const maxT = weather.records.location[0].weatherElement.find(
            (w: any) => {
              return w.elementName == "MaxT";
            }
          );

          const result = [];
          for (let i = 0; i < timeStamp.length; i++) {
            const minTemp = `${minT.time[i].parameter.parameterName}°${minT.time[i].parameter.parameterUnit}`;
            const maxTemp = `${maxT.time[i].parameter.parameterName}°${maxT.time[i].parameter.parameterUnit}`;
            const temp = `${minTemp}～${maxTemp}`;
            result.push(temp);
          }
          resolve(result);
          return;
        }
      );
    });
  }
}
