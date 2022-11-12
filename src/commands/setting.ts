import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { Setting } from "../components/Setting";
import { IChannel } from "../utilities/dc-client";

class SettingCommand extends SlashCommand {
  constructor() {
    super();
    this.setName("setting")
      .setDescription("Just a setting")
      .setNameLocalizations({ "zh-TW": "設定" })
      .setDescriptionLocalizations({ "zh-TW": "就是設定" });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    const component = new Setting(interaction, channelData);

    await interaction.reply({
      embeds: component.embed,
      components: component.row,
    });
  }
}

module.exports = new SettingCommand();
