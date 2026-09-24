import { THREE,box,material,sceneRuntime,screenTexture,type SceneRuntime } from "@/lib/scene-runtime";
import { lookFor } from "@/lib/appearance";
import { avatarTexture } from "@/lib/avatar-texture";
import type { Profile } from "@/lib/club";
export type CinemaPresentation={title:string;subtitle:string;names:string[];profiles:Profile[]};
export function buildCinema(host:HTMLDivElement,onContextChange:(ready:boolean)=>void){
  const rt=sceneRuntime(host,onContextChange),{scene,camera}=rt;
  try{
    scene.add(new THREE.HemisphereLight(0x849dff,0x111323,3.8));const light=new THREE.DirectionalLight(0xd8e3ff,4);light.position.set(-2,9,9);scene.add(light);const projection=new THREE.PointLight(0x547dff,180,22);projection.position.set(0,3,-4);scene.add(projection);
    const navy=material(0x101b39,.3,.6),velvet=material(0x334b93,.15,.72),lime=material(0xdfff00,.3,.45),metal=material(0x536387,.7,.3),dark=material(0x070d20,.15,.6),group=new THREE.Group(),audience=new THREE.Group();scene.add(group,audience);
    box(group,[14,.35,13],[0,-.4,.4],navy);box(group,[14,6,.3],[0,2.45,-5.7],dark);for(const x of [-6.8,6.8]){box(group,[.3,4,12],[x,1.5,.2],navy);for(let z=-4;z<5;z+=1.4){box(group,[.12,2.8,.2],[x*.98,1.7,z],metal);box(group,[.08,.05,.6],[x*.94,.2,z],new THREE.MeshBasicMaterial({color:0x7f88ff}));}}
    box(group,[10,4.6,.3],[0,2.55,-5.4],metal);const screenMaterial=new THREE.MeshBasicMaterial({map:screenTexture(rt,"LA SALLE DU CREW","Choisissez une séance pour prendre place")});box(group,[9.6,4.2,.1],[0,2.55,-5.2],screenMaterial);
    const floorGlow=new THREE.MeshBasicMaterial({color:0x8e9dff});for(const x of [-5.8,5.8])box(group,[.055,.04,11],[x,-.18,.3],floorGlow);
    const seats=new THREE.Group();group.add(seats);const occupied:THREE.Object3D[]=[];let generation=0;const seatPositions:{x:number;y:number;z:number}[]=[];
    const disposeChildren=(g:THREE.Group)=>{for(const child of [...g.children]){child.traverse(o=>{if(o instanceof THREE.Sprite){rt.release(o.material.map);o.material.dispose();}else if(o instanceof THREE.Mesh){o.geometry.dispose();}});g.remove(child);}};
    function arrange(count:number){disposeChildren(seats);seatPositions.length=0;for(let i=0;i<Math.max(11,count);i++){const row=Math.floor(i/6),length=row===0?6:Math.min(6,Math.max(11,count)-row*6),column=i%6,x=(column-(length-1)/2)*1.65+(column>=length/2?.2:-.2),z=-1.4+row*2.6,y=row*.32;seatPositions.push({x,y,z});box(seats,[1.38,.32,1.28],[x,.38+y,z],velvet);box(seats,[1.38,1.2,.27],[x,.92+y,z+.52],velvet);for(const dx of [-.66,.66]){box(seats,[.2,.67,1.25],[x+dx,.62+y,z],navy);const cup=new THREE.Mesh(new THREE.CylinderGeometry(.1,.075,.25,10),lime);cup.position.set(x+dx,.99+y,z-.35);seats.add(cup);}box(seats,[.6,.35,.65],[x,.06+y,z],metal);} }
    arrange(11);camera.position.set(10.8,9.6,15.5);camera.lookAt(0,1.3,-1.3);
    async function update(data:CinemaPresentation){const token=++generation;rt.release(screenMaterial.map);screenMaterial.map=screenTexture(rt,data.title,data.subtitle);screenMaterial.needsUpdate=true;disposeChildren(audience);occupied.length=0;arrange(data.names.length);rt.draw();await Promise.all(data.names.map(async(name,i)=>{try{const texture=await avatarTexture(rt,name,data.profiles);if(!texture)return;if(rt.disposed||token!==generation){rt.release(texture);return;}const pos=seatPositions[i];if(!pos)return;const avatar=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:true}));avatar.position.set(pos.x,1.85+pos.y,pos.z);avatar.scale.set(1.4*300/168,1.4*300/168,1);avatar.userData.rest=avatar.position.y;avatar.userData.animated=!!lookFor(name,data.profiles).animated;audience.add(avatar);occupied.push(avatar);rt.draw();}catch{}}));}
    rt.update=(time)=>{occupied.forEach((avatar,i)=>avatar.position.y=avatar.userData.rest+(!rt.motion.matches&&avatar.userData.animated?Math.sin(time*1.3+i)*.045:0));};rt.draw();return {update,dispose:rt.dispose};
  }catch(error){rt.dispose();throw error;}
}
