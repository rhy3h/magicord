import discord

from discord.ext import tasks
from twitch.live import is_live

import datetime


import json

# Opening JSON file
with open('config.json', 'r') as file:
    configSettings = json.load(file)
print(configSettings)

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
        channel = client.get_channel(
            configSettings["Discord"]["Channel_ID"]["NOTIFY"])
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

        numberOfMembersChannel = client.get_channel(
            configSettings["Discord"]["Channel_ID"]["MEMBER_NUNBER"])
        await numberOfMembersChannel.edit(name=f"人數：{len(client.guilds[0].members)}")


@client.event
async def on_ready():
    print(f'機器人登入囉 {client.user}')
    member_count_task.start()
    live_notify_task.start()

    voiceCategoryChannel = client.get_channel(
        configSettings["Discord"]["Channel_ID"]["VOICE_CHANNEL"])
    for voiceChannel in voiceCategoryChannel.voice_channels:
        if voiceChannel.id != configSettings["Discord"]["Channel_ID"]["VOICE_PORTAL"]:
            await voiceChannel.delete()


@client.event
async def on_member_join(member):
    channel = client.get_channel(
        configSettings["Discord"]["Channel_ID"]["JOIN"])

    await channel.send(f"{member.mention}")


@client.event
async def on_member_remove(member):
    channel = client.get_channel(
        configSettings["Discord"]["Channel_ID"]["REMOVE"])

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
    if after.channel is not None and after.channel.id == configSettings["Discord"]["Channel_ID"]["VOICE_PORTAL"]:
        channel = client.get_channel(
            configSettings["Discord"]["Channel_ID"]["VOICE_CHANNEL"])
        tempVoiceChannel = await channel.create_voice_channel(str(member))
        tempVoiceChannels[member.id] = tempVoiceChannel.id
        await member.move_to(tempVoiceChannel)


@client.event
async def on_raw_reaction_add(payload):
    if payload.message_id == configSettings["Discord"]["Channel_ID"]["ROLE_MESSAGE"]:
        guild = client.get_guild(payload.guild_id)
        role = guild.get_role(
            configSettings["Discord"]["Channel_ID"]["TEST_ROLE"])
        await payload.member.add_roles(role)


client.run(configSettings["Discord"]["TOKEN"])
