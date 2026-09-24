import { THREE, type SceneRuntime } from "@/lib/scene-runtime";
import { avatarTexture } from "@/lib/avatar-texture";
import type { Profile } from "@/lib/club";
import type { PresenceMember } from "@/lib/presence";
type Actor={group:THREE.Group;head:THREE.Sprite;label:THREE.Sprite;member:PresenceMember;index:number;seed:number;version:number;signature:string;walking:boolean;via:boolean};
function nameTexture(rt:SceneRuntime,name:string){const canvas=document.createElement("canvas");canvas.width=512;canvas.height=96;const ctx=canvas.getContext("2d")!;ctx.fillStyle="#091427dd";ctx.beginPath();ctx.roundRect(3,3,506,90,35);ctx.fill();ctx.strokeStyle="#dfff0090";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="#f0f5ff";ctx.font="600 37px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(name+(name.trim().toLowerCase()==="alex"?" · DEV":""),256,49,475);return rt.track(new THREE.CanvasTexture(canvas));}
export function villaPresence(rt:SceneRuntime){
  const actors=new Map<string,Actor>();const crowd=new THREE.Group();rt.scene.add(crowd);
  const remove=(key:string)=>{const a=actors.get(key);if(!a)return;a.version++;crowd.remove(a.group);for(const sprite of [a.head,a.label]){rt.release(sprite.material.map);sprite.material.dispose();}actors.delete(key);};
  function update(members:PresenceMember[],profiles:Profile[]){
    const keys=new Set(members.map(p=>p.authorKey));for(const key of actors.keys())if(!keys.has(key))remove(key);
    for(const member of members){let actor=actors.get(member.authorKey);const index=members.filter(p=>p.room===member.room).findIndex(p=>p.authorKey===member.authorKey);
      if(!actor){const group=new THREE.Group(),head=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false})),label=new THREE.Sprite(new THREE.SpriteMaterial({map:nameTexture(rt,member.author),transparent:true,depthWrite:false}));head.visible=false;head.scale.set(2.6,2.6,1);label.scale.set(1.15,.22,1);label.position.y=.62;group.add(head,label);group.position.set(-.5,1.1,3.6);crowd.add(group);actor={group,head,label,member,index,seed:[...member.authorKey].reduce((n,c)=>n+c.charCodeAt(0),0),version:0,signature:"",walking:true,via:false};actors.set(member.authorKey,actor);}
      if(actor.member.room!==member.room)actor.via=true;actor.member=member;actor.index=index;
      const signature=JSON.stringify(profiles.find(p=>p.authorKey===member.authorKey)??member.author);if(signature!==actor.signature){actor.signature=signature;const target=actor,version=++actor.version;void avatarTexture(rt,member.author,profiles).then(texture=>{if(!texture)return;if(rt.disposed||target.version!==version){rt.release(texture);return;}rt.release(target.head.material.map);target.head.material.map=texture;target.head.visible=true;target.head.material.needsUpdate=true;rt.draw();}).catch(()=>{});}
    }rt.draw();
  }
  const goal=new THREE.Vector3();
  function tick(time:number,dt:number){for(const a of actors.values()){
    const {room,action}=a.member,i=a.index,phase=Date.now()/1000*.28+a.seed,walk=action==="walk";
    if(room==="cinema")goal.set(-5.52+(i%3)*1.51,1.27,Math.floor(i/3)*1.35-.1);
    else if(room==="terrace")goal.set(i%2?4.9:2.6,1.18,-4+Math.floor(i/2)*1.05);
    else if(room==="jacuzzi"){const angle=(i*.8)+a.seed;goal.set(4+Math.cos(angle)*1.48,1.1,2.4+Math.sin(angle)*1.48);}
    else if(action!=="walk")goal.set(-1+(i%3)*.7,1.05,2+Math.floor(i/3)*.6);
    else goal.set(-.4+Math.cos(phase)*.65,1.12,2.5+Math.sin(phase)*.8);
    if(walk&&room!=="jacuzzi"){goal.y=1.18;if(room==="cinema"){goal.x=-5+Math.cos(phase)*1.7;goal.z=3.25+Math.sin(phase)*.35;}if(room==="terrace"){goal.x=2.7+Math.cos(phase)*1.5;goal.z=-.55+Math.sin(phase)*.4;}}
    if(a.via){goal.set(-.3,1.18,2.7);if(a.group.position.distanceTo(goal)<.2)a.via=false;}
    const distance=a.group.position.distanceTo(goal);a.walking=distance>.08;
    if(rt.motion.matches){a.group.position.copy(goal);a.via=false;}else a.group.position.lerp(goal,Math.min(1,dt*(a.walking?2.2:5)));
    const beat=(Date.now()-a.member.changed)/1000;
    a.head.position.y=rt.motion.matches?0:action==="dance"?Math.abs(Math.sin(beat*5))*.22:Math.sin(time*(a.walking?9:2)+a.seed)*(a.walking?.055:.018);
    a.head.material.rotation=rt.motion.matches?0:action==="wave"?Math.sin(beat*7)*.23:action==="dance"?Math.sin(beat*5)*.15:Math.sin(time*(a.walking?7:1.3)+a.seed)*(a.walking?.055:.015);
    a.label.position.y=.62+a.head.position.y;
  }}
  return {update,tick};
}
