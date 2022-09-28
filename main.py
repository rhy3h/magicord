import os
import dotenv

import discord

from discord.ext import tasks
from twitch.live import is_live

import datetime

import re

import asyncio
import youtube_dl

# Suppress noise about console usage from errors
youtube_dl.utils.bug_reports_message = lambda: ''


ytdl_format_options = {
    'format': 'bestaudio/best',
    'outtmpl': '%(extractor)s-%(id)s-%(title)s.%(ext)s',
    'restrictfilenames': True,
    'noplaylist': True,
    'nocheckcertificate': True,
    'ignoreerrors': False,
    'logtostderr': False,
    'quiet': True,
    'no_warnings': True,
    'default_search': 'auto',
    # bind to ipv4 since ipv6 addresses cause issues sometimes
    'source_address': '0.0.0.0',
}

ffmpeg_options = {
    'options': '-vn',
}

ytdl = youtube_dl.YoutubeDL(ytdl_format_options)


dotenv.load_dotenv()
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
JOIN_ID = int(os.getenv('JOIN_ID'))
REMOVE_ID = int(os.getenv('REMOVE_ID'))
MEMBER_NUNBER_ID = int(os.getenv('MEMBER_NUNBER_ID'))
VOICE_PORTAL_ID = int(os.getenv('VOICE_PORTAL_ID'))
VOICE_CHANNEL_ID = int(os.getenv('VOICE_CHANNEL_ID'))
ROLE_MESSAGE_ID = int(os.getenv('ROLE_MESSAGE_ID'))
TEST_ROLE_ID = int(os.getenv('TEST_ROLE_ID'))
NOTIFY_ID = int(os.getenv('NOTIFY_ID'))

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.messages = True
intents.reactions = True

client = discord.Client(intents=intents)

live_status = False


@tasks.loop(seconds=60)
async def live_notify_task():
    log_path = './log.txt'
    log_txt = open(log_path, 'r')
    log_lines = []
    for line in log_txt.readlines():
        log_lines.append(line.replace("\n", ""))
    log_txt.close()

    global live_status
    channelStatus = is_live()

    if live_status and len(channelStatus) == 0:
        live_status = False
    if not live_status and len(channelStatus) == 1 and channelStatus[0]["started_at"] not in log_lines:
        live_status = True
        user_login = channelStatus[0]['user_login']
        user_name = channelStatus[0]['user_name']
        started_at = f"{channelStatus[0]['started_at']}\n"
        log_txt = open(log_path, 'a+')
        log_txt.write(started_at)
        log_txt.close()

        # Discord 通知
        channel = client.get_channel(NOTIFY_ID)
        await channel.send(f"https://www.twitch.tv/{user_login} {user_name} 開台了")


@tasks.loop(hours=24)
async def member_count_task():
    member_log_path = './member_log.txt'
    member_log_txt = open(member_log_path, 'r')
    member_log_lines = []
    for line in member_log_txt.readlines():
        member_log_lines.append(line.replace("\n", ""))
    member_log_txt.close()

    today = str(datetime.date.today())
    if today not in member_log_lines:
        print("更新人數")
        member_log_txt = open(member_log_path, 'a+')
        member_log_txt.write(f"{today}\n")
        member_log_txt.close()

        numberOfMembersChannel = client.get_channel(MEMBER_NUNBER_ID)
        await numberOfMembersChannel.edit(name=f"人數：{len(client.guilds[0].members)}")


@client.event
async def on_ready():
    print(f'機器人登入囉 {client.user}')
    member_count_task.start()
    live_notify_task.start()


@client.event
async def on_member_join(member):
    channel = client.get_channel(JOIN_ID)

    await channel.send(f"{member.mention}")


@client.event
async def on_member_remove(member):
    channel = client.get_channel(REMOVE_ID)

    await channel.send(f"{member.mention}")

tempVoiceChannels = {}


async def checkTempVoiceChannel(before, member):
    if before.channel is not None:
        if member.id in tempVoiceChannels:
            if before.channel.id == tempVoiceChannels[member.id]:
                await before.channel.delete()
                del tempVoiceChannels[member.id]


@client.event
async def on_voice_state_update(member, before, after):
    if before.channel is not None:
        await checkTempVoiceChannel(before, member)
    if after.channel is not None and after.channel.id == VOICE_PORTAL_ID:
        channel = client.get_channel(VOICE_CHANNEL_ID)
        tempVoiceChannel = await channel.create_voice_channel(str(member))
        tempVoiceChannels[member.id] = tempVoiceChannel.id
        await member.move_to(tempVoiceChannel)


@client.event
async def on_raw_reaction_add(payload):
    if payload.message_id == ROLE_MESSAGE_ID:
        guild = client.get_guild(payload.guild_id)
        role = guild.get_role(TEST_ROLE_ID)
        await payload.member.add_roles(role)


class YTDLSource(discord.PCMVolumeTransformer):
    def __init__(self, source, *, data, volume=0.5):
        super().__init__(source, volume)

        self.data = data

        self.title = data.get('title')
        self.url = data.get('url')

    @classmethod
    async def from_url(cls, url, *, loop=None, stream=False):
        loop = loop or asyncio.get_event_loop()
        data = await loop.run_in_executor(None, lambda: ytdl.extract_info(url, download=not stream))

        if 'entries' in data:
            # take first item from a playlist
            data = data['entries'][0]

        filename = data['url'] if stream else ytdl.prepare_filename(data)
        return cls(discord.FFmpegPCMAudio(filename, **ffmpeg_options, executable="./bin/ffmpeg.exe"), data=data)


@client.event
async def on_message(message):
    if message.channel.id == 1023497560972869655:
        if message.content.startswith('play'):
            play_split = message.content.split()
            if len(play_split) == 2:
                youtube_regex = (
                    r'(https?://)?(www\.)?'
                    '(youtube|youtu|youtube-nocookie)\.(com|be)/'
                    '(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
                )
                youtube_regex_match = re.match(youtube_regex, play_split[1])
                if youtube_regex_match:
                    print(f"網址: {play_split[1]}")
                    if client.guilds[0].voice_client is None:
                        channel = client.get_channel(1023497620800417812)
                        await channel.connect()
                        player = await YTDLSource.from_url(play_split[1], loop=False)
                        client.guilds[0].voice_client.play(player, after=lambda e: print(
                            f'Player error: {e}') if e else None)
                        await message.delete()
                        await message.channel.send(f"正在播放 {play_split[1]}")
                    # else:
                    # TODO: Push to queue
                else:
                    await message.delete()
            else:
                await message.delete()
        elif message.content.startswith('pause'):
            print("暫停")
        else:
            if client.user.id is not message.author.id:
                await message.delete()

client.run(DISCORD_TOKEN)
