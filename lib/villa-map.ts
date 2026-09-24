import { THREE, box, material, screenTexture, type SceneRuntime } from "@/lib/scene-runtime";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
export type VillaAction="cinema"|"programme"|"wardrobe"|"jets"|"party"|"lights"|"horse";
export type VillaAmbience={jets:boolean;party:boolean;day:boolean};
export const VILLA_ACTION_LABELS:Record<VillaAction,string>={cinema:"Choisir un film",programme:"Préparer une sortie",wardrobe:"Ouvrir le vestiaire",jets:"Activer / arrêter les jets",party:"Lancer / arrêter la fête",lights:"Changer la lumière",horse:"Faire bondir le cheval"};
export function makeVillaMap(rt:SceneRuntime){
  const group=new THREE.Group();rt.scene.add(group);
  const stone=material(0x64748a,.05,.9),ivory=material(0xb7c3c6,.05,.75),navy=material(0x102443,.25,.55),wood=material(0x80604a,.08,.8),grass=material(0x264b43,0,1),leaf=material(0x34705e,0,.95),trunk=material(0x5e4940,0,1),chrome=material(0xbccbdc,.92,.17),lime=material(0xdfff00,.2,.3),velvet=material(0x446990,0,.9);
  const glow=new THREE.MeshBasicMaterial({color:0xffcf86}),cyan=new THREE.MeshBasicMaterial({color:0x54eaff}),picks:THREE.Object3D[]=[];
  const pick=(object:THREE.Object3D,action:VillaAction)=>{object.userData.action=action;object.traverse(o=>{if(o instanceof THREE.Mesh)picks.push(o);});return object;};
  const sphereGeometry=new THREE.IcosahedronGeometry(1,1),cylinderGeometry=new THREE.CylinderGeometry(1,1,1,12);
  const sphere=(at:number[],size:number[],m:THREE.Material,parent:THREE.Object3D=group)=>{const mesh=new THREE.Mesh(sphereGeometry,m);mesh.position.fromArray(at);mesh.scale.fromArray(size);parent.add(mesh);return mesh;};
  const cylinder=(at:number[],size:number[],m:THREE.Material,parent:THREE.Object3D=group)=>{const mesh=new THREE.Mesh(cylinderGeometry,m);mesh.position.fromArray(at);mesh.scale.fromArray(size);parent.add(mesh);return mesh;};
  // A bevelled, planted island with a deliberately open front.
  const shape=new THREE.Shape();shape.moveTo(-8,-6);shape.lineTo(8,-6);shape.quadraticCurveTo(10,-6,10,-4);shape.lineTo(10,4);shape.quadraticCurveTo(10,6,8,6);shape.lineTo(-8,6);shape.quadraticCurveTo(-10,6,-10,4);shape.lineTo(-10,-4);shape.quadraticCurveTo(-10,-6,-8,-6);
  const ground=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelSize:.35,bevelThickness:.25,bevelSegments:2,steps:1}),grass);ground.rotation.x=-Math.PI/2;ground.position.y=-.82;group.add(ground);
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2;const rock=sphere([Math.cos(a)*9.1,-1.1-(i%3)*.12,Math.sin(a)*5.2],[1.2,.8+(i%4)*.12,.9],stone);rock.rotation.set(i*.4,i*.7,i*.2);}
  const trim=new THREE.Mesh(new THREE.TorusGeometry(1,.018,5,100),cyan);trim.rotation.x=Math.PI/2;trim.scale.set(9.65,5.72,1);trim.position.y=-.66;group.add(trim);
  // Stepping stones and a luminous path across the garden.
  for(let i=0;i<9;i++){const tile=cylinder([-.4+Math.sin(i*.9)*.18,.045,4.6-i*1.1],[.38,.1,.42],ivory);tile.rotation.y=i*.5;}
  for(const [x,z] of [[-8.6,4.3],[-8.7,-4.6],[-.6,-5.2],[8.7,-4.5],[8.6,4.4],[-1.2,3.8],[1.2,-.7]]){box(group,[.19,.55,.19],[x,.29,z],navy);sphere([x,.65,z],[.16,.2,.16],glow);}
  // Cinema: tiered cutaway room, acoustic slats and a practical screen.
  box(group,[7.6,.24,7.7],[-4.2,-.03,-.5],ivory);box(group,[7.6,3.3,.22],[-4.2,1.5,-4.35],ivory);box(group,[.22,2.7,6.5],[-8,1.2,-.6],ivory);
  for(let i=0;i<12;i++)box(group,[.12,2.3,.13],[-7.82,1.5,-3.7+i*.47],wood);
  box(group,[7.8,.16,.4],[-4.2,3.21,-4.25],navy);box(group,[6.7,.045,.05],[-4.2,.18,-4.1],cyan);
  const screen=box(group,[5.65,2.2,.18],[-4,1.87,-4.15],new THREE.MeshBasicMaterial({map:screenTexture(rt,"LE SALON DU CREW","Touche l’écran pour choisir un film")}));pick(screen,"cinema");
  for(const z of [0,2.1]){box(group,[4.7,.45,1.4],[-4,.37,z],navy);box(group,[4.7,.85,.28],[-4,.77,z+.6],velvet);for(let i=0;i<3;i++)box(group,[1.43,.24,1.07],[-5.52+i*1.51,.67,z-.1],velvet);for(const x of [-6.5,-1.5])box(group,[.28,.78,1.5],[x,.65,z],navy);}
  const cinemaRug=box(group,[4.7,.03,1],[-4,.13,-1.8],material(0x344660));for(const x of [-5,-3]){cylinder([x,.27,-1.8],[.45,.3,.45],wood);cylinder([x,.45,-1.8],[.1,.19,.1],lime);}
  for(let i=0;i<3;i++)box(group,[2.6,.12,1.1],[-4,.04-i*.08,3.4+i*.38],stone);
  // Terrace: planks, dining table, dinnerware and an open pergola.
  for(let i=0;i<19;i++)box(group,[.36,.16,4.9],[.65+i*.38,.02,-2.45],wood);
  const table=new THREE.Group();group.add(table);box(table,[3.5,.18,1.6],[3.8,1.02,-2.7],wood);for(const x of [2.4,5.2])for(const z of [-3.25,-2.2])box(table,[.12,1,.12],[x,.48,z],navy);
  for(const x of [2.6,4.9])for(const z of [-4,-1.4]){box(group,[.8,.18,.8],[x,.55,z],velvet);box(group,[.8,.78,.13],[x,.95,z+(z<-2?-.35:.35)],wood);for(const dx of [-.3,.3])for(const dz of [-.3,.3])box(group,[.07,.65,.07],[x+dx,.2,z+dz],navy);}
  for(const x of [2.8,4.7])for(const z of [-3.05,-2.35]){cylinder([x,1.15,z],[.27,.045,.27],ivory,table);cylinder([x+.38,1.28,z],[.08,.25,.08],chrome,table);}pick(table,"programme");
  for(const x of [.6,7.2])for(const z of [-4.75,-.2])box(group,[.2,3.5,.2],[x,1.68,z],wood);
  for(const z of [-4.75,-.2])box(group,[7,.22,.22],[3.9,3.36,z],wood);
  for(let i=0;i<10;i++)box(group,[.18,.15,4.8],[.7+i*.71,3.5,-2.45],wood);
  const garland=new THREE.Group();group.add(garland);for(let i=0;i<13;i++){const x=.8+i*.52,y=3.25-Math.sin(i/12*Math.PI)*.4;sphere([x,y,-.14],[.07,.09,.07],glow,garland);}pick(garland,"lights");
  // Compact barbecue and an interactive DJ booth.
  box(group,[1.7,.9,.9],[8,.44,-2.8],stone);const grill=cylinder([8,1,-2.8],[.73,.08,.38],chrome);for(let i=0;i<8;i++)box(group,[.04,.02,.65],[7.45+i*.15,1.06,-2.8],navy);
  const booth=new THREE.Group();group.add(booth);box(booth,[1.35,.85,.8],[.45,.48,-4.65],navy);box(booth,[1.48,.12,.9],[.45,.95,-4.65],chrome);for(const x of [.08,.8])cylinder([x,1.04,-4.65],[.25,.055,.25],navy,booth);pick(booth,"party");
  const disco=sphere([.45,2.5,-4.65],[.3,.3,.3],chrome);pick(disco,"party");
  // Jacuzzi, water rings, physical bubbles and the crew's chrome mascot.
  const pool=new THREE.Group();pool.position.set(4,.05,2.4);group.add(pool);
  const basin=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.42,.85,48),navy);basin.position.y=.1;pool.add(basin);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(2.35,.18,10,64),ivory);rim.rotation.x=Math.PI/2;rim.position.y=.55;pool.add(rim);
  const waterMaterial=new THREE.MeshStandardMaterial({color:0x16aec9,emissive:0x075266,emissiveIntensity:.7,metalness:.3,roughness:.2,transparent:true,opacity:.93});
  const water=new THREE.Mesh(new THREE.CircleGeometry(2.22,64),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=.53;pool.add(water);pick(water,"jets");pick(rim,"jets");
  const ripples:THREE.Mesh[]=[];for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(.4+i*.41,.018,5,48),new THREE.MeshBasicMaterial({color:0x8bf5ff,transparent:true,opacity:.27}));r.rotation.x=Math.PI/2;r.position.y=.56;pool.add(r);ripples.push(r);}
  const bubbles=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,6,5),cyan,50);bubbles.frustumCulled=false;pool.add(bubbles);const dummy=new THREE.Object3D();
  const floaty=new THREE.Group();floaty.position.y=.64;pool.add(floaty);const ring=new THREE.Mesh(new THREE.TorusGeometry(.81,.21,10,40),lime);ring.rotation.x=Math.PI/2;floaty.add(ring);pick(ring,"horse");
  new GLTFLoader().load("/horse.glb",gltf=>{if(rt.disposed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});return;}const horse=gltf.scene,bb=new THREE.Box3().setFromObject(horse),size=bb.getSize(new THREE.Vector3()),center=bb.getCenter(new THREE.Vector3()),scale=2.9/Math.max(size.x,size.y,size.z);horse.scale.setScalar(scale);horse.position.set(-center.x*scale,-bb.min.y*scale-.9,-center.z*scale);horse.rotation.y=-.8;horse.traverse(o=>{if(o instanceof THREE.Mesh){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());o.material=chrome;}});floaty.add(horse);pick(horse,"horse");rt.draw();},undefined,()=>{});
  const wardrobe=new THREE.Group();group.add(wardrobe);box(wardrobe,[1.2,1.8,.55],[7.25,.9,1.1],wood);for(const x of [7,7.5])box(wardrobe,[.4,1.1,.08],[x,.85,1.42],x===7?lime:velvet);pick(wardrobe,"wardrobe");
  for(let i=0;i<3;i++)box(group,[1.8,.12,.7],[4,.04-i*.08,4.7+i*.28],wood);
  // Shared tree geometry keeps the richly planted border inexpensive.
  for(const [x,z,s] of [[-8.9,-4.8,1.2],[-8.9,2.9,.9],[-7.2,4.8,.7],[8.7,-4.4,1.1],[8.8,3.9,1],[.1,-5.3,.9],[6.3,-5.3,.7]]){
    cylinder([x,.8*s,z],[.16,1.6*s,.16],trunk);for(let i=0;i<4;i++)sphere([x+Math.cos(i*2.4)*.35*s,1.7*s+(i%2)*.35,z+Math.sin(i*2.4)*.35*s],[.75*s,.7*s,.75*s],leaf);
  }
  for(let i=0;i<28;i++){const a=i/28*Math.PI*2;sphere([Math.cos(a)*9.3,.13,Math.sin(a)*5.35],[.3+(i%3)*.07,.26,.32],leaf);}
  // A decorative waterfall flows over the side of the floating island.
  const falls:THREE.Mesh[]=[];for(let i=0;i<7;i++){const f=box(group,[.11,1.6,.08],[7.7+i*.17,-.7,5.25],new THREE.MeshBasicMaterial({color:0x3fcde6,transparent:true,opacity:.45}));falls.push(f);}
  const hemisphere=new THREE.HemisphereLight(0x91bbdc,0x102638,1.5),sun=new THREE.DirectionalLight(0xffe6c2,2.4),blue=new THREE.PointLight(0x22bfdc,40,11),warm=new THREE.PointLight(0xffba68,48,12);sun.position.set(-6,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:.1,far:40});sun.shadow.bias=-.001;sun.shadow.normalBias=.04;blue.position.set(4,2,2.4);warm.position.set(4,3,-2.6);rt.scene.add(hemisphere,sun,blue,warm);
  const partyLight=new THREE.PointLight(0xcb57ff,0,16);partyLight.position.set(.4,3.5,-1);rt.scene.add(partyLight);
  let ambience:VillaAmbience={jets:true,party:false,day:false},jump=-99;
  function setAmbience(value:VillaAmbience){ambience=value;hemisphere.intensity=value.day?1.7:1.05;sun.intensity=value.day?2.4:1.65;sun.color.setHex(value.day?0xffffff:0xffe6c2);warm.intensity=value.day?18:48;blue.intensity=value.day?18:40;glow.color.setHex(value.day?0xffe9b5:0xffcf86);bubbles.visible=value.jets;partyLight.intensity=value.party?65:0;rt.draw();}
  function tick(time:number){const motion=!rt.motion.matches;if(motion){floaty.position.y=.64+Math.sin(time*1.1)*.05+Math.max(0,1-(time-jump)/1.2)*Math.abs(Math.sin((time-jump)*Math.PI/1.2))*1.5;floaty.rotation.z=Math.sin(time*.8)*.025;ripples.forEach((r,i)=>{r.scale.setScalar(1+Math.sin(time*(ambience.jets?2:1)+i)*.04);});disco.rotation.y=time*(ambience.party?1.4:.1);falls.forEach((f,i)=>{f.scale.y=.85+Math.sin(time*4+i)*.15;});}else{floaty.position.y=.64;floaty.rotation.z=0;}
    if(ambience.jets){for(let i=0;i<50;i++){const a=i*2.399,r=1.2+(i%9)*.095,phase=motion?(time*.55+i*.137)%1:(i%7)/7;dummy.position.set(Math.cos(a)*r,.55+Math.sin(phase*Math.PI)*.38,Math.sin(a)*r);dummy.scale.setScalar(.4+(1-phase)*.7);dummy.updateMatrix();bubbles.setMatrixAt(i,dummy.matrix);}bubbles.instanceMatrix.needsUpdate=true;}
    if(ambience.party&&motion){partyLight.color.setHSL((time*.1)%1,.85,.55);partyLight.intensity=55+Math.sin(time*3)*12;}
  }
  group.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshStandardMaterial&&!o.material.transparent){o.castShadow=true;o.receiveShadow=true;}});ground.castShadow=false;
  setAmbience(ambience);
  return {group,picks,tick,setAmbience,jump:(time:number)=>{jump=time;rt.draw();}};
}
