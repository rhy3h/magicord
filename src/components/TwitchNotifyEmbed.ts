import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { TwitchStatus } from "../libs/twitch";

class TwitchNotifyEmbed {
  public embed: EmbedBuilder;
  public row: ActionRowBuilder<ButtonBuilder>;

  constructor(streamerInfo: TwitchStatus) {
    this.embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(streamerInfo.user_name)
      .setURL(`https://www.twitch.tv/${streamerInfo.user_login}`)
      .setDescription(streamerInfo.title)
      .addFields({ name: "Playing", value: streamerInfo.game_name })
      .setImage(
        streamerInfo.thumbnail_url
          .replace("{width}", "1600")
          .replace("{height}", "900")
      )
      .setTimestamp(new Date(streamerInfo.started_at))
      .setFooter({
        text: "Twitch",
        iconURL: "https://cdn-icons-png.flaticon.com/512/4494/4494567.png",
      });

    this.row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Watch stream")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.twitch.tv/${streamerInfo.user_login}`)
    );
  }
}

export { TwitchNotifyEmbed };
