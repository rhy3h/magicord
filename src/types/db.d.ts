interface Reaction {
  emoji_name: string;
  emoji_id: string;
  role_id: string;
}

interface ReactionRoles {
  id: string;
  name: string;
  channel_id: string;
  message_id: string;
  message_content: string;
  reactions: Array<Reaction>;
}

interface Message {
  id: string;
  message: string;
}

interface Guild {
  id: string;
  name: string;
}

interface DB {
  guild_member_add: Message;
  guild_member_remove: Message;
  temporary_channels: {
    name: string;
  };
  social_alert: {
    twitch: Guild;
  };
  reaction_roles: Array<ReactionRoles>;
  member_count: string;
}
