import os
import dotenv

import discord

dotenv.load_dotenv()
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
JOIN_ID = int(os.getenv('JOIN_ID'))
REMOVE_ID = int(os.getenv('REMOVE_ID'))
MEMBER_NUNBER_ID = int(os.getenv('MEMBER_NUNBER_ID'))
VOICE_PORTAL_ID = int(os.getenv('VOICE_PORTAL_ID'))
VOICE_CHANNEL_ID = int(os.getenv('VOICE_CHANNEL_ID'))
ROLE_MESSAGE_ID = int(os.getenv('ROLE_MESSAGE_ID'))
TEST_ROLE_ID = int(os.getenv('TEST_ROLE_ID'))

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.messages = True
intents.reactions = True

client = discord.Client(intents=intents)


@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')

    # numberOfMembersChannel = client.get_channel(MEMBER_NUNBER_ID)
    # await numberOfMembersChannel.edit(name=f"人數：{len(client.guilds[0].members)}")

@client.event
async def on_member_join(member):
    channel = client.get_channel(JOIN_ID)

    await channel.send(f"{member.mention}")

@client.event
async def on_member_remove(member):
    channel = client.get_channel(REMOVE_ID)

    await channel.send(f"{member.mention}")

tempVoiceChannels = {}
@client.event
async def on_voice_state_update(member, before, after):
    if before.channel is None and after.channel is not None:
        if after.channel.id == VOICE_PORTAL_ID:
            channel = client.get_channel(VOICE_CHANNEL_ID)
            tempVoiceChannel = await channel.create_voice_channel(str(member))
            tempVoiceChannels[member.id] = tempVoiceChannel.id
            await member.move_to(tempVoiceChannel)

    if after.channel is None and before.channel is not None:
        if tempVoiceChannels[member.id]:
            if before.channel.id == tempVoiceChannels[member.id]:
                await before.channel.delete()
                del tempVoiceChannels[member.id]

@client.event
async def on_raw_reaction_add(payload):
    if payload.message_id == ROLE_MESSAGE_ID:
        guild = client.get_guild(payload.guild_id)
        role = guild.get_role(TEST_ROLE_ID)
        await payload.member.add_roles(role)

client.run(DISCORD_TOKEN)
