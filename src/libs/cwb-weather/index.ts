import axios from "axios";

function mappingWeatherStatusToIcon(weatherStatus: string) {
  switch (weatherStatus) {
    case "晴天":
      return "☀️";
    case "晴時多雲":
      return "🌤️";
    case "多雲時晴":
      return "⛅";
    case "多雲":
      return "🌥️";
    case "多雲時陰":
    case "陰時多雲":
    case "陰天":
      return "☁️";
    default:
      return "🌧️";
  }
}

function mappingNumToEmoji(num: string) {
  switch (num) {
    case "1":
      return "1️⃣";
    case "2":
      return "2️⃣";
    case "3":
      return "3️⃣";
    case "4":
      return "4️⃣";
    case "5":
      return "5️⃣";
    case "6":
      return "6️⃣";
    case "7":
      return "7️⃣";
    case "8":
      return "8️⃣";
    case "9":
      return "9️⃣";
    case "0":
      return "0️⃣";
  }
}

function tempToEmoji(temparture: string) {
  let result = "";
  for (let i = 0, l = temparture.length; i < l; i++) {
    result += mappingNumToEmoji(temparture[i]);
  }
  return result;
}

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
      weatherInfo[2] = `${tempToEmoji(weatherInfo[2].match(regex)?.[0])}°`;
      const date = data.startTime.split(" ");
      weatherDatas.push({
        name: `${date[0].slice(5)} ${date[1].slice(0, -3)}`,
        value: `${weatherInfo[1]}\n${mappingWeatherStatusToIcon(
          weatherInfo[0]
        )}\n${weatherInfo[2]}`,
      });
    });

    return {
      locationName: result?.data.records.locations[0].location[0].locationName,
      data: weatherDatas,
    };
  }
}

export { CwbWeather };
