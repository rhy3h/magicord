interface GuildBase {
  active: boolean;
  channel_id: string;
}

interface GuildWithMessage extends GuildBase {
  message: string;
}

interface GuildWithName extends GuildBase {
  name: string;
}

interface TwitchAlert extends GuildWithMessage {
  twitch_id: string;
}

interface Reactions {
  emoji_id: string;
  emoji_name: string;
  role_id: string;
}

interface ReactionRoles {
  active: boolean;
  name: string;
  channel_id: string;
  message_id: string;
  message: string;
  reactions: Array<Reactions>;
}

interface Guilds {
  guild_member_add: GuildWithMessage;
  guild_member_remove: GuildWithMessage;
  temporary_channels: GuildWithName;
  twitch_alert: TwitchAlert;
  member_count: GuildWithMessage;
  reaction_roles: Array<ReactionRoles>;
}
