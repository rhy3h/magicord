import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "@/components/SlashCommand";
import { CwbWeather } from "@/libs/cwb-weather";

const Cities = new Map([
  [
    "taipei",
    {
      apiId: "F-D0047-061",
      locations:
        "北投區,士林區,內湖區,中山區,大同區,松山區,南港區,中正區,萬華區,信義區,大安區,文山區",
    },
  ],
  [
    "new-taipei",
    {
      apiId: "F-D0047-069",
      locations:
        "石門區,三芝區,金山區,淡水區,萬里區,八里區,汐止區,林口區,五股區,瑞芳區,蘆洲區,雙溪區,三重區,貢寮區,平溪區,泰山區,新莊區,石碇區,板橋區,深坑區,永和區,樹林區,中和區,土城區,新店區,坪林區,鶯歌區,三峽區,烏來區",
    },
  ],
  [
    "keelung",
    {
      apiId: "F-D0047-049",
      locations: "安樂區,中山區,中正區,七堵區,信義區,仁愛區,暖暖區",
    },
  ],
]);

class WeatherCommand extends SlashCommand {
  constructor() {
    super();
    this.setName("weather")
      .setDescription("Search weather")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("taipei")
          .setDescription("Taipei")
          .addStringOption((option) =>
            option
              .setName("location")
              .setDescription("Location")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("new-taipei")
          .setDescription("New Taipei")
          .addStringOption((option) =>
            option
              .setName("location")
              .setDescription("Location")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("keelung")
          .setDescription("Keelung")
          .addStringOption((option) =>
            option
              .setName("location")
              .setDescription("Location")
              .setRequired(true)
          )
      );
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    const cityName = interaction.options.getSubcommand();
    const location = interaction.options.getString("location");

    const cityInfo = Cities.get(cityName);
    if (!cityInfo || !location) {
      return;
    }

    const locationName = cityInfo.locations
      .split(",")
      .find((f) => f.indexOf(location) > -1);
    if (!locationName) {
      await interaction.reply({
        embeds: [
          {
            title: `天氣預報查詢錯誤`,
            color: 0xcce0ff,
          },
        ],
      });
      return;
    }

    let weatherDatas = await new CwbWeather(
      process.env.CWB_API
    ).getForecast24hrs(cityInfo.apiId, locationName);

    await interaction
      .reply({
        embeds: [
          {
            title: `${weatherDatas.locationName}天氣預報`,
            color: 0xcce0ff,
            fields: weatherDatas.data.map((m) => {
              return { ...m, inline: true };
            }),
          },
        ],
      })
      .catch((error) => {
        console.log(`${error.name} ${error.message}`);
      });
  }
}

module.exports = new WeatherCommand();
