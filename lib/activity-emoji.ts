import type { Proposal } from "@/lib/club";

export const ACTIVITY_EMOJIS = [
  {emoji:"🎉",label:"Fête"},{emoji:"🎤",label:"Karaoké"},{emoji:"🧠",label:"Quiz"},{emoji:"🎾",label:"Padel et tennis"},{emoji:"🔐",label:"Escape game"},{emoji:"🏎️",label:"Karting"},
  {emoji:"🎳",label:"Bowling"},{emoji:"🎮",label:"Jeux vidéo"},{emoji:"🎲",label:"Jeux de société"},{emoji:"🍽️",label:"Restaurant"},{emoji:"🍕",label:"Pizza"},{emoji:"🍖",label:"Barbecue"},
  {emoji:"🍹",label:"Apéro"},{emoji:"☕",label:"Café"},{emoji:"🧺",label:"Pique-nique"},{emoji:"🥾",label:"Randonnée"},{emoji:"🏖️",label:"Plage"},{emoji:"🏊",label:"Piscine"},
  {emoji:"🛁",label:"Jacuzzi"},{emoji:"🧖",label:"Spa"},{emoji:"🛶",label:"Canoë et kayak"},{emoji:"🏄‍♀️",label:"Surf et paddle"},{emoji:"🚴",label:"Vélo"},{emoji:"⚽",label:"Football"},
  {emoji:"⛳",label:"Golf"},{emoji:"🐴",label:"Équitation"},{emoji:"🎵",label:"Concert"},{emoji:"💃",label:"Danse"},{emoji:"🏛️",label:"Visite"},{emoji:"📸",label:"Photos"},
] as const;
export function isActivityEmoji(value:string){return ACTIVITY_EMOJIS.some(option=>option.emoji===value);}
export function suggestActivityEmoji(title:string){
  const name=title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const rules:[RegExp,string][]=[[/karaoke|vamos|blind.?test/,"🎤"],[/quiz|quizz/,"🧠"],[/escape|enigme/,"🔐"],[/kart/,"🏎️"],[/padel|tennis/,"🎾"],[/paddle|surf/,"🏄‍♀️"],[/bowling/,"🎳"],[/barbecue|bbq|grill/,"🍖"],[/pizza/,"🍕"],[/resto|restaurant|repas|diner|dejeuner|brunch/,"🍽️"],[/apero|cocktail|bar\b|biere|verres/,"🍹"],[/cafe|coffee/,"☕"],[/pique.?nique|picnic/,"🧺"],[/rando|balade|marche/,"🥾"],[/plage|mer\b/,"🏖️"],[/piscine|natation|baignade/,"🏊"],[/jacuzzi|bain/,"🛁"],[/spa|sauna|hammam/,"🧖"],[/canoe|kayak/,"🛶"],[/velo|vtt|cycl/,"🚴"],[/football|foot\b/,"⚽"],[/golf/,"⛳"],[/equitation|cheval|chevaux/,"🐴"],[/concert|musique|festival/,"🎵"],[/danse|boite|discotheque/,"💃"],[/musee|visite|chateau/,"🏛️"],[/photo/,"📸"],[/console|jeux? video|gaming|playstation|switch/,"🎮"],[/jeux?|societe|cartes/,"🎲"]];
  return rules.find(([pattern])=>pattern.test(name))?.[1]||"🎉";
}
export function activityEmoji(proposal:Pick<Proposal,"title"|"emoji">){return proposal.emoji&&isActivityEmoji(proposal.emoji)?proposal.emoji:suggestActivityEmoji(proposal.title);}
export function activityEmojiLabel(emoji:string){return ACTIVITY_EMOJIS.find(option=>option.emoji===emoji)?.label||"Activité";}
