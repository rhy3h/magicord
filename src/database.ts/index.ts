import fs from "fs/promises";

export class DataBase {
  private guild_id: string;
  private location: string;

  constructor(guild_id: string) {
    this.guild_id = guild_id;
    this.location = `${process.env.APPDATA}/magicord-db`;
  }

  public async select() {
    let buffer: Buffer;

    try {
      buffer = await fs.readFile(`${this.location}/${this.guild_id}.json`);
    } catch (error) {
      throw new Error("DB not exist");
    }

    return JSON.parse(new TextDecoder().decode(buffer)) as DB;
  }
}
