export function serializeChannel(channel) {
  return {
    name: channel.name,
    type: channel.type,
    topic: channel.topic ?? null,
    nsfw: Boolean(channel.nsfw),
    rateLimitPerUser: channel.rateLimitPerUser ?? 0,
    bitrate: channel.bitrate ?? null,
    userLimit: channel.userLimit ?? null,
    parentId: channel.parentId ?? null,
    position: channel.position ?? 0,
    rtcRegion: channel.rtcRegion ?? null,
    videoQualityMode: channel.videoQualityMode ?? null,
    defaultAutoArchiveDuration: channel.defaultAutoArchiveDuration ?? null,
    defaultThreadRateLimitPerUser: channel.defaultThreadRateLimitPerUser ?? null,
    permissionOverwrites: channel.permissionOverwrites.cache.map((overwrite) => ({
      id: overwrite.id,
      type: overwrite.type,
      allow: overwrite.allow.bitfield.toString(),
      deny: overwrite.deny.bitfield.toString(),
    })),
  };
}

export function channelCreateOptions(config) {
  const options = {
    name: config.name,
    type: config.type,
    permissionOverwrites: config.permissionOverwrites,
    reason: "Restauration d'une configuration de salon sauvegardée",
  };

  if (config.parentId) options.parent = config.parentId;
  if (Number.isInteger(config.position)) options.position = config.position;
  if (config.topic !== null) options.topic = config.topic;
  if (config.nsfw !== undefined) options.nsfw = config.nsfw;
  if (config.rateLimitPerUser !== undefined) options.rateLimitPerUser = config.rateLimitPerUser;
  if (config.bitrate !== null) options.bitrate = config.bitrate;
  if (config.userLimit !== null) options.userLimit = config.userLimit;
  if (config.rtcRegion) options.rtcRegion = config.rtcRegion;
  if (config.videoQualityMode) options.videoQualityMode = config.videoQualityMode;
  if (config.defaultAutoArchiveDuration) options.defaultAutoArchiveDuration = config.defaultAutoArchiveDuration;
  if (config.defaultThreadRateLimitPerUser !== null) {
    options.defaultThreadRateLimitPerUser = config.defaultThreadRateLimitPerUser;
  }

  return options;
}

export function channelEditOptions(config) {
  return {
    name: config.name,
    topic: config.topic,
    nsfw: config.nsfw,
    rateLimitPerUser: config.rateLimitPerUser,
    parent: config.parentId,
    position: config.position,
    permissionOverwrites: config.permissionOverwrites,
    ...(config.bitrate !== null ? { bitrate: config.bitrate } : {}),
    ...(config.userLimit !== null ? { userLimit: config.userLimit } : {}),
    ...(config.rtcRegion ? { rtcRegion: config.rtcRegion } : {}),
  };
}
