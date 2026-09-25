export const MANUAL_CPS=12,MANUAL_BURST=24;
// A fixed chart rewards learning. Times and positions are shared by client and server.
export const RHYTHM_BPM=110,RHYTHM_WINDOW=210,RHYTHM_APPROACH=1100,RHYTHM_MISS=-9999,RHYTHM_BOOST_MS=24*60*60*1000;
export const RHYTHM_NOTES=(()=>{
 const paths=[[[24,34],[43,26],[65,33],[76,54],[56,67],[34,65],[22,48],[46,46]],[[28,65],[29,42],[44,25],[66,27],[76,46],[63,66],[46,52],[48,33]],[[24,30],[43,38],[62,30],[75,47],[62,65],[43,57],[24,65],[33,47]],[[27,50],[39,30],[61,30],[73,50],[61,70],[39,70],[38,49],[61,49]]];
 let beat=0;return Array.from({length:64},(_,i)=>{const [x,y]=paths[Math.floor(i/16)][i%8];const at=Math.round(3000+beat*60000/RHYTHM_BPM);beat+=i<16?1.5:i%8===5||i%8===6?.5:i%8===7?2:1;return {at,x,y};});
})();
export const RHYTHM_DURATION=RHYTHM_NOTES[63].at+1000;
export const RHYTHM_CHART_IDS=["groove","bubbles","meteors","supernova"] as const;
export type RhythmChartId=typeof RHYTHM_CHART_IDS[number];
type RhythmChart={id:RhythmChartId;name:string;level:string;bpm:number;approach:number;description:string;color:string;notes:{at:number;x:number;y:number}[];duration:number;melody:number[]};
function rhythmPattern(bpm:number,paths:number[][][],beats:number[]){let beat=0;return Array.from({length:64},(_,i)=>{const [x,y]=paths[Math.floor(i/16)%paths.length][i%8];const at=Math.round(3000+beat*60000/bpm);beat+=beats[i%beats.length];return {at,x,y};});}
const bubbleNotes=rhythmPattern(90,[[[30,38],[43,30],[57,30],[70,38],[70,58],[57,66],[43,66],[30,58]],[[30,50],[40,35],[55,30],[70,40],[70,60],[55,70],[40,65],[30,50]]],[1,1,1,1,1,1,1,2]);
const meteorNotes=rhythmPattern(145,[[[24,28],[40,42],[58,58],[76,72],[76,48],[58,30],[40,58],[24,72]],[[24,55],[40,30],[56,55],[76,30],[76,68],[56,42],[40,68],[24,42]]],[1,1,.5,.5,1,1,.5,1.5]);
const novaNotes=rhythmPattern(174,[[[24,30],[44,45],[64,30],[76,50],[64,70],[44,55],[24,70],[40,50]],[[28,28],[70,28],[50,50],[70,72],[28,72],[50,50],[28,50],[70,50]],[[24,38],[44,28],[64,38],[76,60],[56,72],[36,62],[24,48],[52,48]]],[1,.5,.5,1,.5,.5,1,1]);
export const RHYTHM_CHARTS:RhythmChart[]=[
 {id:"groove",name:"Jacuzzi Groove",level:"Intermédiaire",bpm:RHYTHM_BPM,approach:RHYTHM_APPROACH,description:"La piste originale : boucles souples et petits contretemps pour trouver ton rythme.",color:"#a9efff",notes:RHYTHM_NOTES,duration:RHYTHM_DURATION,melody:[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46]},
 {id:"bubbles",name:"Balade des bulles",level:"Découverte",bpm:90,approach:1400,description:"Des cercles rapprochés, une pulsation posée et de grandes respirations pour apprendre à viser.",color:"#8bf0bb",notes:bubbleNotes,duration:bubbleNotes[63].at+1000,melody:[392,493.88,587.33,659.25,587.33,493.88,440,392]},
 {id:"meteors",name:"Pluie de météores",level:"Difficile",bpm:145,approach:950,description:"Traverse la piste en diagonale et alterne les mains dans des rafales de doubles notes.",color:"#ffd16b",notes:meteorNotes,duration:meteorNotes[63].at+1000,melody:[440,523.25,659.25,880,783.99,659.25,523.25,493.88]},
 {id:"supernova",name:"Supernova",level:"Expert",bpm:174,approach:800,description:"Des grands sauts, des croisements et des rafales rapides. Vise le full combo de 64 notes.",color:"#e5a1ff",notes:novaNotes,duration:novaNotes[63].at+1000,melody:[369.99,493.88,554.37,739.99,987.77,739.99,659.25,554.37]},
];
export const rhythmChart=(id:RhythmChartId="groove")=>RHYTHM_CHARTS.find(c=>c.id===id)??RHYTHM_CHARTS[0];
export type RhythmResult={runId:number;chart?:RhythmChartId;accuracy:number;misses:number;combo:number;passed:boolean;at:number;rewarded:boolean};
export type RhythmRecord={best:number;wins:number;combo?:number};
export type RhythmBook={cycle:number;active?:{id:number;startedAt:number;rules:1|2;chart?:RhythmChartId};boostUntil?:number;best?:number;wins?:number;last?:RhythmResult;records?:Partial<Record<RhythmChartId,RhythmRecord>>};
export function rhythmRecord(book:RhythmBook|undefined,id:RhythmChartId){return book?.records?.[id]??(!book?.records&&id==="groove"&&(book?.best!==undefined||book?.wins!==undefined)?{best:book.best??0,wins:book.wins??0}:undefined);}
export type RhythmAction={kind:"rhythmStart";cycle:number;chart?:RhythmChartId}|{kind:"rhythmFinish";runId:number;hits:number[];strays:number};
export function rhythmScore(hits:number[],strays:number){
 let score=0,misses=0,combo=0,bestCombo=0;
 for(const hit of hits){const delta=Math.abs(hit);if(delta>RHYTHM_WINDOW){misses++;combo=0;}else{score+=delta<=80?100:delta<=145?85:50;bestCombo=Math.max(bestCombo,++combo);}}
 const accuracy=Math.max(0,Math.round((score/RHYTHM_NOTES.length-strays)*10)/10);
 return {accuracy,misses,combo:bestCombo,passed:hits.length===RHYTHM_NOTES.length&&accuracy>=82&&misses<=8};
}
export const rhythmMultiplier=(p:CookiePlayer,now=Date.now())=>(p.rhythm?.boostUntil??0)>now?1.25:1;
function applyRhythmAction(p:CookiePlayer,action:CookieAction,now:number){
 if(action.kind==="rhythmStart"){
  if(action.chart!==undefined&&!RHYTHM_CHART_IDS.includes(action.chart))throw Error("Cette piste n’existe pas.");
  const book=p.rhythm??{cycle:0};if(action.cycle!==book.cycle)throw Error("Une autre partie a démarré. Réessaie.");
  book.cycle++;book.active={id:book.cycle,startedAt:now,rules:action.chart?2:1,...(action.chart?{chart:action.chart}:{})};p.rhythm=book;
 }
 if(action.kind==="rhythmFinish"){
  const book=p.rhythm,run=book?.active;
  if(!book||!run||run.id!==action.runId||(run.rules!==1&&run.rules!==2)||(run.rules===2&&!RHYTHM_CHART_IDS.includes(run.chart!)))throw Error("Cette partie n’est plus active. Lance un nouveau défi.");
  const chart=rhythmChart(run.rules===1?"groove":run.chart);
  if(now-run.startedAt<chart.duration-300)throw Error("La piste n’est pas encore terminée.");
  if(now-run.startedAt>15*60*1000)throw Error("Cette partie a expiré. Relance le défi.");
  if(action.hits.length!==64||!Number.isInteger(action.strays)||action.strays<0||action.strays>1000||action.hits.some(h=>!Number.isInteger(h)||(h!==RHYTHM_MISS&&Math.abs(h)>RHYTHM_WINDOW)))throw Error("Le résultat de cette partie est invalide.");
  // One input cannot hit two notes, including overlapping judgement windows.
  let previous=-Infinity;for(let i=0;i<64;i++){if(action.hits[i]===RHYTHM_MISS)continue;const at=chart.notes[i].at+action.hits[i];if(at<=previous)throw Error("Ces frappes ne correspondent pas à la piste.");previous=at;}
  const result=rhythmScore(action.hits,action.strays),rewarded=result.passed&&(book.boostUntil??0)<=now;
  if(rewarded)book.boostUntil=now+RHYTHM_BOOST_MS;
  if(!book.records){const original=rhythmRecord(book,"groove");book.records=original?{groove:original}:{};}
  const record=book.records[chart.id]??{best:0,wins:0};book.records[chart.id]={best:Math.max(record.best,result.accuracy),wins:record.wins+(result.passed?1:0),combo:Math.max(record.combo??0,result.combo)};
  if(result.passed)book.wins=(book.wins??0)+1;
  book.best=Math.max(book.best??0,result.accuracy);book.last={...result,runId:run.id,chart:chart.id,at:now,rewarded};delete book.active;
 }
}
export const BUILDINGS=[
 {id:"spoon",name:"Cuillère enchantée",description:"Elle mélange même quand tu dors.",price:15,cps:.1},
 {id:"oven",name:"Four de poche",description:"Petit four, grandes ambitions.",price:100,cps:1},
 {id:"crew",name:"Cuisine du crew",description:"Onze tabliers, aucune recette respectée.",price:1500,cps:8},
 {id:"bakery",name:"Fournil du jacuzzi",description:"La vapeur fait lever la pâte.",price:25000,cps:60},
 {id:"cocoa",name:"Ferme de cacao",description:"Du chocolat à perte de vue.",price:400000,cps:450},
 {id:"caramel",name:"Usine de caramel",description:"La rivière coule enfin dans le bon sens.",price:6e6,cps:3500},
 {id:"lab",name:"Labo croustillant",description:"La science au service du goûter.",price:1e8,cps:25000},
 {id:"portal",name:"Portail pâtissier",description:"Les fournées arrivent d’une autre dimension.",price:1.8e9,cps:180000},
 {id:"planet",name:"Planète biscuit",description:"Une orbite entièrement comestible.",price:3.5e10,cps:1300000},
 {id:"galaxy",name:"Galaxie des 34",description:"34 chevaux. Des milliards de miettes.",price:1e12,cps:1e7},
 {id:"dimension",name:"Four dimensionnel",description:"Chaque porte ouvre sur une nouvelle fournée.",price:2e14,cps:2e8},
 {id:"stable",name:"Écurie stellaire",description:"Les chevaux dessinent des constellations de chocolat.",price:3e16,cps:2e10},
 {id:"cosmic",name:"Jacuzzi cosmique",description:"Le goûter se prépare au-delà des galaxies.",price:5e18,cps:1e12},
 {id:"chrono",name:"Chronofour",description:"La prochaine fournée arrive d’hier.",price:2e20,cps:2e13},
 {id:"infinite",name:"Haras infini",description:"Chaque sabot ouvre un nouvel univers.",price:3e22,cps:2e14},
 {id:"source",name:"Source des 34",description:"Là où naissent toutes les miettes.",price:5e24,cps:1e15},
 {"id":"antimatter","name":"Forge d’antimatière","description":"Les miettes rencontrent leur double. La fournée reste entière.","price":5e+28,"cps":30000000000000000},
 {"id":"quantum","name":"Rucher quantique","description":"Chaque alvéole prépare plusieurs goûters à la fois.","price":5e+31,"cps":1000000000000000000},
 {"id":"possibility","name":"Verger des possibles","description":"Toutes les recettes qui auraient pu exister poussent ici.","price":5e+34,"cps":30000000000000000000},
 {"id":"library","name":"Bibliothèque des univers","description":"Un monde par livre. Une fournée à chaque page.","price":5e+37,"cps":1e+21},
 {"id":"loom","name":"Métier à constellations","description":"Des fils de sucre pour tisser de nouvelles nuits.","price":5e+40,"cps":3e+22},
 {"id":"nexus","name":"Cœur des dimensions","description":"Toutes les portes de l’atelier battent au même rythme.","price":5e+43,"cps":1e+24},
 {"id":"primordial","name":"Océan primordial","description":"Avant les étoiles, il y avait déjà du chocolat.","price":5e+46,"cps":3e+25},
 {"id":"eternity","name":"Horloge de l’infini","description":"Le temps ne passe plus. Il repasse au four.","price":5e+49,"cps":1e+27},
 {"id":"realities","name":"Jardin des réalités","description":"Chaque graine fait éclore un autre empire gourmand.","price":5e+52,"cps":3e+28},
 {"id":"crown","name":"Couronne des multivers","description":"Trente-quatre chevaux veillent sur des mondes sans nombre.","price":5e+55,"cps":1e+30},
 {"id":"origins","name":"Banquet des origines","description":"Tous les univers se retrouvent enfin autour de la table.","price":5e+58,"cps":3e+31},
 {"id":"aurora","name":"Manufacture d’aurores","description":"Des rubans de lumière dorent chaque fournée.","price":4.9999999999999996e+61,"cps":1e+33},
 {"id":"fractal","name":"Palais fractal","description":"Chaque biscuit contient un atelier, chaque atelier un biscuit.","price":5e+64,"cps":3e+34},
 {"id":"gravity","name":"Moulin gravitationnel","description":"Les étoiles font tourner les meules de cacao.","price":5e+67,"cps":1e+36},
 {"id":"dream","name":"Songe des 34","description":"Les rêves du crew deviennent des recettes.","price":5e+70,"cps":3e+37},
 {"id":"horizon","name":"Phare des horizons","description":"Sa lumière guide les fournées au-delà du visible.","price":5e+73,"cps":1e+39},
 {"id":"symphony","name":"Orchestre du vide","description":"Une symphonie de miettes réveille le silence.","price":5.0000000000000006e+76,"cps":3e+40},
 {"id":"singularity","name":"Forge de singularités","description":"Toute une galaxie de chocolat dans une seule pépite.","price":5e+79,"cps":1e+42},
 {"id":"firmament","name":"Serre du firmament","description":"Les constellations y mûrissent comme des fruits.","price":4.9999999999999995e+82,"cps":3e+43},
 {"id":"odyssey","name":"Caravane des éternités","description":"Trente-quatre chevaux livrent le goûter à travers les âges.","price":5e+85,"cps":1e+45},
 {"id":"genesis","name":"Grand Four des commencements","description":"Au premier crépitement, un nouvel univers sent le biscuit.","price":5e+88,"cps":3e+46},
 {"id":"echo","name":"Chambre des échos","description":"Chaque fournée revient avec une recette qu’on n’a pas encore inventée.","price":5e+91,"cps":1e+48},
 {"id":"tide","name":"Marée de lumière","description":"Les vagues déposent du sucre sur les rivages du possible.","price":5e+94,"cps":3e+49},
 {"id":"compass","name":"Boussole des ailleurs","description":"Elle indique toujours le prochain goûter.","price":5.000000000000001e+97,"cps":1e+51},
 {"id":"dreamforge","name":"Atelier des songes éveillés","description":"Le crew ouvre les yeux. Les fours continuent de rêver.","price":5e+100,"cps":3e+52},
 {"id":"orchard","name":"Verger des lendemains","description":"On cueille aujourd’hui les biscuits de demain.","price":5e+103,"cps":1e+54},
 {"id":"cathedral","name":"Cathédrale des aurores","description":"Ses vitraux changent chaque rayon en chocolat.","price":5.000000000000001e+106,"cps":3e+55},
 {"id":"ocean","name":"Océan des éternités","description":"Les fournées voguent d’un commencement à l’autre.","price":5e+109,"cps":1e+57},
 {"id":"atlas","name":"Atlas des impossibles","description":"Chaque carte dessine un monde où le beurre ne manque jamais.","price":5e+112,"cps":3e+58},
 {"id":"sanctuary","name":"Sanctuaire des 34","description":"Trente-quatre sabots veillent sur la flamme de tous les mondes.","price":5e+115,"cps":1e+60},
 {"id":"celebration","name":"Jubilé du jacuzzi","description":"Tous les horizons se retrouvent pour une fournée sans fin.","price":5e+118,"cps":3e+61},
 {id:"mirroroven",name:"Four des reflets",description:"La lumière cuit un biscuit. Son reflet en prépare un autre.",price:5e121,cps:1e63},
 {id:"reversegarden",name:"Jardin à rebours",description:"Les fruits remontent vers les fleurs au parfum de vanille.",price:5e124,cps:3e64},
 {id:"paradoxpalace",name:"Palais des paradoxes",description:"Deux vérités impossibles, une seule recette parfaite.",price:5e127,cps:1e66},
 {id:"firstember",name:"Braise première",description:"La première chaleur de tous les univers tient dans ce four.",price:5e130,cps:3e67},
 {id:"sugarcore",name:"Noyau de sucre",description:"La matière du monde prend doucement le goût du caramel.",price:5e133,cps:1e69},
 {id:"originforge",name:"Four des origines",description:"Trois flammes réunies donnent naissance à un nouveau ciel.",price:5e136,cps:3e70},
 {id:"lasttable",name:"Table des éternités",description:"Chaque couvert attend un voyageur de retour.",price:5e139,cps:1e72},
 {id:"starservice",name:"Service des étoiles",description:"Les constellations apportent les plats du dernier banquet.",price:5e142,cps:3e73},
 {id:"finalfeast",name:"Dernier banquet",description:"Trente-quatre chevaux lèvent leur coupe au prochain commencement.",price:5e145,cps:1e75}
] as const;
export type Upgrade={id:string;name:string;price:number;building?:number;owned?:number;requires?:string;clicks?:number;earned?:number;clickMultiplier?:number;clickTotalMultiplier?:number;share?:number;synergy?:{source:number;target:number;sourceOwned:number};description:string};
export const UPGRADES:Upgrade[]=[
 ...BUILDINGS.slice(0,10).map((b,i)=>({id:b.id+"_double",name:b.name+" · recette secrète",price:b.price*20,building:i,owned:10,description:"Double la production de ce bâtiment."})),
 ...BUILDINGS.slice(4,10).map((b,i)=>({id:b.id+"_master",name:b.name+" · légendaire",price:b.price*250,building:i+4,owned:25,requires:b.id+"_double",description:"Double encore la production de ce bâtiment."})),
 {id:"thumb",name:"Pouce pâtissier",price:50,clicks:25,clickMultiplier:2,description:"Double la puissance de base du clic."},
 {id:"hooves",name:"Deux sabots valent mieux qu’un",price:500,clicks:100,clickMultiplier:3,description:"Triple la puissance de base du clic."},
 {id:"rhythm",name:"Rythme du crew",price:750,earned:1000,share:.1,description:"Ajoute 10 % de la production par seconde à chaque clic."},
 {id:"cadence",name:"Cadence galactique",price:1e5,earned:1e5,share:.15,description:"Ajoute 15 % de la production par seconde à chaque clic (35 % avec Rythme du crew)."}
 ,...BUILDINGS.slice(0,4).map((b,i)=>({id:b.id+"_master",name:b.name+" · légendaire",price:b.price*250,building:i,owned:25,requires:b.id+"_double",description:"Double encore la production de ce bâtiment."})),
 ...BUILDINGS.slice(0,10).map((b,i)=>({id:b.id+"_signature",name:b.name+" · signature du chef",price:b.price*1200,building:i,owned:50,requires:b.id+"_master",description:"Double la production après la recette légendaire. Un atelier à son sommet."})),
 {id:"whisk",name:"Fouet électrique",price:1e6,clicks:2000,clickTotalMultiplier:1.25,description:"Augmente de 25 % tout le gain du clic, manuel comme automatique."},
 {id:"mixer",name:"Batteur à réaction",price:1e9,clicks:15000,clickTotalMultiplier:1.25,requires:"whisk",description:"Augmente encore de 25 % tout le gain du clic."},
 {id:"thunder",name:"Sabots de tonnerre",price:1e12,clicks:50000,clickTotalMultiplier:1.25,requires:"mixer",description:"Augmente de 25 % tout le gain du clic. Le crew fait trembler les fours."},
 {id:"starlight",name:"Toucher des étoiles",price:1e15,clicks:100000,clickTotalMultiplier:1.25,requires:"thunder",description:"Ajoute un dernier bonus de 25 % à tout le gain du clic."},
 {id:"pulse",name:"Pulsation pâtissière",price:1e8,earned:1e8,share:.15,requires:"cadence",description:"Ajoute 15 % de ta production par seconde à chaque clic."},
 {id:"resonance",name:"Résonance du jacuzzi",price:1e12,earned:1e12,share:.25,requires:"pulse",description:"Ajoute 25 % de ta production par seconde à chaque clic (75 % avec toutes les recettes)."}
];
export const CHAPTER_THRESHOLDS=[1e14,1e17,1e20,1e22,1e24,1e26,1e30,1e33,1e36,1e39,1e42,1e45,1e48,1e51,1e54,1e57,1e60,1e63,1e66,1e69,1e72,1e75,1e78,1e81,1e84,1e87,1e90,1e93,1e96,1e99,1e102,1e105,1e108,1e111,1e114,1e117,1e120,1e123,1e126,1e129,1e132,1e135,1e138,1e141,1e144,1e147] as const;
export const buildingUnlock=(index:number)=>index<10?0:CHAPTER_THRESHOLDS[index-10]??Infinity;
export const buildingUnlocked=(p:CookiePlayer,index:number)=>p.lifetime>=buildingUnlock(index);
UPGRADES.push(
 ...BUILDINGS.slice(10,16).flatMap((b,i)=>[
  {id:b.id+"_double",name:b.name+" · cuisson astrale",price:b.price*20,building:i+10,owned:10,earned:CHAPTER_THRESHOLDS[i],description:"Double la production de ce bâtiment."},
  {id:b.id+"_master",name:b.name+" · cœur d’étoile",price:b.price*250,building:i+10,owned:25,earned:CHAPTER_THRESHOLDS[i],requires:b.id+"_double",description:"Double encore la production de ce bâtiment."},
  {id:b.id+"_signature",name:b.name+" · au-delà du temps",price:b.price*1200,building:i+10,owned:50,earned:CHAPTER_THRESHOLDS[i],requires:b.id+"_master",description:"Double la production après le cœur d’étoile."}
 ]),
 ...[{source:0,target:10,name:"Le premier tour de cuillère"},{source:3,target:10,name:"Les fournils de l’infini"},{source:1,target:11,name:"La chaleur des petites étoiles"},{source:4,target:11,name:"Le cacao des constellations"},{source:2,target:12,name:"Onze tabliers dans le cosmos"},{source:6,target:12,name:"La théorie des bulles"},{source:5,target:13,name:"Le caramel remonte le temps"},{source:7,target:13,name:"La boucle pâtissière"},{source:8,target:14,name:"Les orbites au galop"},{source:9,target:14,name:"Le manège des galaxies"},{source:10,target:15,name:"Le feu des origines"},{source:12,target:15,name:"La source et les bulles"}].map((x,i)=>({id:"link_"+BUILDINGS[x.source].id+"_"+BUILDINGS[x.target].id,name:x.name,price:BUILDINGS[x.target].price*(i%2?500:100),earned:buildingUnlock(x.target),synergy:{source:x.source,target:x.target,sourceOwned:i%2?100:50},description:BUILDINGS[x.target].name+" : +0,2 % par "+BUILDINGS[x.source].name+" possédé, jusqu’à +50 %."}))
);
// Append-only catalog: keep all existing upgrade positions and identities.
UPGRADES.push(
 ...BUILDINGS.slice(16,27).flatMap((b,j)=>[
  {id:b.id+"_double",name:b.name+" · matière nouvelle",price:b.price*20,building:j+16,owned:10,earned:buildingUnlock(j+16),description:"Double la production de ce bâtiment."},
  {id:b.id+"_master",name:b.name+" · réalité supérieure",price:b.price*250,building:j+16,owned:25,earned:buildingUnlock(j+16),requires:b.id+"_double",description:"Double encore la production de ce bâtiment."},
  {id:b.id+"_signature",name:b.name+" · recette des origines",price:b.price*1200,building:j+16,owned:50,earned:buildingUnlock(j+16),requires:b.id+"_master",description:"Double la production après la réalité supérieure."},
 ]),
 ...BUILDINGS.slice(16,27).flatMap((b,j)=>[1,2].map((back,k)=>{
  const target=j+16,source=target-back;
  return {id:"link_"+BUILDINGS[source].id+"_"+b.id,name:b.name+(k?" · mémoire des mondes":" · passage de relais"),price:b.price*(k?500:100),earned:buildingUnlock(target),synergy:{source,target,sourceOwned:k?100:50},description:b.name+" : +0,2 % par "+BUILDINGS[source].name+" possédé, jusqu’à +50 %."};
 }))
);
// The next era is appended after the complete v24 recipe catalog.
UPGRADES.push(
 ...BUILDINGS.slice(27,37).flatMap((b,j)=>[
  {id:b.id+"_double",name:b.name+" · nouvelle aube",price:b.price*20,building:j+27,owned:10,earned:buildingUnlock(j+27),description:"Double la production de ce bâtiment."},
  {id:b.id+"_master",name:b.name+" · secret des éons",price:b.price*250,building:j+27,owned:25,earned:buildingUnlock(j+27),requires:b.id+"_double",description:"Double encore la production de ce bâtiment."},
  {id:b.id+"_signature",name:b.name+" · premier crépitement",price:b.price*1200,building:j+27,owned:50,earned:buildingUnlock(j+27),requires:b.id+"_master",description:"Double la production après le secret des éons."},
 ]),
 ...BUILDINGS.slice(27,37).flatMap((b,j)=>[1,2].map((back,k)=>{
  const target=j+27,source=target-back;
  return {id:"link_"+BUILDINGS[source].id+"_"+b.id,name:b.name+(k?" · héritage des éons":" · relais de l’aube"),price:b.price*(k?500:100),earned:buildingUnlock(target),synergy:{source,target,sourceOwned:k?100:50},description:b.name+" : +0,2 % par "+BUILDINGS[source].name+" possédé, jusqu’à +50 %."};
 }))
);
// Append the Jubilee era after every v25 recipe.
UPGRADES.push(
 ...BUILDINGS.slice(37,47).flatMap((b,j)=>[
  {id:b.id+"_double",name:b.name+" · rivage nouveau",price:b.price*20,building:j+37,owned:10,earned:buildingUnlock(j+37),description:"Double la production de ce bâtiment."},
  {id:b.id+"_master",name:b.name+" · rêve éveillé",price:b.price*250,building:j+37,owned:25,earned:buildingUnlock(j+37),requires:b.id+"_double",description:"Double encore la production de ce bâtiment."},
  {id:b.id+"_signature",name:b.name+" · recette du jubilé",price:b.price*1200,building:j+37,owned:50,earned:buildingUnlock(j+37),requires:b.id+"_master",description:"Double la production après le rêve éveillé."},
 ]),
 ...BUILDINGS.slice(37,47).flatMap((b,j)=>[1,2].map((back,k)=>{
  const target=j+37,source=target-back;
  return {id:"link_"+BUILDINGS[source].id+"_"+b.id,name:b.name+(k?" · mémoire des ailleurs":" · fil des lendemains"),price:b.price*(k?500:100),earned:buildingUnlock(target),synergy:{source,target,sourceOwned:k?100:50},description:b.name+" : +0,2 % par "+BUILDINGS[source].name+" possédé, jusqu’à +50 %."};
 }))
);
// New recipes follow the entire historical catalog, preserving every stored ID.
UPGRADES.push(
 ...BUILDINGS.slice(47).flatMap((b,j)=>[
  {id:b.id+"_double",name:b.name+" · éclat premier",price:b.price*20,building:j+47,owned:10,earned:buildingUnlock(j+47),description:"Double la production de ce bâtiment."},
  {id:b.id+"_master",name:b.name+" · mémoire vive",price:b.price*250,building:j+47,owned:25,earned:buildingUnlock(j+47),requires:b.id+"_double",description:"Double encore la production de ce bâtiment."},
  {id:b.id+"_signature",name:b.name+" · ultime saveur",price:b.price*1200,building:j+47,owned:50,earned:buildingUnlock(j+47),requires:b.id+"_master",description:"Double la production après la mémoire vive."}
 ]),
 ...BUILDINGS.slice(47).flatMap((b,j)=>[1,2].map((back,k)=>{const target=j+47,source=target-back;return {id:"link_"+BUILDINGS[source].id+"_"+b.id,name:b.name+(k?" · pacte des voyageurs":" · traversée des mondes"),price:b.price*(k?500:100),earned:buildingUnlock(target),synergy:{source,target,sourceOwned:k?100:50},description:b.name+" : +0,2 % par "+BUILDINGS[source].name+" possédé, jusqu’à +50 %."};}))
);
export const COSMIC_CHAPTERS=[
 {name:"Au-delà de la Galaxie",from:10,to:13},
 {name:"Aux origines des 34",from:13,to:16},
 {name:"Matière impossible",from:16,to:20},
 {name:"Fabrique des réalités",from:20,to:24},
 {name:"Banquet des origines",from:24,to:27},
 {name:"Au-delà des origines",from:27,to:30},
 {name:"Symphonie de l’infini",from:30,to:34},
 {name:"Nouvelle aube des 34",from:34,to:37},
 {name:"Les rivages du possible",from:37,to:40},
 {name:"Les mondes à inventer",from:40,to:44},
 {name:"Le jubilé des 34",from:44,to:47},
 {name:"Royaume des paradoxes",from:47,to:50},
 {name:"Four des origines",from:50,to:53},
 {name:"Dernier banquet",from:53,to:56},
] as const;
export const COOKIE_AVATARS=[{index:60,name:"Petit Biscuit",threshold:1},{index:61,name:"Donut fraise",threshold:1000},{index:62,name:"Croissant doré",threshold:1e6},{index:63,name:"Cupcake étoilé",threshold:1e9},{index:64,name:"Macaron cosmique",threshold:1e12},{index:65,name:"Roi Cacao",threshold:1e15},
 {index:66,name:"Mochi pêche",threshold:100},{index:67,name:"Chou chantilly",threshold:1e4},{index:68,name:"Gaufre miel",threshold:1e5},{index:69,name:"Pancake fraise",threshold:1e7},{index:70,name:"Éclair chocolat",threshold:1e8},{index:71,name:"Glace pistache",threshold:1e10},{index:72,name:"Bretzel caramel",threshold:1e11},{index:73,name:"Renard pâtissier",threshold:1e13},{index:74,name:"Chat barista",threshold:1e14},{index:75,name:"Dragon flambé",threshold:1e16},{index:76,name:"Licorne bonbon",threshold:1e17},{index:77,name:"Cheval stellaire",threshold:1e18},
 {"index":78,"name":"Renard comète","threshold":1e+21},
 {"index":79,"name":"Axolotl nébuleuse","threshold":1e+24},
 {"index":80,"name":"Hibou des mondes","threshold":1e+27},
 {"index":81,"name":"Dragon antimatière","threshold":1e+30},
 {"index":82,"name":"Phénix de sucre","threshold":1e+36},
 {"index":83,"name":"Baleine des étoiles","threshold":1e+42},
 {"index":84,"name":"Cerf des réalités","threshold":1e+48},
 {"index":85,"name":"Kitsune des éons","threshold":1e+54},
 {"index":86,"name":"Gardien du vide","threshold":1e+63},
 {"index":87,"name":"Dragon du zénith","threshold":1e+72},
 {"index":88,"name":"Cheval de l’éternité","threshold":1e+81},
 {"index":89,"name":"Empereur du goûter","threshold":1e+90},
 {"index":90,"name":"Lapin des portails","threshold":1e+33},
 {"index":91,"name":"Panda nova","threshold":1e+39},
 {"index":92,"name":"Loutre lunaire","threshold":1e+45},
 {"index":93,"name":"Tortue des nébuleuses","threshold":1e+51},
 {"index":94,"name":"Hippocampe cristal","threshold":1e+57},
 {"index":95,"name":"Papillon des rêves","threshold":1e+60},
 {"index":96,"name":"Griffon des aurores","threshold":1e+66},
 {"index":97,"name":"Kraken confiseur","threshold":1e+75},
 {"index":98,"name":"Lynx du firmament","threshold":1e+84},
 {"index":99,"name":"Qilin céleste","threshold":1e+96},
 {"index":100,"name":"Phénix primordial","threshold":1e+108},
 {"index":101,"name":"Souverain des 34","threshold":1e+120},
 {"index":102,"name":"Pingouin astronaute","threshold":10000000000000000000},
 {"index":103,"name":"Dauphin caramel","threshold":100000000000000000000},
 {"index":104,"name":"Raie des aurores","threshold":1e+22},
 {"index":105,"name":"Pieuvre praline","threshold":1e+23},
 {"index":106,"name":"Phoque polaire","threshold":1e+25},
 {"index":107,"name":"Méduse stellaire","threshold":1e+26},
 {"index":108,"name":"Crabe rubis","threshold":1e+28},
 {"index":109,"name":"Narval sorbet","threshold":1e+29},
 {"index":110,"name":"Poisson-lune biscuit","threshold":1e+31},
 {"index":111,"name":"Manchot empereur","threshold":1e+32},
 {"index":112,"name":"Tortue opaline","threshold":1e+34},
 {"index":113,"name":"Léviathan bonbon","threshold":1e+35},
 {"index":114,"name":"Écureuil noisette","threshold":1e+37},
 {"index":115,"name":"Hérisson truffe","threshold":1e+38},
 {"index":116,"name":"Raton des étoiles","threshold":1e+40},
 {"index":117,"name":"Koala nuage","threshold":1e+41},
 {"index":118,"name":"Cerf caramel","threshold":1e+43},
 {"index":119,"name":"Loup boréal","threshold":1e+44},
 {"index":120,"name":"Panda roux solaire","threshold":1e+46},
 {"index":121,"name":"Chouette opaline","threshold":1e+47},
 {"index":122,"name":"Lapin des rêves","threshold":1e+49},
 {"index":123,"name":"Renard arc-en-ciel","threshold":1e+50},
 {"index":124,"name":"Ours gardien","threshold":1e+52},
 {"index":125,"name":"Licorne sylvestre","threshold":1e+53},
 {"index":126,"name":"Mochi lunaire","threshold":1e+55},
 {"index":127,"name":"Éclair foudre","threshold":1e+56},
 {"index":128,"name":"Donut galaxie","threshold":1e+58},
 {"index":129,"name":"Macaron aurore","threshold":1e+59},
 {"index":130,"name":"Gaufre cristal","threshold":1e+62},
 {"index":131,"name":"Cupcake royal","threshold":1e+68},
 {"index":132,"name":"Croissant phénix","threshold":1e+78},
 {"index":133,"name":"Flan des éons","threshold":1e+88},
 {"index":134,"name":"Profiterole solaire","threshold":1e+99},
 {"index":135,"name":"Millefeuille astral","threshold":1e+105},
 {"index":136,"name":"Tarte constellation","threshold":1e+114},
 {"index":137,"name":"Gâteau des univers","threshold":1e+117}];
export const latestCookieAvatar=(lifetime:number)=>COOKIE_AVATARS.reduce((best,a)=>a.threshold<=lifetime&&a.threshold>best.threshold?a:best,COOKIE_AVATARS[0]);
export type Specialization="architect"|"artisan"|"watcher";
export type ContractKind="produce"|"spend"|"catch";
export type CookieContract={id:number;kind:ContractKind;acceptedAt:number;referenceRate:number;target:number;reward:number;progress:number;school?:Specialization};
export type CookieContracts={cycle:number;nextAcceptAt:number;active?:CookieContract;completed:number;byKind:Partial<Record<ContractKind,number>>;bySchool:Partial<Record<Specialization,number>>};
export type CookiePlayer={balance:number;lifetime:number;runEarned:number;banked:number;clicks:number;buildings:number[];upgrades:string[];prestige:number;resets:number;maxBuildings:number;goldenClicks:number;rushUntil:number;goldenReadyAt:number;achievements:string[];missions:string[];clickCredit:number;autoCredit?:number;nextEventAt?:number;nextEventId?:CookieEventId;eventBuffs?:EventBuffs;maxRecipes?:number;maxBuildingKinds?:number;maxProduction?:number;rebuild?:{run:number;claimed:string[];rewardMultiplier?:number;starterAmount?:number};contracts?:CookieContracts;specialization?:Specialization;specializationChangeAt?:number;trials?:TrialBook;wonder?:WonderBook;decor?:TrialId;wonderDecor?:WonderProjectId;trialBoostUntil?:number;mastery?:MasteryBook;followedGoal?:FollowedGoal;followRevision?:number;rhythm?:RhythmBook;voyages?:VoyageBook;updated:number;version:number};
export const freshCookiePlayer=(now:number):CookiePlayer=>({balance:0,lifetime:0,runEarned:0,banked:0,clicks:0,buildings:BUILDINGS.map(()=>0),upgrades:[],prestige:0,resets:0,maxBuildings:0,goldenClicks:0,rushUntil:0,goldenReadyAt:now+60000,achievements:[],missions:[],clickCredit:MANUAL_BURST,updated:now,version:0});
export const MASTERY_TALENTS=[
 {id:"variety",branch:"synergy",name:"Brigade variée",description:"+0,25 % de production par type de bâtiment possédé et par rang.",requires:null},
 {id:"links",branch:"synergy",name:"Liens renforcés",description:"+10 % au bonus des synergies acquises par rang.",requires:"variety"},
 {id:"hands",branch:"synergy",name:"Geste du maître",description:"+4 % à tes clics manuels par rang. Le pilote garde sa puissance.",requires:"links"},
 {id:"gifts",branch:"surprise",name:"Cadeaux généreux",description:"+10 % de cookies dans les surprises par rang.",requires:null},
 {id:"rush",branch:"surprise",name:"Or prolongé",description:"+3 secondes de fournée ×7 par rang, pour le cookie doré et les surprises.",requires:"gifts"},
 {id:"rest",branch:"surprise",name:"Veille paisible",description:"+1 heure de production hors ligne par rang, en plus de ton école.",requires:"rush"},
 {id:"starter",branch:"rebuild",name:"Réserve du chef",description:"+50 % de réserve de départ par rang au prochain prestige.",requires:null},
 {id:"grants",branch:"rebuild",name:"Retour organisé",description:"+25 % aux primes de reconstruction par rang. Fixé au début de la fournée.",requires:"starter"},
 {id:"plans",branch:"rebuild",name:"Plans réutilisables",description:"−1 % sur tous les bâtiments par rang, cumulable avec Architecte.",requires:"grants"}
] as const;
export type MasteryId=typeof MASTERY_TALENTS[number]["id"];
export type MasteryBook={revision:number;nextChangeAt:number;ranks:Partial<Record<MasteryId,number>>};
export type FollowedGoal={kind:"building"|"upgrade"|"trial"|"mission"|"rebuild"|"contract";id:string;target:number;run:number};
export const MASTERY_COOLDOWN=20*60000;
export const masteryRank=(p:CookiePlayer,id:MasteryId)=>Math.max(0,Math.min(3,Math.floor(p.mastery?.ranks[id]??0)));
export const masteryPoints=(p:CookiePlayer)=>Math.floor(COOKIE_ACHIEVEMENTS.filter(a=>p.achievements.includes(a.id)).length/5);
export const masterySpent=(p:CookiePlayer)=>MASTERY_TALENTS.reduce((n,t)=>n+masteryRank(p,t.id),0);
export const goldenRushSeconds=(p:CookiePlayer)=>77+3*masteryRank(p,"rush")+(p.voyages?.equippedRecipe==="souffle"?15:0);
function applyMastery(p:CookiePlayer,ranks:Partial<Record<MasteryId,number>>,revision:number,now:number){
 if(revision!==(p.mastery?.revision??0))throw Error("Tes talents ont changé dans un autre onglet. Actualise la maîtrise.");
 if(Object.entries(ranks).some(([id,n])=>!MASTERY_TALENTS.some(t=>t.id===id)||!Number.isInteger(n)||n<0||n>3))throw Error("Ce rang de maîtrise est invalide.");
 const spent=Object.values(ranks).reduce((n,r)=>n+r,0);
 if(spent>masteryPoints(p))throw Error("Tu n’as pas assez de points de maîtrise.");
 if(MASTERY_TALENTS.some(t=>(ranks[t.id]??0)>0&&t.requires&&(ranks[t.requires]??0)<2))throw Error("Il faut deux rangs dans le talent précédent.");
 const removes=MASTERY_TALENTS.some(t=>(ranks[t.id]??0)<masteryRank(p,t.id));
 if(removes&&now<(p.mastery?.nextChangeAt??0))throw Error("La redistribution gratuite se prépare encore.");
 p.mastery={revision:revision+1,nextChangeAt:removes||!p.mastery?now+MASTERY_COOLDOWN:p.mastery.nextChangeAt,ranks:{...ranks}};
}
function validateFollowedGoal(p:CookiePlayer,g:FollowedGoal){
 const valid=Number.isInteger(g.target)&&Number.isInteger(g.run)&&g.run>=0&&(
  g.kind==="building"?BUILDINGS.some(b=>b.id===g.id)&&g.target>=1&&g.target<=1000:
  g.kind==="upgrade"?UPGRADES.some(u=>u.id===g.id)&&g.target===1:
  g.kind==="trial"?TRIALS.some(t=>t.id===g.id)&&g.target>=1&&g.target<=3:
  g.kind==="mission"?COOKIE_MISSIONS.some(m=>m.id===g.id)&&g.target===1:
  g.kind==="rebuild"?REBUILD_MISSIONS.some(m=>m.id===g.id)&&g.target===1&&g.run===p.resets:
  g.kind==="contract"?!!p.contracts?.active&&String(p.contracts.active.id)===g.id&&g.target===1:false);
 if(!valid)throw Error("Cet objectif n’est pas disponible.");
}
type Metric="lifetime"|"clicks"|"maxBuildings"|"prestige"|"goldenClicks"|"recipes"|"buildingKinds"|"production"|"contracts"|"contractKinds"|"contractSchools";
export const COOKIE_ACHIEVEMENTS: {id:string;name:string;metric:Metric;target:number}[]=[
 ...[1,100,1e3,1e4,1e5,1e6,1e8,1e9,1e12,1e15].map((target,i)=>({id:"bake"+i,metric:"lifetime" as const,target,name:["La première miette","Une petite fournée","Ça sent bon","La réserve du crew","Le four ne dort jamais","Millionnaire en miettes","Le jacuzzi déborde","L’empire croustillant","Une planète à croquer","L’infini dans une boîte"][i]})),
 ...[1,25,100,500,1000,5000,20000,100000].map((target,i)=>({id:"click"+i,metric:"clicks" as const,target,name:["Premier coup de sabot","Le bon rythme","Cent fois oui","Pouce d’or","Mille et une miettes","Batteur du crew","Sabots infatigables","Légende du clic"][i]})),
 ...[1,10,25,50,100,250,500,1000].map((target,i)=>({id:"build"+i,metric:"maxBuildings" as const,target,name:["Première installation","Petit atelier","Le quartier pâtissier","La grande fournée","Cent fours et un jacuzzi","Réseau gourmand","Architecte du croustillant","Métropole biscuit"][i]})),
 ...[1,5,25,100].map((target,i)=>({id:"prestige"+i,metric:"prestige" as const,target,name:["Nouveau départ","La recette traverse le temps","Maître des fournées","Éternel pâtissier"][i]}))
 ,...[1,5,15,34,100,250].map((target,i)=>({id:"golden"+i,metric:"goldenClicks" as const,target,name:["Une touche d’or","Chercheur d’or","Chasseur de soleil","34 pépites","Ruée vers le goûter","Alchimiste du cookie"][i]})),
 ...[1,5,10,20,30,40].map((target,i)=>({id:"recipe"+i,metric:"recipes" as const,target,name:["La recette du bonheur","Carnet gourmand","Le chef improvise","Livre de famille","Bibliothèque pâtissière","Toutes les saveurs"][i]})),
 ...[3,5,8,10].map((target,i)=>({id:"diversity"+i,metric:"buildingKinds" as const,target,name:["Trois façons de cuire","Atelier polyvalent","Voyage des saveurs","La chaîne complète"][i]})),
 ...[1,10,1000,1e5,1e7,1e9].map((target,i)=>({id:"flow"+i,metric:"production" as const,target,name:["Ça tourne tout seul","Fournée continue","Cascade de cookies","Torrent gourmand","Océan de chocolat","Le temps se croque"][i]})),
 ...[250,1000,10000,100000].map((target,i)=>({id:"prestige"+(i+4),metric:"prestige" as const,target,name:["Constellation du chef","Mille soleils","Maître du multivers","Au-delà des fournées"][i]})),
 ...[1e16,1e17,1e18,1e20].map((target,i)=>({id:"bake"+(i+10),metric:"lifetime" as const,target,name:["Un dragon dans le four","Nuage de bonbons","La chevauchée stellaire","Le goûter de l’éternité"][i]}))
];
COOKIE_ACHIEVEMENTS.push(
 ...[1,5,20,60,150].map((target,i)=>({id:"contract"+i,metric:"contracts" as const,target,name:["Première signature","Livreur des fournées","Intendant du goûter","Maître des commandes","Légende des 34"][i]})),
 {id:"contractVariety0",metric:"contractKinds",target:3,name:"Le chef polyvalent"},
 {id:"contractVariety1",metric:"contractKinds",target:10,name:"Maître des trois chemins"},
 {id:"contractSchool0",metric:"contractSchools",target:2,name:"Les trois écoles du jacuzzi"}
);
export const COOKIE_MISSIONS:{id:string;name:string;metric:Metric;target:number;reward:number}[]=[{id:"m1",name:"Prendre le rythme",metric:"clicks",target:25,reward:25},{id:"m2",name:"Premier atelier",metric:"maxBuildings",target:5,reward:100},{id:"m3",name:"Le premier millier",metric:"lifetime",target:1000,reward:250},{id:"m4",name:"Les mains dans la pâte",metric:"clicks",target:500,reward:1500},{id:"m5",name:"Cuisine collective",metric:"maxBuildings",target:25,reward:1e4},{id:"m6",name:"Une cargaison de cookies",metric:"lifetime",target:1e6,reward:1e5},{id:"m7",name:"La grande manufacture",metric:"maxBuildings",target:100,reward:1e7},{id:"m8",name:"Le milliard croustillant",metric:"lifetime",target:1e9,reward:1e8},{id:"m9",name:"Retour aux fourneaux",metric:"prestige",target:1,reward:1e6},{id:"m10",name:"L’archipel des fours",metric:"maxBuildings",target:250,reward:1e10},{id:"m11",name:"Une galaxie au goûter",metric:"lifetime",target:1e12,reward:1e11},{id:"m12",name:"La recette éternelle",metric:"prestige",target:25,reward:1e12},
 {id:"m13",name:"Trois ateliers, une équipe",metric:"buildingKinds",target:3,reward:500},
 {id:"m14",name:"Une première pépite",metric:"goldenClicks",target:1,reward:100},
 {id:"m15",name:"Le carnet du chef",metric:"recipes",target:3,reward:500},
 {id:"m16",name:"Quinze instants dorés",metric:"goldenClicks",target:15,reward:25000},
 {id:"m17",name:"Toutes les cuissons",metric:"buildingKinds",target:5,reward:100000},
 {id:"m18",name:"Dix secrets bien gardés",metric:"recipes",target:10,reward:50000},
 {id:"m19",name:"L’or des 34 chevaux",metric:"goldenClicks",target:34,reward:100000},
 {id:"m20",name:"La cuisine des dimensions",metric:"buildingKinds",target:8,reward:1e8},
 {id:"m21",name:"L’encyclopédie du goûter",metric:"recipes",target:20,reward:1e7},
 {id:"m22",name:"Le siècle des étoiles",metric:"prestige",target:100,reward:1e10},
 {id:"m23",name:"Un goûter pour les dragons",metric:"lifetime",target:1e16,reward:1e13},
 {id:"m24",name:"Le club des mille soleils",metric:"prestige",target:1000,reward:1e12}
] as const;
COOKIE_MISSIONS.push(
 ...[1e18,1e20,1e22,1e24,1e26,1e28].map((target,i)=>({id:"cosmic_m"+i,name:["Le banquet des étoiles","L’autre rive du cosmos","Un goûter hors du temps","Les chevaux de l’infini","À la source des 34","La dernière constellation"][i],metric:"lifetime" as const,target,reward:target*.001})),
 ...[11,12,13,14,15,16].map((target,i)=>({id:"cosmic_build"+i,name:target+" ateliers différents dans l’empire",metric:"buildingKinds" as const,target,reward:BUILDINGS[i+10].price*.1}))
);
COOKIE_ACHIEVEMENTS.push(
 ...[11,12,13,14,15,16].map((target,i)=>({id:"cosmic_kind"+i,name:["Première porte astrale","La chevauchée cosmique","Le bain des étoiles","Le temps à croquer","Un haras sans fin","Aux origines des miettes"][i],metric:"buildingKinds" as const,target})),
 ...[45,50,60,70].map((target,i)=>({id:"cosmic_recipe"+i,name:["Carnet astral","Chef des constellations","Recettes hors du temps","Toutes les dimensions"][i],metric:"recipes" as const,target})),
 ...[1e22,1e24,1e26,1e28].map((target,i)=>({id:"cosmic_bake"+i,name:["Le grand voyage","L’infini se rapproche","Les 34 à l’origine","Le banquet sans fin"][i],metric:"lifetime" as const,target}))
);
COOKIE_MISSIONS.push(
 ...CHAPTER_THRESHOLDS.slice(6,17).map((target,i)=>({id:"multiverse_m"+i,name:BUILDINGS[i+16].name+" · premier horizon",metric:"lifetime" as const,target,reward:target*.001})),
 ...BUILDINGS.slice(16,27).map((b,i)=>({id:"multiverse_build"+i,name:(i+17)+" ateliers, un multivers",metric:"buildingKinds" as const,target:i+17,reward:b.price*.1}))
);
COOKIE_ACHIEVEMENTS.push(
 ...CHAPTER_THRESHOLDS.slice(6,17).map((target,i)=>({id:"multiverse_bake"+i,name:["Briser le plafond","Le miel des possibles","Toutes les branches du temps","Lire un univers","Tisser la nuit","Le battement des mondes","Avant la première étoile","Une éternité au four","Les graines du réel","La couronne des 34","Le banquet des origines"][i],metric:"lifetime" as const,target})),
 ...BUILDINGS.slice(16,27).map((b,i)=>({id:"multiverse_kind"+i,name:(i+17)+" saveurs d’univers",metric:"buildingKinds" as const,target:i+17})),
 ...[80,95,110,125].map((target,i)=>({id:"multiverse_recipe"+i,name:["Les recettes impossibles","Le grimoire des mondes","Chef de toutes les réalités","La table des origines"][i],metric:"recipes" as const,target}))
);
// Permanent records and rewards for the era after the Banquet des origines.
COOKIE_MISSIONS.push(
 ...BUILDINGS.slice(27,37).map((b,i)=>({id:"dawn_m"+i,name:b.name+" · nouvel horizon",metric:"lifetime" as const,target:buildingUnlock(i+27),reward:buildingUnlock(i+27)*.001})),
 ...BUILDINGS.slice(27,37).map((b,i)=>({id:"dawn_build"+i,name:(i+28)+" ateliers, une nouvelle aube",metric:"buildingKinds" as const,target:i+28,reward:b.price*.1}))
);
COOKIE_ACHIEVEMENTS.push(
 ...BUILDINGS.slice(27,37).map((b,i)=>({id:"dawn_bake"+i,name:["Un ruban d’aurore","Le biscuit sans fin","Le poids des étoiles","Les rêves prennent vie","De l’autre côté du visible","La musique du silence","Une pépite contient le monde","Le firmament en fleurs","Le goûter traverse les âges","Le premier crépitement"][i],metric:"lifetime" as const,target:buildingUnlock(i+27)})),
 ...BUILDINGS.slice(27,37).map((b,i)=>({id:"dawn_kind"+i,name:(i+28)+" saveurs d’éternité",metric:"buildingKinds" as const,target:i+28})),
 ...[135,145,155,165,175].map((target,i)=>({id:"dawn_recipe"+i,name:["Le carnet des aurores","Le savoir des songes","Chef de l’invisible","Le festin des éons","Toutes les recettes de l’aube"][i],metric:"recipes" as const,target})),
 ...[1e60,1e75].map((target,i)=>({id:"dawn_flow"+i,name:["Le souffle des éternités","L’univers tourne au four"][i],metric:"production" as const,target}))
);
COOKIE_MISSIONS.push(
 ...BUILDINGS.slice(37,47).map((b,i)=>({id:"jubilee_m"+i,name:b.name+" · nouvel ailleurs",metric:"lifetime" as const,target:buildingUnlock(i+37),reward:buildingUnlock(i+37)*.001})),
 ...BUILDINGS.slice(37,47).map((b,i)=>({id:"jubilee_build"+i,name:(i+38)+" ateliers pour le jubilé",metric:"buildingKinds" as const,target:i+38,reward:b.price*.1}))
);
COOKIE_ACHIEVEMENTS.push(
 ...BUILDINGS.slice(37,47).map((b,i)=>({id:"jubilee_bake"+i,name:["L’écho du premier biscuit","Une marée de lumière","La direction du goûter","Les yeux ouverts sur l’infini","La récolte des lendemains","Le vitrail de chocolat","D’une éternité à l’autre","Cartographier l’impossible","La flamme des 34","Le jubilé sans fin"][i],metric:"lifetime" as const,target:buildingUnlock(i+37)})),
 ...BUILDINGS.slice(37,47).map((b,i)=>({id:"jubilee_kind"+i,name:(i+38)+" saveurs d’ailleurs",metric:"buildingKinds" as const,target:i+38})),
 ...[185,195,205,215,225].map((target,i)=>({id:"jubilee_recipe"+i,name:["Le carnet des échos","Les recettes des lendemains","Chef des aurores","Le festin des ailleurs","La table du jubilé"][i],metric:"recipes" as const,target})),
 ...[1e90,1e105].map((target,i)=>({id:"jubilee_flow"+i,name:["La houle des mondes","Le souffle du jubilé"][i],metric:"production" as const,target}))
);
COOKIE_MISSIONS.push(...BUILDINGS.slice(47).flatMap((b,j)=>[
 {id:"voyage_m"+j,name:b.name+" · traversée",metric:"lifetime" as const,target:buildingUnlock(j+47),reward:buildingUnlock(j+47)*.001},
 {id:"voyage_build"+j,name:(j+48)+" ateliers, un nouveau monde",metric:"buildingKinds" as const,target:j+48,reward:b.price*.1}
]));
COOKIE_ACHIEVEMENTS.push(...BUILDINGS.slice(47).flatMap((b,j)=>[
 {id:"voyage_bake"+j,name:b.name+" · premier voyage",metric:"lifetime" as const,target:buildingUnlock(j+47)},
 {id:"voyage_kind"+j,name:(j+48)+" saveurs de l’impossible",metric:"buildingKinds" as const,target:j+48}
]),...[240,255,270].map((target,i)=>({id:"voyage_recipe"+i,name:["Le carnet des paradoxes","Le secret des trois flammes","Le menu du dernier banquet"][i],metric:"recipes" as const,target})));
export const METRIC_LABELS:Record<Metric,string>={lifetime:"cookies produits",clicks:"clics",maxBuildings:"bâtiments possédés",prestige:"étoiles de prestige",goldenClicks:"cookies dorés récoltés",recipes:"recettes maîtrisées",buildingKinds:"types de bâtiments réunis",production:"cookies / s atteints (hors bonus)",contracts:"contrats terminés",contractKinds:"contrats de chaque type",contractSchools:"contrats dans chaque école"};
export function formatCookies(n:number){if(n>=1e15)return n.toExponential(2).replace(".",",");if(n>=1e12)return (n/1e12).toLocaleString("fr-FR",{maximumFractionDigits:2})+" T";if(n>=1e9)return (n/1e9).toLocaleString("fr-FR",{maximumFractionDigits:2})+" Md";if(n>=1e6)return (n/1e6).toLocaleString("fr-FR",{maximumFractionDigits:2})+" M";return n.toLocaleString("fr-FR",{maximumFractionDigits:n<10?1:0});}
export const formatClickPower=(n:number)=>n<100?n.toLocaleString("fr-FR",{maximumFractionDigits:2}):formatCookies(n);
export function normalizeBuildings(p:CookiePlayer){while(p.buildings.length<BUILDINGS.length)p.buildings.push(0);return p;}
const buildingRecipes=BUILDINGS.map((_,i)=>UPGRADES.filter(u=>u.building===i));
const buildingLinks=BUILDINGS.map((_,i)=>UPGRADES.filter(u=>u.synergy?.target===i));
export function synergyMultiplier(p:CookiePlayer,index:number){return 1+(buildingLinks[index]??[]).reduce((n,u)=>n+(p.upgrades.includes(u.id)?Math.min(.5,(p.buildings[u.synergy!.source]??0)*.002):0),0)*(1+masteryRank(p,"links")*.1);}
export function baseProduction(p:CookiePlayer){return BUILDINGS.reduce((sum,b,i)=>sum+b.cps*(p.buildings[i]??0)*voyageBuildingMultiplier(p,i)*synergyMultiplier(p,i)*buildingRecipes[i].reduce((n,u)=>p.upgrades.includes(u.id)?n*2:n,1),0)*(1+p.prestige*.1)*(1+masteryRank(p,"variety")*.0025*p.buildings.filter(n=>n>0).length);}
export const TRIAL_BOOST_MS=60*60*1000;
export const trialBoostMultiplier=(p:CookiePlayer,now=Date.now())=>(p.trialBoostUntil??0)>now?2:1;
export const production=(p:CookiePlayer,now=Date.now())=>baseProduction(p)*rhythmMultiplier(p,now)*trialBoostMultiplier(p,now)*Math.max(p.rushUntil>now?7:1,(p.eventBuffs?.steamUntil??0)>now?3:1);
// Integrate each expiry once. Trial mastery doubles income; steam and rush use their strongest effect.
export function passiveGain(p:CookiePlayer,start:number,end:number){
 if(end<=start)return 0;
 const boundaries=[start,end,...[p.rushUntil,p.eventBuffs?.steamUntil,p.trialBoostUntil,p.rhythm?.boostUntil].filter((t):t is number=>t!==undefined&&t>start&&t<end)].sort((a,b)=>a-b);
 let weighted=0;for(let i=1;i<boundaries.length;i++){const at=boundaries[i-1];weighted+=(boundaries[i]-at)*rhythmMultiplier(p,at)*trialBoostMultiplier(p,at)*Math.max(p.rushUntil>at?7:1,(p.eventBuffs?.steamUntil??0)>at?3:1);}
 return baseProduction(p)*weighted/1000;
}
export const clickProductionShare=(p:CookiePlayer)=>.1+UPGRADES.filter(u=>u.share&&p.upgrades.includes(u.id)).reduce((n,u)=>n+u.share!,0);
export function clickPower(p:CookiePlayer,now=Date.now()){return rhythmMultiplier(p,now)*trialBoostMultiplier(p,now)*((1+p.prestige*.1)*UPGRADES.filter(u=>u.clickMultiplier&&p.upgrades.includes(u.id)).reduce((n,u)=>n*u.clickMultiplier!,1)+baseProduction(p)*(p.rushUntil>now?7:1)*clickProductionShare(p))*UPGRADES.filter(u=>u.clickTotalMultiplier&&p.upgrades.includes(u.id)).reduce((n,u)=>n*u.clickTotalMultiplier!,1);}
export const eventDiscount=(p:CookiePlayer,now=Date.now())=>(p.eventBuffs?.discountUntil??0)>now;
export function buildingPrice(p:CookiePlayer,index:number,quantity:number,now=Date.now()){const b=BUILDINGS[index];return Math.ceil(b.price*Math.pow(1.15,p.buildings[index]??0)*(Math.pow(1.15,quantity)-1)/.15*(p.specialization==="architect"?.92:1)*(1-masteryRank(p,"plans")*.01)*(eventDiscount(p,now)?.85:1));}
export function upgradeReady(p:CookiePlayer,u:Upgrade){return (!u.synergy||((p.buildings[u.synergy.source]??0)>=u.synergy.sourceOwned&&(p.buildings[u.synergy.target]??0)>=5))&&(u.building===undefined||(p.buildings[u.building]??0)>=(u.owned??0))&&(!u.requires||p.upgrades.includes(u.requires))&&p.clicks>=(u.clicks??0)&&p.lifetime>=(u.earned??0);}
const RECIPE_PURCHASE_ORDER=[...UPGRADES].sort((a,b)=>a.price-b.price);
/** Cheapest eligible recipes first, including prerequisites bought by this batch. */
export function recipePurchasePlan(p:CookiePlayer,budget=p.balance){
 const limit=Math.max(0,Math.min(CAP,Number.isFinite(budget)?budget:0));
 const preview={...p,upgrades:[...p.upgrades]};const recipes:Upgrade[]=[];let cost=0;
 for(;;){const next=RECIPE_PURCHASE_ORDER.find(u=>!preview.upgrades.includes(u.id)&&upgradeReady(preview,u)&&cost+u.price<=limit);if(!next)break;recipes.push(next);preview.upgrades.push(next.id);cost+=next.price;}
 return {recipes,cost};
}
export const MAX_ALL_UNLOCK=1e75;
/** Highest unlocked tier first, then use the remaining budget on every lower tier. */
export function workshopPurchasePlan(p:CookiePlayer,budget=p.balance,now=Date.now()){
 const purchases:{building:number;quantity:number}[]=[];
 let remaining=Math.max(0,Math.min(p.balance,COOKIE_CAP,Number.isFinite(budget)?budget:0)),cost=0;
 if(p.lifetime<MAX_ALL_UNLOCK)return {purchases,cost};
 const preview={...p,buildings:[...p.buildings],...(p.eventBuffs?{eventBuffs:{...p.eventBuffs}}:{})};
 for(let building=BUILDINGS.length-1;building>=0;building--){
  if(!buildingUnlocked(preview,building))continue;
  let low=0,high=1000-(preview.buildings[building]??0);
  while(low<high){const mid=Math.ceil((low+high)/2);if(buildingPrice(preview,building,mid,now)<=remaining)low=mid;else high=mid-1;}
  if(!low)continue;
  const price=buildingPrice(preview,building,low,now);remaining=Math.max(0,remaining-price);cost+=price;
  preview.buildings[building]=(preview.buildings[building]??0)+low;purchases.push({building,quantity:low});
  if(preview.eventBuffs)delete preview.eventBuffs.discountUntil;
 }
 return {purchases,cost};
}
export const prestigeGain=(p:CookiePlayer)=>Math.max(0,Math.floor(Math.sqrt((p.banked+p.runEarned)/1e9))-p.prestige);
export function cookieMetric(p:CookiePlayer,metric:Metric){if(metric==="contracts")return p.contracts?.completed??0;if(metric==="contractKinds")return Math.min(...CONTRACT_KINDS.map(k=>p.contracts?.byKind[k]??0));if(metric==="contractSchools")return Math.min(...SPECIALIZATIONS.map(s=>p.contracts?.bySchool[s.id]??0));if(metric==="recipes")return Math.max(p.maxRecipes??0,p.upgrades.length);if(metric==="buildingKinds")return Math.max(p.maxBuildingKinds??0,p.buildings.filter(n=>n>0).length);if(metric==="production")return Math.max(p.maxProduction??0,baseProduction(p));return p[metric];}
export function award(p:CookiePlayer){p.maxRecipes=cookieMetric(p,"recipes");p.maxBuildingKinds=cookieMetric(p,"buildingKinds");p.maxProduction=cookieMetric(p,"production");p.maxBuildings=Math.max(p.maxBuildings,p.buildings.reduce((a,b)=>a+b,0));p.achievements=[...new Set([...p.achievements,...COOKIE_ACHIEVEMENTS.filter(a=>cookieMetric(p,a.metric)>=a.target).map(a=>a.id)])];}
// Finite storage guard, beyond the playable chapters through 1e147.
export const COOKIE_CAP=1e200;
const CAP=COOKIE_CAP;
export const REBUILD_MISSIONS=[
 {id:"r1",name:"Rallumer les fours",metric:"buildings",target:5,reward:500},
 {id:"r2",name:"Retrouver le tour de main",metric:"recipes",target:1,reward:500},
 {id:"r3",name:"Reformer la brigade",metric:"buildings",target:25,reward:12500},
 {id:"r4",name:"Réouvrir le carnet",metric:"recipes",target:5,reward:25000},
 {id:"r5",name:"Relancer la grande cuisine",metric:"buildings",target:50,reward:50000},
 {id:"r6",name:"Le retour du chef",metric:"buildings",target:100,reward:250000}
] as const;
export const rebuildStarter=(stars:number)=>Math.floor(Math.min(1e6,250*(1+stars*.1)));
export const masteryStarter=(p:CookiePlayer,stars=p.prestige)=>Math.floor(rebuildStarter(stars)*(1+masteryRank(p,"starter")*.5));
export const rebuildReward=(p:CookiePlayer,base:number)=>Math.floor(base*Math.min(10,1+p.prestige*.1)*(p.rebuild?.rewardMultiplier??1));
export const rebuildMetric=(p:CookiePlayer,metric:"buildings"|"recipes")=>metric==="buildings"?p.buildings.reduce((a,b)=>a+b,0):p.upgrades.length;
// Rebuilding grants are spending power, not production: never feed lifetime or prestige.
function grantRebuild(p:CookiePlayer,amount:number){p.balance=Math.min(CAP,p.balance+amount);}
export function ensureRebuild(p:CookiePlayer){
 if(p.prestige<1||p.rebuild?.run===p.resets)return;
 p.rebuild={run:p.resets,claimed:[],rewardMultiplier:1+masteryRank(p,"grants")*.25,starterAmount:masteryStarter(p)};grantRebuild(p,p.rebuild.starterAmount!);
}
export function earn(p:CookiePlayer,amount:number){amount=Math.max(0,Math.min(CAP,amount));p.balance=Math.min(CAP,p.balance+amount);p.lifetime=Math.min(CAP,p.lifetime+amount);p.runEarned=Math.min(CAP,p.runEarned+amount);}
export const SPECIALIZATIONS=[
 {id:"architect",name:"Architecte",benefit:"Bâtiments −8 %",description:"Agrandis l’atelier à meilleur prix. La remise est déjà incluse dans les prix affichés."},
 {id:"artisan",name:"Artisan",benefit:"Clic manuel +25 %",description:"Tes mains donnent le tempo. Le pilote conserve sa puissance habituelle."},
 {id:"watcher",name:"Veilleur",benefit:"Jusqu’à 12 h hors ligne",description:"Les fours veillent plus longtemps pendant tes absences. Aucun clic automatique hors ligne."}
] as const;
export const SPECIALIZATION_COOLDOWN=20*60000,CONTRACT_COOLDOWN=20*60000;
export const manualClickPower=(p:CookiePlayer,now=Date.now())=>clickPower(p,now)*voyageManualMultiplier(p)*(p.specialization==="artisan"?1.25:1)*(1+masteryRank(p,"hands")*.04)*((p.eventBuffs?.manualUntil??0)>now?p.eventBuffs!.manualMultiplier:1);
export const offlineHours=(p:CookiePlayer)=>(p.specialization==="watcher"?12:8)+masteryRank(p,"rest");
export const CONTRACT_KINDS:ContractKind[]=["produce","spend","catch"];
export const CONTRACT_RANKS=[{at:0,name:"Commis du crew"},{at:1,name:"Première signature"},{at:5,name:"Livreur des fournées"},{at:20,name:"Intendant du goûter"},{at:60,name:"Maître des commandes"},{at:150,name:"Légende des 34"}] as const;
export const contractRank=(p:CookiePlayer)=>[...CONTRACT_RANKS].reverse().find(r=>(p.contracts?.completed??0)>=r.at)!;
export function contractTerms(p:CookiePlayer,kind:ContractKind){
 const referenceRate=Math.max(1,baseProduction(p)+autoClickRate(p.clicks)*clickPower({...p,rushUntil:0,trialBoostUntil:0,rhythm:undefined},0));
 return {referenceRate,target:kind==="catch"?2:Math.ceil(Math.min(CAP,600*referenceRate)),reward:Math.floor(Math.min(CAP/100,referenceRate*(kind==="catch"?30:60)))};
}
export function canInvest(p:CookiePlayer){return BUILDINGS.some((_,i)=>buildingUnlocked(p,i)&&(p.buildings[i]??0)<1000&&buildingPrice(p,i,1)<=CAP)||UPGRADES.some(u=>!p.upgrades.includes(u.id)&&upgradeReady(p,u));}
function contractProgress(p:CookiePlayer,kind:ContractKind,amount:number){const active=p.contracts?.active;if(active?.kind===kind)active.progress=Math.min(active.target,active.progress+Math.max(0,Math.min(CAP,amount)));}
function contractBook(p:CookiePlayer){return p.contracts??(p.contracts={cycle:0,nextAcceptAt:0,completed:0,byKind:{},bySchool:{}});}
export const AUTO_TIERS=[{clicks:2000,rate:2,name:"Petit pilote"},{clicks:5000,rate:4,name:"Double cadence"},{clicks:15000,rate:6,name:"Turbo gourmand"},{clicks:50000,rate:10,name:"Vitesse galactique"},{clicks:200000,rate:20,name:"Boîte de thon"}] as const;
export const autoClickRate=(clicks:number)=>[...AUTO_TIERS].reverse().find(t=>clicks>=t.clicks)?.rate??0;
export function settle(p:CookiePlayer,now:number){normalizeBuildings(p);ensureRebuild(p);settleTrial(p,now);const end=Math.max(p.updated,now),elapsed=Math.min(end-p.updated,offlineHours(p)*3600000),start=p.updated;const gain=passiveGain(p,start,start+elapsed);earn(p,gain);contractProgress(p,"produce",gain);wonderProgress(p,gain);p.clickCredit=Math.max(0,Math.min(MANUAL_BURST,p.clickCredit+(end-p.updated)*MANUAL_CPS/1000));const autoRate=autoClickRate(p.clicks);if(autoRate||p.autoCredit!==undefined)p.autoCredit=Math.min(autoRate*2,(p.autoCredit??0)+(end-p.updated)*autoRate/1000);p.updated=end;award(p);return gain;}
export const COOKIE_EVENTS=[
 {id:"comet",name:"Comète sucrée",minimum:50,seconds:20,effect:"cookies",hint:"20 s de production à récolter"},
 {id:"cookie",name:"Biscuit express",minimum:75,seconds:30,effect:"cookies",hint:"30 s de production à récolter"},
 {id:"gift",name:"Cadeau du crew",minimum:100,seconds:40,effect:"cookies",hint:"40 s de production à récolter"},
 {id:"rush",name:"Fournée éclair",minimum:0,seconds:30,effect:"rush",hint:"Production ×7 pendant 30 s"},
 {id:"golden",name:"Ticket doré",minimum:0,seconds:0,effect:"golden",hint:"Ton cookie doré devient prêt"},
 {id:"rain",name:"Pluie de miettes",minimum:250,seconds:120,effect:"cookies",hint:"2 min de production à récolter"},
 {id:"gallop",name:"Galop de braise",minimum:0,seconds:25,effect:"manual",hint:"Clics manuels ×2 pendant 25 s"},
 {id:"merchant",name:"Marchand des dimensions",minimum:0,seconds:45,effect:"discount",hint:"−15 % sur ton prochain lot de bâtiments · 45 s"},
 {id:"steam",name:"Nuage de vapeur",minimum:0,seconds:60,effect:"steam",hint:"Fours ×3 pendant 60 s · clics inchangés"},
 {id:"crossroads",name:"Carrefour stellaire",minimum:150,seconds:90,effect:"choice",hint:"Une récolte immédiate ou des clics surpuissants ?"}
] as const;
export const EVENT_VISIBLE_MS=22000,EVENT_WINDOW_MS=24000;
export type CookieEventId=typeof COOKIE_EVENTS[number]["id"];
export type EventEffect="cookies"|"rush"|"golden"|"manual"|"discount"|"steam";
export type EventChoice="harvest"|"burst";
export type EventBuffs={manualUntil?:number;manualMultiplier:2|3;steamUntil?:number;discountUntil?:number};
// Old scheduled surprises keep the historical six-event mapping across publication.
export const cookieEvent=(at:number,id?:CookieEventId)=>COOKIE_EVENTS.find(e=>e.id===id)??COOKIE_EVENTS[Math.floor(at/1000)%6];
export function cookieEventReward(p:CookiePlayer,at:number){const e=cookieEvent(at,p.nextEventAt===at?p.nextEventId:undefined);return e.effect==="cookies"||e.effect==="choice"?Math.max(e.minimum,baseProduction(p)*e.seconds)*(1+masteryRank(p,"gifts")*.1):0;}
const scheduleEvent=(p:CookiePlayer,now:number)=>{p.nextEventAt=now+90000+Math.floor(Math.random()*90001);const pool=COOKIE_EVENTS.filter(e=>e.id!==p.nextEventId);p.nextEventId=pool[Math.floor(Math.random()*pool.length)].id;};
function startManualEvent(p:CookiePlayer,now:number,multiplier:2|3,seconds:number){const b=p.eventBuffs??(p.eventBuffs={manualMultiplier:multiplier});if((b.manualUntil??0)>now&&b.manualMultiplier>multiplier)return;b.manualMultiplier=multiplier;b.manualUntil=now+seconds*1000;}
export type CookieAction={kind:"sync"}|{kind:"click";count:number}|{kind:"auto";count:number}|{kind:"event";eventAt:number;choice?:EventChoice}|{kind:"buy";building:number;quantity:number;maxCost?:number;run?:number}|{kind:"upgrade";upgrade:string;run?:number}|{kind:"buyRecipes";maxCost:number;run:number}|{kind:"buyAll";maxCost:number;run:number}|{kind:"golden"}|{kind:"mission";mission:string}|{kind:"rebuild";mission:string;run:number}|{kind:"contractAccept";contract:ContractKind;cycle:number}|{kind:"contractClaim";contractId:number}|{kind:"contractCancel";contractId:number}|{kind:"specialize";specialization:Specialization;expectedChangeAt:number}|{kind:"prestige"}|{kind:"mastery";ranks:Partial<Record<MasteryId,number>>;revision:number}|{kind:"followGoal";goal:FollowedGoal|null;revision:number}|EndgameAction|RhythmAction|VoyageAction;
export function applyCookieAction(p:CookiePlayer,action:CookieAction,now:number,world?:{wonderStage:number}){const offline=settle(p,now);let acceptedClicks=0,purchasedRecipes=0,recipeCost=0,eventReward=0,rebuildBonus=0,contractBonus=0,eventEffect:EventEffect|undefined;
 if(action.kind==="click"){acceptedClicks=Math.min(action.count,Math.floor(p.clickCredit));p.clickCredit-=acceptedClicks;p.clicks+=acceptedClicks;const gain=acceptedClicks*manualClickPower(p,now);earn(p,gain);contractProgress(p,"produce",gain);wonderProgress(p,gain);}
 if(action.kind==="auto"){if(!autoClickRate(p.clicks))throw Error("L’autoclic se débloque à 2 000 clics.");acceptedClicks=Math.min(action.count,Math.floor(p.autoCredit??0));p.autoCredit=(p.autoCredit??0)-acceptedClicks;p.clicks+=acceptedClicks;const gain=acceptedClicks*clickPower(p,now);earn(p,gain);contractProgress(p,"produce",gain);wonderProgress(p,gain);}
 if(action.kind==="event"){
  if(action.eventAt!==p.nextEventAt||now<action.eventAt||now>action.eventAt+EVENT_WINDOW_MS)throw Error("Cette surprise est déjà passée. La prochaine arrive bientôt !");
  const event=cookieEvent(action.eventAt,p.nextEventId);
  if(event.effect==="choice"?!["harvest","burst"].includes(action.choice??""):action.choice!==undefined)throw Error("Choisis une des deux étoiles de cette surprise.");
  eventEffect=event.effect==="choice"?(action.choice==="burst"?"manual":"cookies"):event.effect;
  if(eventEffect==="cookies"){eventReward=cookieEventReward(p,action.eventAt);earn(p,eventReward);}
  else if(eventEffect==="rush")p.rushUntil=Math.max(p.rushUntil,now+(event.seconds+3*masteryRank(p,"rush"))*1000);
  else if(eventEffect==="golden")p.goldenReadyAt=Math.min(p.goldenReadyAt,now);
  else if(eventEffect==="manual")startManualEvent(p,now,event.effect==="choice"?3:2,event.effect==="choice"?20:event.seconds);
  else{const buffs=p.eventBuffs??(p.eventBuffs={manualMultiplier:2});if(eventEffect==="steam")buffs.steamUntil=now+event.seconds*1000;else buffs.discountUntil=now+event.seconds*1000;}
  contractProgress(p,"catch",1);scheduleEvent(p,now);
 }
 if((action.kind==="buy"||action.kind==="upgrade")&&action.run!==undefined&&action.run!==p.resets)throw Error("Cet achat appartient à une ancienne fournée. Actualise ton atelier.");
 if(action.kind==="buy"){if(!BUILDINGS[action.building]||!buildingUnlocked(p,action.building))throw Error("Ce bâtiment attend ton prochain chapitre.");const cost=buildingPrice(p,action.building,action.quantity,now);if(action.maxCost!==undefined&&cost>action.maxCost)throw Error("Le prix a changé : l’offre du marchand est terminée. Vérifie le nouveau prix avant d’acheter.");if(p.buildings[action.building]+action.quantity>1000)throw Error("1000 exemplaires maximum par bâtiment.");if(p.balance+1e-6<cost)throw Error("Pas encore assez de cookies.");p.balance=Math.max(0,p.balance-cost);p.buildings[action.building]+=action.quantity;if(p.eventBuffs)delete p.eventBuffs.discountUntil;contractProgress(p,"spend",cost);}
 if(action.kind==="upgrade"){const u=UPGRADES.find(u=>u.id===action.upgrade);if(!u||p.upgrades.includes(u.id)||!upgradeReady(p,u))throw Error("Cette amélioration n’est pas disponible.");if(p.balance+1e-6<u.price)throw Error("Pas encore assez de cookies.");p.balance=Math.max(0,p.balance-u.price);p.upgrades.push(u.id);contractProgress(p,"spend",u.price);}
 if(action.kind==="buyAll"){if(action.run!==p.resets)throw Error("Cet achat appartient à une ancienne fournée.");if(p.lifetime<MAX_ALL_UNLOCK)throw Error("Max All se débloque à 10⁷⁵ cookies produits au total.");const plan=workshopPurchasePlan(p,action.maxCost,now);if(!plan.purchases.length)throw Error("Aucun bâtiment achetable avec ce budget.");p.balance=Math.max(0,p.balance-plan.cost);for(const lot of plan.purchases)p.buildings[lot.building]+=lot.quantity;if(p.eventBuffs)delete p.eventBuffs.discountUntil;contractProgress(p,"spend",plan.cost);}
 if(action.kind==="buyRecipes"){if(action.run!==p.resets)throw Error("Cet achat appartient à une ancienne fournée. Vérifie tes recettes avant de réessayer.");const plan=recipePurchasePlan(p,Math.min(p.balance,action.maxCost));if(!plan.recipes.length)throw Error("Aucune recette achetable avec ce budget. Actualise ton atelier.");p.balance=Math.max(0,p.balance-plan.cost);p.upgrades.push(...plan.recipes.map(u=>u.id));contractProgress(p,"spend",plan.cost);purchasedRecipes=plan.recipes.length;recipeCost=plan.cost;}
 if(action.kind==="golden"){if(now<p.goldenReadyAt)throw Error("Le prochain cookie doré se prépare.");earn(p,Math.max(25,baseProduction(p)*60));p.rushUntil=Math.max(p.rushUntil,now+goldenRushSeconds(p)*1000);p.goldenReadyAt=now+300000;p.goldenClicks++;}
 if(action.kind==="mission"){const m=COOKIE_MISSIONS.find(m=>m.id===action.mission);if(!m||p.missions.includes(m.id)||cookieMetric(p,m.metric)<m.target)throw Error("Cet objectif n’est pas encore disponible.");p.missions.push(m.id);earn(p,m.reward);}
 if(action.kind==="rebuild"){const m=REBUILD_MISSIONS.find(m=>m.id===action.mission);if(p.prestige<1||action.run!==p.resets||!m||p.rebuild?.claimed.includes(m.id)||rebuildMetric(p,m.metric)<m.target)throw Error("Cet objectif n’est pas disponible pour cette fournée.");p.rebuild!.claimed.push(m.id);rebuildBonus=rebuildReward(p,m.reward);grantRebuild(p,rebuildBonus);}

 if(action.kind==="contractAccept"){
  if(p.lifetime<1e6)throw Error("Les contrats se débloquent à un million de cookies produits.");
  const book=contractBook(p);if(action.cycle!==book.cycle||book.active||now<book.nextAcceptAt)throw Error("Le bureau prépare ta prochaine commande. Actualise pour voir ton contrat.");
  if(action.contract==="spend"&&!canInvest(p))throw Error("Ton atelier ne propose plus d’achat disponible. Choisis un autre contrat.");
  book.cycle++;book.nextAcceptAt=now+CONTRACT_COOLDOWN;book.active={id:book.cycle,kind:action.contract,acceptedAt:now,...contractTerms(p,action.contract),progress:0,...(p.specialization?{school:p.specialization}:{})};
 }
 if(action.kind==="contractClaim"||action.kind==="contractCancel"){
  const book=p.contracts,active=book?.active;if(!book||!active||active.id!==action.contractId)throw Error("Ce contrat n’est plus actif. Actualise le bureau.");
  if(action.kind==="contractClaim"){
   if(active.progress<active.target)throw Error("La commande n’est pas encore terminée.");
   if(active.reward>CAP-p.balance)throw Error("Ta réserve est pleine. Fais un achat avant de réclamer la prime.");
   if(p.balance+active.reward===p.balance)throw Error("Cette petite prime ne peut pas encore être ajoutée à une réserve aussi grande. Dépense des cookies avant de la réclamer.");
   contractBonus=active.reward;grantRebuild(p,contractBonus);book.completed++;book.byKind[active.kind]=(book.byKind[active.kind]??0)+1;if(active.school)book.bySchool[active.school]=(book.bySchool[active.school]??0)+1;
  }
  delete book.active;
 }
 if(action.kind==="specialize"){
  if(p.prestige<1)throw Error("Ta première étoile débloque les trois écoles.");
  if(action.expectedChangeAt!==(p.specializationChangeAt??0)||now<(p.specializationChangeAt??0))throw Error("Le prochain changement d’école n’est pas encore prêt. Actualise le bureau.");
  if(p.specialization===action.specialization)throw Error("Cette école est déjà active.");
  p.specialization=action.specialization;p.specializationChangeAt=now+SPECIALIZATION_COOLDOWN;
 }
 if(action.kind==="prestige"){const gain=prestigeGain(p);if(gain<1)throw Error("Produis davantage pour gagner une étoile.");p.prestige+=gain;p.resets++;p.banked=Math.min(CAP,p.banked+p.runEarned);p.balance=0;p.runEarned=0;p.buildings=BUILDINGS.map(()=>0);p.upgrades=[];p.rushUntil=0;delete p.eventBuffs;p.goldenReadyAt=now+60000;ensureRebuild(p);}
 if(action.kind==="mastery")applyMastery(p,action.ranks,action.revision,now);
 if(action.kind==="followGoal"){if(action.revision!==(p.followRevision??0))throw Error("Ton objectif a changé dans un autre onglet. Réessaie.");p.followRevision=(p.followRevision??0)+1;if(action.goal){validateFollowedGoal(p,action.goal);p.followedGoal={...action.goal};}else delete p.followedGoal;}
 applyEndgameAction(p,action,now,world);
 applyRhythmAction(p,action,now);
 applyVoyageAction(p,action,now);
 if(!p.nextEventAt||now>p.nextEventAt+EVENT_WINDOW_MS)scheduleEvent(p,now);
 award(p);return {offline,acceptedClicks,...(purchasedRecipes?{purchasedRecipes,recipeCost}:{}),...(rebuildBonus?{rebuildBonus}:{}),...(contractBonus?{contractBonus}:{}),...(eventEffect?{eventReward,eventEffect}:{})};
}

// Endgame is additive: old IDs and all historical progress stay untouched.
export const TRIALS=[
 {id:"trio",name:"Trois astres en cuisine",rule:"Seulement les cuillères, les fours et les cuisines du crew.",allowed:[0,1,2],seed:100,target:25000,click:20,scale:5,budget:null,gold:180,silver:420,decor:"Nuit astrale"},
 {id:"hands",name:"Les sabots du maître",rule:"Sans pilote. Des clics puissants et deux petits bâtiments.",allowed:[0,1],seed:0,target:5000,click:25,scale:1,budget:null,gold:90,silver:240,decor:"Braise dorée"},
 {id:"budget",name:"Le dernier panier",rule:"5 000 cookies pour investir. Aucun clic productif ni réinvestissement.",allowed:[0,1,2,3,4],seed:5000,target:50000,click:0,scale:5,budget:5000,gold:450,silver:720,decor:"Lagon cosmique"}
] as const;
export type TrialId=typeof TRIALS[number]["id"];
export type TrialRun={id:number;scenario:TrialId;rulesVersion:1;startedAt:number;updated:number;balance:number;produced:number;spent:number;buildings:number[];clickCredit:number;finishedAt?:number};
export type TrialBook={cycle:number;active?:TrialRun;bests:Partial<Record<TrialId,{seconds:number;medal:number}>>};
export type WonderBook={completed:number[];active?:{stage:number;target:number;progress:number;referenceRate:number}};
// Stable stage indices: append new projects; never reorder delivered contributions.
export const WONDER_PROJECTS=[
 {id:"jacuzzi",name:"Le Jacuzzi cosmique",short:"Jacuzzi cosmique",start:0,end:3,image:"/cosmic-bakery-island.webp",decor:"Bain de galaxies",description:"Un refuge gourmand au milieu des étoiles. Notre première merveille, construite ensemble.",ambience:"Un atelier sous les étoiles, entre biscuit doré et lumière turquoise."},
 {id:"observatory",name:"L’Observatoire des 34",short:"Observatoire des 34",start:3,end:6,image:"/wonder-observatory.webp",decor:"Nuit des constellations",description:"Un télescope géant pour retrouver les 34 chevaux dans la voûte céleste.",ambience:"Un ciel profond, un dôme de turquoise et les reflets chauds du laiton."},
 {id:"garden",name:"Le Jardin des comètes",short:"Jardin des comètes",start:6,end:9,image:"/wonder-garden.webp",decor:"Jardin céleste",description:"Un arbre de sucre, des fleurs de bonbon et des cascades qui se jettent dans le cosmos.",ambience:"Un atelier baigné de menthe lumineuse, de fleurs roses et de poussière d’or."},
 {id:"raceway",name:"L’Hippodrome des étoiles",short:"Hippodrome des étoiles",start:9,end:12,image:"/wonder-raceway.webp",decor:"Galop stellaire",description:"La piste de caramel où nos chevaux célestes font leur tour d’honneur.",ambience:"Des tribunes de biscuit, un trophée doré et une course au-dessus des galaxies."}
] as const;
export type WonderProjectId=typeof WONDER_PROJECTS[number]["id"];
export const WONDER_STAGES=[
 {name:"Les fondations gourmandes",reward:"Le four dimensionnel illumine le QG."},
 {name:"L’écurie des constellations",reward:"Les chevaux stellaires rejoignent la merveille."},
 {name:"Le grand bain cosmique",reward:"Le Jacuzzi cosmique brille pour tout le crew."},
 {name:"La terrasse des astronomes",reward:"Les chemins de biscuit prennent de la hauteur."},
 {name:"Le dôme aux mille reflets",reward:"Le grand télescope s’éveille sous son dôme turquoise."},
 {name:"La constellation des 34",reward:"L’Observatoire et le décor Nuit des constellations sont acquis pour tous."},
 {name:"Les allées de caramel",reward:"Les premières fleurs de bonbon bordent les chemins."},
 {name:"L’arbre à poussière d’étoiles",reward:"Un arbre de sucre illumine le jardin."},
 {name:"Les cascades de comètes",reward:"Le Jardin des comètes et le décor Jardin céleste sont acquis pour tous."},
 {name:"La piste du grand galop",reward:"L’anneau de caramel rejoint les étoiles."},
 {name:"Les tribunes de biscuit",reward:"Le crew prend place autour de la piste céleste."},
 {name:"Le tour d’honneur",reward:"L’Hippodrome et le décor Galop stellaire sont acquis pour tous."}
] as const;
export function wonderProjectAt(stage:number){return WONDER_PROJECTS.find(p=>stage<p.end)??WONDER_PROJECTS[WONDER_PROJECTS.length-1];}
export function wonderUnlocked(id:WonderProjectId,stage:number){const project=WONDER_PROJECTS.find(p=>p.id===id);return !!project&&stage>=project.end;}
export const TRIAL_UNLOCK=1e12;
export type EndgameAction={kind:"trialStart";scenario:TrialId;cycle:number}|{kind:"trialClick";runId:number;count:number}|{kind:"trialBuy";runId:number;building:number;quantity:number}|{kind:"trialClaim";runId:number}|{kind:"trialCancel";runId:number}|{kind:"decor";decor:TrialId|"default"}|{kind:"wonderDecor";decor:WonderProjectId|"default"}|{kind:"wonderStart";stage:number}|{kind:"wonderDeliver";stage:number};
export function trialProduction(t:TrialRun){const s=TRIALS.find(s=>s.id===t.scenario)!;return s.allowed.reduce<number>((n,i)=>n+(t.buildings[i]??0)*BUILDINGS[i].cps*s.scale,0);}
export function trialPrice(t:TrialRun,index:number,quantity:number){return Math.ceil(BUILDINGS[index].price*1.15**(t.buildings[index]??0)*(1.15**quantity-1)/.15);}
export function trialMedal(seconds:number,scenario:TrialId){const s=TRIALS.find(s=>s.id===scenario)!;return seconds<=s.gold?3:seconds<=s.silver?2:1;}
export function settleTrial(p:CookiePlayer,now:number){
 const t=p.trials?.active;if(!t||t.finishedAt!==undefined)return;
 const spec=TRIALS.find(s=>s.id===t.scenario)!,end=Math.max(t.updated,now),elapsed=(end-t.updated)/1000,rate=trialProduction(t),remaining=Math.max(0,spec.target-t.produced),gain=Math.min(remaining,rate*elapsed);
 if(rate>0&&gain>=remaining)t.finishedAt=t.updated+remaining/rate*1000;
 t.produced+=gain;t.balance+=gain;t.clickCredit=Math.min(MANUAL_BURST,t.clickCredit+elapsed*MANUAL_CPS);t.updated=end;
}
function wonderProgress(p:CookiePlayer,amount:number){const a=p.wonder?.active;if(a)a.progress=Math.min(a.target,a.progress+Math.max(0,amount));}
export function wonderSummary(rows:{author:string;authorKey:string;completed:number[]}[]){
 const stages=WONDER_STAGES.map((s,i)=>({...s,contributors:rows.filter(r=>r.completed.includes(i)).map(({author,authorKey})=>({author,authorKey}))}));
 const stage=stages.findIndex(s=>s.contributors.length<4);
 return {stage:stage<0?WONDER_STAGES.length:stage,stages};
}
function applyEndgameAction(p:CookiePlayer,a:CookieAction,now:number,world?:{wonderStage:number}){
 if(a.kind==="trialStart"){
  if(p.lifetime<TRIAL_UNLOCK)throw Error("Les épreuves s’ouvrent à 1 T de cookies produits.");
  const b=p.trials??(p.trials={cycle:0,bests:{}}),spec=TRIALS.find(s=>s.id===a.scenario);
  if(!spec||b.active||a.cycle!==b.cycle)throw Error("Une tentative a déjà changé. Actualise les épreuves.");
  b.cycle++;b.active={id:b.cycle,scenario:spec.id,rulesVersion:1,startedAt:now,updated:now,balance:spec.seed,produced:0,spent:0,buildings:[0,0,0,0,0],clickCredit:MANUAL_BURST};
 }
 if(a.kind==="trialClick"||a.kind==="trialBuy"||a.kind==="trialClaim"||a.kind==="trialCancel"){
  const b=p.trials,t=b?.active;if(!b||!t||t.id!==a.runId)throw Error("Cette tentative n’est plus active.");
  const spec=TRIALS.find(s=>s.id===t.scenario)!;
  if(a.kind==="trialCancel"){delete b.active;return;}
  if(a.kind==="trialClaim"){
   if(t.finishedAt===undefined)throw Error("L’épreuve n’est pas encore terminée.");
   const seconds=Math.max(0,(t.finishedAt-t.startedAt)/1000),medal=trialMedal(seconds,t.scenario),best=b.bests[t.scenario];
   if(!best||seconds<best.seconds)b.bests[t.scenario]={seconds,medal};
   if(!p.decor&&!p.wonderDecor)p.decor=t.scenario;
   p.trialBoostUntil=now+TRIAL_BOOST_MS;
   delete b.active;return;
  }
  if(t.finishedAt!==undefined)throw Error("Épreuve réussie ! Récupère ta médaille.");
  if(a.kind==="trialClick"){
   if(!spec.click)throw Error("Ce défi se joue uniquement avec les bâtiments.");
   const count=Math.min(a.count,Math.floor(t.clickCredit));t.clickCredit-=count;
   const gain=Math.min(spec.target-t.produced,count*spec.click);t.balance+=gain;t.produced+=gain;
   if(t.produced>=spec.target)t.finishedAt=now;
  }else{
   if(!(spec.allowed as readonly number[]).includes(a.building)||(t.buildings[a.building]??0)+a.quantity>1000)throw Error("Ce bâtiment n’est pas disponible dans cette épreuve.");
   const cost=trialPrice(t,a.building,a.quantity);
   if(t.balance<cost||(spec.budget!==null&&t.spent+cost>spec.budget))throw Error("Le budget de l’épreuve ne permet pas cet achat.");
   t.balance-=cost;t.spent+=cost;t.buildings[a.building]+=a.quantity;
  }
 }
 if(a.kind==="decor"){
  if(a.decor==="default"){delete p.decor;delete p.wonderDecor;}
  else {if(!p.trials?.bests[a.decor])throw Error("Termine cette épreuve pour gagner son décor.");p.decor=a.decor;delete p.wonderDecor;}
 }
 if(a.kind==="wonderDecor"){
  if(a.decor!=="default"&&(!world||!wonderUnlocked(a.decor,world.wonderStage)))throw Error("Le crew doit terminer ce chantier pour débloquer son décor.");
  delete p.decor;if(a.decor==="default")delete p.wonderDecor;else p.wonderDecor=a.decor;
 }
 if(a.kind==="wonderStart"){
  if(p.lifetime<1000)throw Error("Le chantier s’ouvre à 1 000 cookies produits.");
  const w=p.wonder??(p.wonder={completed:[]});
  if(!WONDER_STAGES[a.stage]||w.active||w.completed.includes(a.stage))throw Error("Ta participation à cette étape est déjà engagée.");
  const referenceRate=contractTerms(p,"produce").referenceRate;
  w.active={stage:a.stage,referenceRate,target:Math.min(CAP,referenceRate*600),progress:0};
 }
 if(a.kind==="wonderDeliver"){
  const w=p.wonder,t=w?.active;
  if(!w||!t||t.stage!==a.stage||w.completed.includes(a.stage)||t.progress<t.target)throw Error("Ta contribution n’est pas encore prête pour cette étape.");
  w.completed.push(a.stage);delete w.active;
 }
}

// Voyages are permanent side progression. They never mint cookies or prestige.
export const INGREDIENT_IDS=["dew","cocoa","crystal","ember","pearl","dust"] as const;
export type IngredientId=typeof INGREDIENT_IDS[number];
export const INGREDIENTS=[
 {id:"dew",name:"Rosée lunaire",symbol:"◒",color:"#80efcb"},
 {id:"cocoa",name:"Cacao sauvage",symbol:"◆",color:"#e5b88a"},
 {id:"crystal",name:"Cristal sucré",symbol:"◇",color:"#93d9ff"},
 {id:"ember",name:"Braise d’origine",symbol:"✦",color:"#ffb55d"},
 {id:"pearl",name:"Perle du paradoxe",symbol:"◉",color:"#cbafff"},
 {id:"dust",name:"Poussière d’étoile",symbol:"✧",color:"#ffafd8"}
] as const;
export const VOYAGE_IDS=["grove","lagoon","archive","paradox","genesis","banquet"] as const;
export type VoyageId=typeof VOYAGE_IDS[number];
type VoyageDestination={id:VoyageId;name:string;threshold:number;minutes:number;primary:IngredientId;secondary:IngredientId;affinity:number;image:string;panel?:number;description:string;encounters:readonly [string,string];relics:readonly [string,string]};
export const VOYAGE_DESTINATIONS:VoyageDestination[]=[
 {id:"grove",name:"Clairière des miettes",threshold:1e6,minutes:3,primary:"dew",secondary:"cocoa",affinity:0,image:"/wonder-garden.webp",description:"Des fleurs de sucre cachent les premiers ingrédients du voyage.",encounters:["Un ruisseau de rosée traverse la clairière. Des inscriptions brillent sous les feuilles.","Un chemin tranquille longe le verger. Une porte minuscule s’ouvre dans le plus vieux tronc."],relics:["La carte sous la feuille","La clé du vieux verger"]},
 {id:"lagoon",name:"Lagon des étoiles",threshold:1e12,minutes:6,primary:"cocoa",secondary:"crystal",affinity:1,image:"/cosmic-bakery-island.webp",description:"La marée dépose des cristaux dans le sable de cacao.",encounters:["La plage déborde de cacao. Au loin, un phare clignote dans une langue oubliée.","Le ponton ramène au camp. Sous l’eau, une cloche sonne sans faire de bruit."],relics:["Le chant du phare","La cloche du lagon"]},
 {id:"archive",name:"Archives des aurores",threshold:1e24,minutes:9,primary:"crystal",secondary:"ember",affinity:2,image:"/wonder-observatory.webp",description:"Les recettes disparues dorment dans un observatoire de verre.",encounters:["Des cristaux poussent entre les rayonnages. Un livre refuse de rester fermé.","La grande galerie est éclairée. Un escalier conduit à une pièce absente de tous les plans."],relics:["Le livre qui se souvient","La chambre sans numéro"]},
 {id:"paradox",name:"Royaume des paradoxes",threshold:1e123,minutes:12,primary:"ember",secondary:"pearl",affinity:0,image:"/voyage-paradox.webp",description:"Deux chemins opposés arrivent au même four. Choisis ce que tu rapporteras.",encounters:["La braise gèle au bord d’un escalier inversé. Un miroir montre le lendemain.","Le palais possède deux sorties. La troisième n’existe que dans son reflet."],relics:["Le souvenir de demain","La troisième sortie"]},
 {id:"genesis",name:"Four des origines",threshold:1e132,minutes:15,primary:"pearl",secondary:"dust",affinity:1,image:"/voyage-genesis.webp",description:"Les premières flammes transforment la matière en ingrédients impossibles.",encounters:["Les perles naissent dans le feu. Trois flammes semblent raconter la même histoire.","Le foyer central est stable. Une étincelle indique un passage avant le commencement."],relics:["Le pacte des trois flammes","L’étincelle avant le temps"]},
 {id:"banquet",name:"Dernier banquet",threshold:1e141,minutes:18,primary:"dust",secondary:"dew",affinity:2,image:"/voyage-banquet.webp",description:"Les derniers invités ont laissé des étoiles sur la nappe du cosmos.",encounters:["Une pluie d’étoiles recouvre la table. Le menu porte le nom d’un invité inconnu.","Les lanternes montrent le retour. Une trente-cinquième chaise attend dans l’ombre."],relics:["Le menu de l’invité","La chaise du prochain monde"]}
];
export const SECRET_RECIPE_IDS=["galette","nectar","caramel","constellation","biscuit","perles","souffle","menu","symphony"] as const;
export type SecretRecipeId=typeof SECRET_RECIPE_IDS[number];
export const SECRET_RECIPES:{id:SecretRecipeId;name:string;cost:Partial<Record<IngredientId,number>>;description:string}[]=[
 {id:"galette",name:"Galette de la clairière",cost:{dew:6,cocoa:4},description:"Les dix premiers bâtiments produisent 50 % de plus."},
 {id:"nectar",name:"Nectar de lune",cost:{dew:8,crystal:3},description:"Tous les bâtiments produisent 15 % de plus."},
 {id:"caramel",name:"Caramel de braise",cost:{cocoa:8,ember:2},description:"Les clics manuels produisent 50 % de plus. Le pilote garde sa puissance."},
 {id:"constellation",name:"Tarte aux constellations",cost:{crystal:8,dust:3},description:"Les bâtiments du Four dimensionnel au Jubilé produisent 35 % de plus."},
 {id:"biscuit",name:"Biscuit impossible",cost:{ember:6,pearl:3},description:"Les neuf bâtiments après le Jubilé produisent 40 % de plus."},
 {id:"perles",name:"Perles de voyage",cost:{pearl:6,dew:4},description:"Les voyages lancés avec cette recette gagnent 3 ingrédients principaux. Ce bonus reste acquis après le départ."},
 {id:"souffle",name:"Soufflé des étoiles",cost:{dust:5,dew:5},description:"Le cookie doré récolté avec cette recette prolonge sa fournée ×7 de 15 secondes, même si tu changes ensuite de recette."},
 {id:"menu",name:"Menu du commencement",cost:{ember:6,dust:4},description:"Tous les bâtiments produisent 25 % de plus."},
 {id:"symphony",name:"Symphonie du goûter",cost:{cocoa:10,pearl:6},description:"Bâtiments +20 % et clics manuels +30 %."}
];
export type CompanionRecord={stage:1|2|3;returns:number;finds:number;secrets:number;regions:VoyageId[]};
export type VoyageRun={id:number;destination:VoyageId;team:number[];startedAt:number;readyAt:number;step:0|1|2;cargo:Partial<Record<IngredientId,number>>;secrets:string[];choices:string[]};
export type VoyageBook={revision:number;cycle:number;inventory:Partial<Record<IngredientId,number>>;recipes:SecretRecipeId[];relics:string[];companions:Record<string,CompanionRecord>;active?:VoyageRun;last?:{id:number;destination:VoyageId;team:number[];cargo:Partial<Record<IngredientId,number>>;newRelics:string[]};equippedRecipe?:SecretRecipeId;equippedCompanion?:number;paradoxMode?:"light"|"mirror";paradoxChangeAt?:number;banquetCourse?:number};
export type VoyageAction=
 {kind:"voyageStart";destination:VoyageId;team:number[];cycle:number}|
 {kind:"voyageChoice";runId:number;step:0|1;choice:"gather"|"study"|"safe"|"secret"}|
 {kind:"voyageClaim"|"voyageCancel";runId:number}|
 {kind:"secretCraft";recipe:SecretRecipeId;revision:number}|
 {kind:"secretEquip";recipe:SecretRecipeId|null;revision:number}|
 {kind:"companionEvolve";companion:number;stage:2|3;revision:number}|
 {kind:"companionEquip";companion:number|null;revision:number}|
 {kind:"paradoxSwitch";mode:"light"|"mirror";revision:number}|
 {kind:"banquetPrepare";course:number;revision:number};
export const companionRecord=(p:CookiePlayer,index:number):CompanionRecord=>p.voyages?.companions[index]??{stage:1,returns:0,finds:0,secrets:0,regions:[]};
export const COMPANION_ROLES=[{name:"Éclaireur",description:"Découvrir plusieurs régions"},{name:"Gourmand",description:"Rapporter des ingrédients"},{name:"Gardien",description:"Explorer les passages secrets"}] as const;
export const companionRole=(index:number)=>((index-60)%3+3)%3;
export function companionChallenges(p:CookiePlayer,index:number,stage:2|3){const r=companionRecord(p,index),role=companionRole(index);return [
 {label:"Expéditions terminées avec ce compagnon",value:r.returns,target:stage===2?2:8},
 role===0?{label:"Régions différentes explorées",value:r.regions.length,target:stage===2?1:3}:role===1?{label:"Ingrédients rapportés",value:r.finds,target:stage===2?15:70}:{label:"Passages secrets explorés",value:r.secrets,target:stage===2?1:6}
];}
export const companionCanEvolve=(p:CookiePlayer,index:number,stage:2|3)=>companionRecord(p,index).stage===stage-1&&companionChallenges(p,index,stage).every(c=>c.value>=c.target);
export const secretCanCraft=(p:CookiePlayer,recipe:typeof SECRET_RECIPES[number])=>!p.voyages?.recipes.includes(recipe.id)&&Object.entries(recipe.cost).every(([id,n])=>(p.voyages?.inventory[id as IngredientId]??0)>=n);
export function secretCombination(a:IngredientId,b:IngredientId){return a===b?undefined:SECRET_RECIPES.find(r=>Object.keys(r.cost).length===2&&a in r.cost&&b in r.cost);}
export function voyageTeamBonus(p:CookiePlayer,d:VoyageDestination,team:number[]){return team.reduce((n,id)=>n+(companionRole(id)===d.affinity?1:0)+companionRecord(p,id).stage-1,0)+(p.voyages?.equippedRecipe==="perles"?3:0);}
export const BANQUET_COURSES=[
 {name:"L’entrée des voyageurs",cost:{dew:8,pearl:4},multiplier:1.25},
 {name:"Le plat des origines",cost:{ember:10,dust:6},multiplier:1.5},
 {name:"Le dessert des 34",cost:{pearl:12,dust:12},multiplier:2}
] as const;
export function voyageBuildingMultiplier(p:CookiePlayer,index:number){
 const b=p.voyages,r=b?.equippedRecipe;let m=r==="nectar"?1.15:r==="menu"?1.25:r==="symphony"?1.2:r==="galette"&&index<10?1.5:r==="constellation"&&index>=10&&index<47?1.35:r==="biscuit"&&index>=47?1.4:1;
 if(index>=47&&index<50){const mirror=b?.paradoxMode==="mirror";m*=index===48?(mirror?3:1):(mirror?1:2);}
 if(index>=50&&index<53)m*=1+Math.min(1,Math.min(...[50,51,52].map(i=>p.buildings[i]??0))/50);
 if(index>=53&&index<56)m*=BANQUET_COURSES[(b?.banquetCourse??0)-1]?.multiplier??1;
 return m;
}
export const voyageManualMultiplier=(p:CookiePlayer)=>p.voyages?.equippedRecipe==="caramel"?1.5:p.voyages?.equippedRecipe==="symphony"?1.3:1;
function voyageBook(p:CookiePlayer){return p.voyages??(p.voyages={revision:0,cycle:0,inventory:{},recipes:[],relics:[],companions:{}});}
function requireCompanion(p:CookiePlayer,index:number){if(!Number.isInteger(index)||!COOKIE_AVATARS.some(a=>a.index===index&&p.lifetime>=a.threshold))throw Error("Ce compagnon n’est pas encore débloqué.");}
function spendIngredients(b:VoyageBook,cost:Partial<Record<IngredientId,number>>){if(Object.entries(cost).some(([id,n])=>(b.inventory[id as IngredientId]??0)<n))throw Error("Il manque des ingrédients. Rapporte-les d’une expédition.");for(const [id,n] of Object.entries(cost))b.inventory[id as IngredientId]=(b.inventory[id as IngredientId]??0)-n;}
function applyVoyageAction(p:CookiePlayer,a:CookieAction,now:number){
 if(!["voyageStart","voyageChoice","voyageClaim","voyageCancel","secretCraft","secretEquip","companionEvolve","companionEquip","paradoxSwitch","banquetPrepare"].includes(a.kind))return;
 const b=voyageBook(p);if("revision" in a&&a.revision!==b.revision)throw Error("Ton carnet de voyage a changé dans un autre onglet. Actualise avant de réessayer.");
 if(a.kind==="voyageStart"){
  const d=VOYAGE_DESTINATIONS.find(d=>d.id===a.destination);if(!d||p.lifetime<d.threshold)throw Error("Cette destination attend un prochain horizon.");
  if(b.active||a.cycle!==b.cycle)throw Error("Une expédition a déjà changé. Actualise le carnet.");
  if(a.team.length<1||a.team.length>3||new Set(a.team).size!==a.team.length)throw Error("Choisis un à trois compagnons différents.");
  a.team.forEach(id=>requireCompanion(p,id));const bonus=voyageTeamBonus(p,d,a.team);
  b.cycle++;b.active={id:b.cycle,destination:d.id,team:[...a.team],startedAt:now,readyAt:now+d.minutes*20000,step:0,cargo:{[d.primary]:4+bonus,[d.secondary]:2},secrets:[],choices:[]};
 }
 if(a.kind==="voyageChoice"||a.kind==="voyageClaim"||a.kind==="voyageCancel"){
  const run=b.active;if(!run||run.id!==a.runId)throw Error("Cette expédition n’est plus active.");const d=VOYAGE_DESTINATIONS.find(d=>d.id===run.destination)!;
  if(a.kind==="voyageCancel"){delete b.active;b.revision++;return;}
  if(now<run.readyAt)throw Error("Tes compagnons sont encore en route.");
  if(a.kind==="voyageChoice"){
   if(run.step!==a.step||(run.step===0?!["gather","study"].includes(a.choice):!["safe","secret"].includes(a.choice)))throw Error("Cette rencontre a déjà été résolue. Actualise le voyage.");
   const secret=a.choice==="study"||a.choice==="secret",ingredient=secret?d.secondary:d.primary;
   run.cargo[ingredient]=(run.cargo[ingredient]??0)+(secret?2:4);if(secret)run.secrets.push(d.id+":"+run.step);
   run.choices.push(a.choice);run.step=(run.step+1) as 1|2;run.readyAt=now+d.minutes*20000;
  }else{
   if(run.step!==2)throw Error("Il reste une rencontre à explorer avant le retour.");
   if(Object.entries(run.cargo).some(([id,n])=>(b.inventory[id as IngredientId]??0)+n>1e9))throw Error("Le garde-manger est plein. Compose une recette avant de récupérer le voyage.");
   const newRelics=run.secrets.filter(id=>!b.relics.includes(id)),finds=Object.values(run.cargo).reduce((n,v)=>n+v,0);
   for(const [id,n] of Object.entries(run.cargo))b.inventory[id as IngredientId]=(b.inventory[id as IngredientId]??0)+n;
   for(const id of run.team){const r=companionRecord(p,id);b.companions[id]={...r,returns:Math.min(1e9,r.returns+1),finds:Math.min(1e9,r.finds+finds),secrets:Math.min(1e9,r.secrets+run.secrets.length),regions:[...new Set([...r.regions,d.id])]};}
   b.relics=[...new Set([...b.relics,...run.secrets])];b.last={id:run.id,destination:d.id,team:[...run.team],cargo:{...run.cargo},newRelics};delete b.active;
  }
 }
 if(a.kind==="secretCraft"){
  const recipe=SECRET_RECIPES.find(r=>r.id===a.recipe);if(!recipe||b.recipes.includes(recipe.id))throw Error("Cette recette est déjà découverte.");spendIngredients(b,recipe.cost);b.recipes.push(recipe.id);if(!b.equippedRecipe)b.equippedRecipe=recipe.id;
 }
 if(a.kind==="secretEquip"){if(a.recipe!==null&&!b.recipes.includes(a.recipe))throw Error("Découvre d’abord cette recette.");if(a.recipe===null)delete b.equippedRecipe;else b.equippedRecipe=a.recipe;}
 if(a.kind==="companionEvolve"){
  requireCompanion(p,a.companion);if(!companionCanEvolve(p,a.companion,a.stage))throw Error("Ce compagnon doit encore accomplir ses défis personnels.");b.companions[a.companion]={...companionRecord(p,a.companion),stage:a.stage};
 }
 if(a.kind==="companionEquip"){if(a.companion===null)delete b.equippedCompanion;else{requireCompanion(p,a.companion);b.equippedCompanion=a.companion;}}
 if(a.kind==="paradoxSwitch"){
  if(p.lifetime<1e123)throw Error("Le Royaume des paradoxes n’est pas encore ouvert.");
  if(now<(b.paradoxChangeAt??0)||a.mode===(b.paradoxMode??"light"))throw Error("L’inversion n’est pas encore prête.");b.paradoxMode=a.mode;b.paradoxChangeAt=now+60000;
 }
 if(a.kind==="banquetPrepare"){
  if(p.lifetime<1e141||a.course!==(b.banquetCourse??0)||!BANQUET_COURSES[a.course])throw Error("Ce service du banquet n’est pas disponible.");spendIngredients(b,BANQUET_COURSES[a.course].cost);b.banquetCourse=a.course+1;
 }
 b.revision++;
}
