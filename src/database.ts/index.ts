import fs from "fs/promises";

export class DataBase {
  private location: string;

  constructor(location: string) {
    this.location = location;
  }

  public async select(guild_id: string) {
    let buffer: Buffer;

    try {
      buffer = await fs.readFile(`${this.location}/${guild_id}.json`);
    } catch (error) {
      throw new Error("DB not exist");
    }

    return JSON.parse(new TextDecoder().decode(buffer));
  }
}
