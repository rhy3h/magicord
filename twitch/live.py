import requests

import json

with open('config.json', 'r') as file:
    configSettings = json.load(file)


def is_live():
    body = {
        'client_id': configSettings["Live"]["CLIENT_ID"],
        'client_secret': configSettings["Live"]["CLIENT_SECRET"],
        "grant_type": 'client_credentials'
    }
    r = requests.post(
        'https://id.twitch.tv/oauth2/token',
        body
    )

    keys = r.json()

    headers = {
        'Client-ID': configSettings["Live"]["CLIENT_ID"],
        'Authorization': 'Bearer ' + keys['access_token']
    }

    stream = requests.get(
        'https://api.twitch.tv/helix/streams?user_login=' +
        configSettings["Live"]["STREAMER_NAME"],
        headers=headers
    )

    stream_data = stream.json()

    return stream_data['data']
