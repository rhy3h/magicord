import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { Test } from "../components/Test";
import { IChannel } from "../utilities/dc-client";

class TestCommand extends SlashCommand {
  constructor() {
    super();
    this.setName("test").setDescription("Just a test");
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    const component = new Test(interaction, channelData);

    await interaction.reply({
      embeds: component.embed,
      components: component.row,
    });
  }
}

module.exports = new TestCommand();
