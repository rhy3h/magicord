import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { Test } from "../components/Test";

class TestCommand extends SlashCommand {
  constructor() {
    super();
    this.setName("test")
      .setDescription("Just a test")
      .setNameLocalizations({ "zh-TW": "測試" })
      .setDescriptionLocalizations({ "zh-TW": "就是測試" });
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    const component = new Test();

    await interaction.reply({
      components: component.row,
    });
  }
}

module.exports = new TestCommand();
