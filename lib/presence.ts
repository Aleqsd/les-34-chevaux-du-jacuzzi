export type PresenceRoom="villa"|"cinema"|"terrace"|"jacuzzi";
export type PresenceAction="walk"|"sit"|"bathe"|"dance"|"wave";
export type PresenceMember={authorKey:string;author:string;room:PresenceRoom;action:PresenceAction;changed:number;lastSeen:number};
export const PRESENCE_TTL=60000;
export const ROOM_LABELS:Record<PresenceRoom,string>={villa:"dans la villa",cinema:"au salon cinéma",terrace:"sur la terrasse",jacuzzi:"dans le jacuzzi"};

export const ACTION_LABELS:Record<PresenceAction,string>={walk:"Se balade",sit:"Assis",bathe:"Se détend",dance:"Danse",wave:"Fait coucou"};
