import request from "request";

class TwitchStatus {
  public title: string;
  public user_login: string;
  public user_name: string;
  public started_at: string;
  public thumbnail_url: string;

  constructor(
    title: string,
    user_login: string,
    user_name: string,
    started_at: string,
    thumbnail_url: string
  ) {
    this.title = title;
    this.user_login = user_login;
    this.user_name = user_name;
    this.started_at = started_at;
    this.thumbnail_url = thumbnail_url;
  }
}

class TwitchLive {
  private client_id: string;
  private client_secret: string;

  constructor(client_id: string, client_secret: string) {
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  private getAccessToken() {
    return new Promise((resolve) => {
      request.post(
        {
          url: "https://id.twitch.tv/oauth2/token",
          json: true,
          body: {
            client_id: this.client_id,
            client_secret: this.client_secret,
            grant_type: "client_credentials",
          },
        },
        (error, response, body) => {
          resolve(body);
        }
      );
    });
  }

  private getStream(access_token: string, streamer_name: string) {
    return new Promise((resolve) => {
      request.get(
        {
          url: `https://api.twitch.tv/helix/streams?user_login=${streamer_name}`,
          json: true,
          headers: {
            "Client-ID": this.client_id,
            Authorization: `Bearer ${access_token}`,
          },
        },
        (error, response, body) => {
          resolve(body?.data);
        }
      );
    });
  }

  public async getStreamNotify(streamer_name: string) {
    return new Promise(async (resolve) => {
      let result = <any>await this.getAccessToken();
      let stream = <any>(
        await this.getStream(result.access_token, streamer_name)
      );
      if (!stream || stream?.length == 0) {
        resolve(null);
        return;
      }
      const { title, user_login, user_name, started_at, thumbnail_url } =
        stream[0];
      resolve(
        new TwitchStatus(
          title,
          user_login,
          user_name,
          started_at,
          thumbnail_url
        )
      );
    });
  }
}

export { TwitchLive, TwitchStatus };
