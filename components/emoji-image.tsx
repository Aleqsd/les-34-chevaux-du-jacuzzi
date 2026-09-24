import { emojiAsset } from "@/lib/emoji-assets";
export function EmojiImage({emoji,className=""}:{emoji:string;className?:string}){return <img className={`uniform-emoji ${className}`} src={emojiAsset(emoji)} alt="" aria-hidden="true" draggable={false}/>;}
