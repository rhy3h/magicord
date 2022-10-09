import * as fs from "fs";
import request from "request";

let configJson = fs.readFileSync("./utils/twitch/config.json");
let config = JSON.parse(configJson);

function getAccessToken() {
  return new Promise((resolve) => {
    request.post(
      {
        url: "https://id.twitch.tv/oauth2/token",
        json: true,
        body: {
          client_id: config.client_id,
          client_secret: config.client_secret,
          grant_type: "client_credentials",
        },
      },
      (error, response, body) => {
        resolve(body);
      }
    );
  });
}

function getStream(access_token) {
  return new Promise((resolve) => {
    request.get(
      {
        url: `https://api.twitch.tv/helix/streams?user_login=${config.streamer_name}`,
        json: true,
        headers: {
          "Client-ID": config.client_id,
          Authorization: `Bearer ${access_token}`,
        },
      },
      (error, response, body) => {
        resolve(body?.data);
      }
    );
  });
}

async function getStreamNotify() {
  let result = await getAccessToken();
  let stream = await getStream(result?.access_token);
  if (stream.length == 0) {
    return;
  }
  let streamNotifyPath = "./utils/twitch/stream_notify.txt";
  if (!fs.existsSync(streamNotifyPath)) {
    // 創建檔案
    fs.writeFileSync(streamNotifyPath);
    return;
  }

  // 讀取檔案
  let notified = fs.readFileSync(streamNotifyPath).toString("UTF8").split("\n");
  let notify = notified.find((t) => t == stream[0].started_at);

  if (notify) {
    return;
  }

  fs.writeFileSync(streamNotifyPath, `${stream[0].started_at}\n`);
  return stream[0];
}

export { getStreamNotify };
