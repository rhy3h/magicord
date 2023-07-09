import fs from "fs-extra";

export class DataBase {
  private location: string;

  constructor(location: string) {
    this.location = location;
  }

  public async select(guild_id: string) {
    const filename = `${this.location}/${guild_id}.json`;

    const result = await fs.exists(filename);
    if (!result) {
      await fs.outputJSON(filename, {
        twitch: [],
      });
    }

    let buffer = await fs.readFile(filename);
    return JSON.parse(new TextDecoder().decode(buffer));
  }

  public async update(guild_id: string, data: HistoryDB) {
    const filename = `${this.location}/${guild_id}.json`;

    try {
      await fs.writeFile(filename, JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  }
}
