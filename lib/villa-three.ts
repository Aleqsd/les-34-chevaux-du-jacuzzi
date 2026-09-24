import { THREE,box,sceneRuntime } from "@/lib/scene-runtime";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { villaPresence } from "@/lib/villa-presence";
import { makeVillaMap,VILLA_ACTION_LABELS,type VillaAction,type VillaAmbience } from "@/lib/villa-map";
export type VillaZone="villa"|"cinema"|"terrace"|"jacuzzi";
export function buildVilla(host:HTMLDivElement,onZone:(zone:VillaZone)=>void,onContextChange:(ready:boolean)=>void,onAction:(action:VillaAction)=>void,onHover:(label:string)=>void){
 const rt=sceneRuntime(host,onContextChange),{camera,renderer}=rt;
 try{
  rt.scene.environmentIntensity=.35;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const map=makeVillaMap(rt),people=villaPresence(rt),controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;controls.enableDamping=false;controls.enableZoom=false;controls.minPolarAngle=.3;controls.maxPolarAngle=1.35;controls.minDistance=6;controls.maxDistance=65;
  let interactive=host.clientWidth>700;controls.enabled=interactive;renderer.domElement.style.touchAction=interactive?"none":"pan-y";
  const presets:Record<VillaZone,{position:number[];target:number[]}>= {villa:{position:[14,16,20],target:[0,.3,0]},cinema:{position:[-1,7,9],target:[-4,1,-1]},terrace:{position:[10,8,5],target:[3.6,1,-2.6]},jacuzzi:{position:[9.4,6.8,9.4],target:[4,.65,2.4]}};
  let zone:VillaZone="villa",progress=1,elapsed=0,clock=0,inFrame=false,manualView=false;const from=new THREE.Vector3(),fromTarget=new THREE.Vector3(),desired=new THREE.Vector3(),target=new THREE.Vector3();
  camera.position.fromArray(presets.villa.position);controls.target.fromArray(presets.villa.target);controls.update();
  const proxies:THREE.Mesh[]=[];for(const [z,size,pos] of [["cinema",[7.5,.1,7.7],[-4.2,.12,-.5]],["terrace",[6.8,.1,4.9],[3.9,.12,-2.45]],["jacuzzi",[4.7,.1,4.7],[4,.6,2.4]]] as [VillaZone,number[],number[]][]){const p=box(map.group,size,pos,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));p.userData.zone=z;proxies.push(p);}
  function setZone(next:VillaZone){manualView=false;zone=next;from.copy(camera.position);fromTarget.copy(controls.target);target.fromArray(presets[next].target);desired.fromArray(presets[next].position);const factor=Math.max(1,(next==="villa"?1.4:.85)/camera.aspect);desired.sub(target).multiplyScalar(factor).add(target);progress=0;elapsed=0;rt.draw();}
  const changed=()=>{if(!inFrame)rt.draw();},started=()=>{progress=1;manualView=true;};controls.addEventListener("change",changed);controls.addEventListener("start",started);
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down:{x:number;y:number;id:number;moved:boolean}|null=null,hover="";
  const label=(value:string)=>{if(hover!==value){hover=value;onHover(value);}};
  const hit=(event:PointerEvent)=>{const r=host.getBoundingClientRect();mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const object=ray.intersectObjects(map.picks,false)[0]?.object;let owner:THREE.Object3D|null=object??null;while(owner&&!owner.userData.action)owner=owner.parent;if(owner)return {action:owner.userData.action as VillaAction};const proxy=ray.intersectObjects(proxies,false)[0]?.object;return proxy?{zone:proxy.userData.zone as VillaZone}:null;};
  const pointerDown=(event:PointerEvent)=>{if(down){down.moved=true;return;}down={x:event.clientX,y:event.clientY,id:event.pointerId,moved:false};};
  const pointerMove=(event:PointerEvent)=>{if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>7)down.moved=true;const h=hit(event);host.style.cursor=down&&interactive?"grabbing":h?"pointer":interactive?"grab":"default";label(down?.moved?"":h?.action?VILLA_ACTION_LABELS[h.action]:h?.zone?"Visiter cet espace":"");};
  const pointerUp=(event:PointerEvent)=>{if(down&&down.id===event.pointerId&&!down.moved){const h=hit(event);if(h?.action)onAction(h.action);else if(h?.zone)onZone(h.zone);}down=null;};
  const cancel=()=>{down=null;label("");};host.addEventListener("pointerdown",pointerDown);host.addEventListener("pointermove",pointerMove);host.addEventListener("pointerup",pointerUp);host.addEventListener("pointercancel",cancel);host.addEventListener("pointerleave",cancel);
  rt.addCleanup(()=>{controls.removeEventListener("change",changed);controls.removeEventListener("start",started);controls.dispose();host.removeEventListener("pointerdown",pointerDown);host.removeEventListener("pointermove",pointerMove);host.removeEventListener("pointerup",pointerUp);host.removeEventListener("pointercancel",cancel);host.removeEventListener("pointerleave",cancel);});
  rt.onResize=()=>{if(!manualView)setZone(zone);};
  rt.update=(time,dt)=>{inFrame=true;clock=time;people.tick(time,dt);map.tick(time);if(progress<1){elapsed+=dt;progress=rt.motion.matches?1:Math.min(1,elapsed/.9);const e=progress*progress*(3-2*progress);camera.position.lerpVectors(from,desired,e);controls.target.lerpVectors(fromTarget,target,e);}controls.update();inFrame=false;};
  setZone("villa");
  return {setZone,updatePresence:people.update,setAmbience:map.setAmbience,jump:()=>map.jump(clock),setInteractive:(enabled:boolean)=>{interactive=enabled;controls.enabled=enabled;renderer.domElement.style.touchAction=enabled?"none":"pan-y";},zoom:(factor:number)=>{progress=1;manualView=true;const v=camera.position.clone().sub(controls.target);v.setLength(THREE.MathUtils.clamp(v.length()*factor,6,65));camera.position.copy(controls.target).add(v);controls.update();rt.draw();},dispose:rt.dispose};
 }catch(error){rt.dispose();throw error;}
}
