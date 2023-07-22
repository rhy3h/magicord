import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { CwbWeather } from "../libs/cwb-weather";

const Location = new Map([["taipei", "F-D0047-061"]]);
class TestCommand extends SlashCommand {
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
              .addChoices(
                { name: "北投區", value: "北投區" },
                { name: "士林區", value: "士林區" },
                { name: "內湖區", value: "內湖區" },
                { name: "中山區", value: "中山區" },
                { name: "大同區", value: "大同區" },
                { name: "松山區", value: "松山區" },
                { name: "南港區", value: "南港區" },
                { name: "中正區", value: "中正區" },
                { name: "萬華區", value: "萬華區" },
                { name: "信義區", value: "信義區" },
                { name: "大安區", value: "大安區" },
                { name: "文山區", value: "文山區" }
              )
          )
      );
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    let apiId = Location.get(interaction.options.getSubcommand()) ?? "";
    let locationName = interaction.options.getString("location");

    let weatherDatas = await new CwbWeather(
      process.env.CWB_API
    ).getForecast24hrs(apiId, locationName);

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

module.exports = new TestCommand();
