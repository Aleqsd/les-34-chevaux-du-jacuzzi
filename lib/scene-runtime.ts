import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
export { THREE };
export function sceneRuntime(host:HTMLDivElement,onContextChange:(ready:boolean)=>void=()=>{}){
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x070d19,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;host.appendChild(renderer.domElement);renderer.domElement.setAttribute("aria-hidden","true");
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100),motion=matchMedia("(prefers-reduced-motion: reduce)");
  let disposed=false,contextLost=false,frame=0,visible=true,last=performance.now(),lastDraw=0;const began=last,cleanups:(()=>void)[]=[],textures=new Set<THREE.Texture>();
  const runtime={renderer,scene,camera,motion,update:(_time:number,_dt:number)=>{},onResize:(_w:number,_h:number)=>{},get disposed(){return disposed;},track:(t:THREE.Texture)=>{textures.add(t);return t;},release:(t:THREE.Texture|null|undefined)=>{if(t){textures.delete(t);t.dispose();}},addCleanup:(fn:()=>void)=>cleanups.push(fn),draw:()=>{cancelAnimationFrame(frame);lastDraw=0;render(performance.now());},dispose:()=>{
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);cleanups.forEach(fn=>fn());const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Sprite){if(o instanceof THREE.Mesh)geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>{Object.values(m).forEach(value=>{if(value instanceof THREE.Texture)textures.add(value);});m.dispose();});textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();
  }};
  try{const generator=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=generator.fromScene(room,.06);scene.environment=environment.texture;cleanups.push(()=>environment.dispose());room.dispose();generator.dispose();}catch{/* Direct lighting remains available on limited GPUs. */}
  function render(now:number){if(disposed||contextLost||!visible||document.hidden)return;if(now-lastDraw>=30||motion.matches){runtime.update((now-began)/1000,Math.min((now-last)/1000,.1));last=now;lastDraw=now;renderer.render(scene,camera);}if(!motion.matches)frame=requestAnimationFrame(render);}
  const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();runtime.onResize(w,h);runtime.draw();}});resize.observe(host);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)runtime.draw();else cancelAnimationFrame(frame);});intersection.observe(host);
  const lost=(event:Event)=>{event.preventDefault();contextLost=true;cancelAnimationFrame(frame);onContextChange(false);};
  const restored=()=>{contextLost=false;onContextChange(true);runtime.draw();};
  renderer.domElement.addEventListener("webglcontextlost",lost);renderer.domElement.addEventListener("webglcontextrestored",restored);
  cleanups.push(()=>renderer.domElement.removeEventListener("webglcontextlost",lost),()=>renderer.domElement.removeEventListener("webglcontextrestored",restored));
  const wake=()=>document.hidden?cancelAnimationFrame(frame):runtime.draw();document.addEventListener("visibilitychange",wake);motion.addEventListener("change",runtime.draw);
  cleanups.push(()=>resize.disconnect(),()=>intersection.disconnect(),()=>document.removeEventListener("visibilitychange",wake),()=>motion.removeEventListener("change",runtime.draw));return runtime;
}
export type SceneRuntime=ReturnType<typeof sceneRuntime>;
export function box(parent:THREE.Object3D,size:number[],at:number[],material:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size as [number,number,number]),material);mesh.position.set(...at as [number,number,number]);parent.add(mesh);return mesh;}
export function material(color:number,metalness=.15,roughness=.55){return new THREE.MeshStandardMaterial({color,metalness,roughness});}
export function screenTexture(runtime:SceneRuntime,title:string,subtitle:string){
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=512;const ctx=canvas.getContext("2d")!;const gradient=ctx.createLinearGradient(0,0,1024,512);gradient.addColorStop(0,"#233c84");gradient.addColorStop(1,"#070e23");ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);ctx.strokeStyle="#dfff00";ctx.lineWidth=3;ctx.strokeRect(35,35,954,442);ctx.textAlign="center";ctx.fillStyle="#dfff00";ctx.font="700 25px sans-serif";ctx.fillText("JACUZZI PICTURES",512,116);ctx.fillStyle="#fff";ctx.font="700 52px sans-serif";const words=title.split(" ");let line="",y=235;for(const word of words){if(ctx.measureText(line+word).width>870&&line){ctx.fillText(line.trim(),512,y);y+=65;line="";}line+=word+" ";}ctx.fillText(line.trim(),512,y);ctx.fillStyle="#b9c9f5";ctx.font="24px sans-serif";ctx.fillText(subtitle,512,423);const texture=runtime.track(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
