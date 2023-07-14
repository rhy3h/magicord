import axios from "axios";

class CwbWeather {
  private API_KEY: string | undefined;
  private baseUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore";

  constructor(apiKey: string | undefined) {
    this.API_KEY = apiKey;
  }

  public async getForecast24hrs(apiId: string, locationName: string | null) {
    let result = await axios
      .get(`${this.baseUrl}/${apiId}`, {
        params: {
          Authorization: this.API_KEY,
          format: "JSON",
          locationName: locationName,
          elementName: ["WeatherDescription"].join(","),
        },
      })
      .catch(() => {});

    const datas =
      result?.data.records.locations[0].location[0].weatherElement[0].time.slice(
        0,
        9
      );
    const weatherDatas: Array<any> = [];
    datas?.forEach((data: any) => {
      const weatherInfos = data.elementValue[0].value.split("。");
      const weatherInfo = weatherInfos.slice(0, 4);
      const regex = /\d+/g;
      weatherInfo[1] = `${weatherInfo[1].match(regex)?.[0]}%`;
      weatherInfo[2] = `${weatherInfo[2].match(regex)?.[0]}°`;
      const date = data.startTime.split(" ");
      weatherDatas.push({
        name: `${date[0].slice(5)} ${date[1].slice(0, -3)}`,
        value: `${weatherInfo[2]} ${weatherInfo[0]} ${weatherInfo[1]}`,
      });
    });

    return {
      locationName: result?.data.records.locations[0].location[0].locationName,
      data: weatherDatas,
    };
  }
}

export { CwbWeather };
