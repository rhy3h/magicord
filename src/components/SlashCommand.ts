import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { IChannel } from "../utilities/dc-client";

abstract class SlashCommand extends SlashCommandBuilder {
  constructor() {
    super();
  }

  abstract execute(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ): void;
}

export { SlashCommand };
