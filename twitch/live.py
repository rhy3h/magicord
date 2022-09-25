import os
import dotenv
import requests

dotenv.load_dotenv()

client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')
streamer_name = os.getenv('STREAMER_NAME')


def is_live():
    body = {
        'client_id': client_id,
        'client_secret': client_secret,
        "grant_type": 'client_credentials'
    }
    r = requests.post(
        'https://id.twitch.tv/oauth2/token',
        body
    )

    keys = r.json()

    headers = {
        'Client-ID': client_id,
        'Authorization': 'Bearer ' + keys['access_token']
    }

    stream = requests.get(
        'https://api.twitch.tv/helix/streams?user_login=' + streamer_name,
        headers=headers
    )

    stream_data = stream.json()

    return stream_data['data']
