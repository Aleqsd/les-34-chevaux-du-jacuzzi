"use client";
import { useEffect, useRef, useState } from "react";

export function JacuzziScene(){
  const mount=useRef<HTMLDivElement>(null);const [ready,setReady]=useState(false);
  useEffect(()=>{
    const host=mount.current;if(!host)return;let disposed=false;let cleanup=()=>{};
    void (async()=>{
      try{
        const THREE=await import("three");const {GLTFLoader}=await import("three/addons/loaders/GLTFLoader.js");const {RoomEnvironment}=await import("three/addons/environments/RoomEnvironment.js");
        if(disposed)return;
        const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
        renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x050912,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
        host.appendChild(renderer.domElement);renderer.domElement.setAttribute("aria-hidden","true");
        const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(7,6.8,10);
        const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
        scene.add(new THREE.AmbientLight(0x9bb8ff,2));const key=new THREE.DirectionalLight(0xd6f1ff,6);key.position.set(3,8,5);scene.add(key);
        const rimLight=new THREE.PointLight(0x335cff,70,20);rimLight.position.set(-4,3,-2);scene.add(rimLight);const lime=new THREE.PointLight(0xdfff00,35,15);lime.position.set(4,2,3);scene.add(lime);
        const group=new THREE.Group();scene.add(group);
        const chrome=new THREE.MeshStandardMaterial({color:0x8ca5c2,metalness:1,roughness:.19});const dark=new THREE.MeshStandardMaterial({color:0x071f51,metalness:.65,roughness:.22});
        const basin=new THREE.Mesh(new THREE.CylinderGeometry(3.55,3.05,1.05,80,1,true),dark);basin.position.y=-.53;group.add(basin);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(3.5,.27,18,100),chrome);ring.rotation.x=Math.PI/2;group.add(ring);
        const underRing=new THREE.Mesh(new THREE.TorusGeometry(3.1,.05,8,100),new THREE.MeshBasicMaterial({color:0x4167ff}));underRing.rotation.x=Math.PI/2;underRing.position.y=-1;group.add(underRing);
        const uniforms={uTime:{value:0},uPointer:{value:new THREE.Vector2(20,20)},uRipple:{value:-20},uReduced:{value:0}};
        const water=new THREE.Mesh(new THREE.CircleGeometry(3.4,96),new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,transparent:true,vertexShader:`varying vec2 vUv; uniform float uTime; uniform float uReduced; void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*3.0+uTime)*cos(p.y*2.0+uTime*.8)*.055*(1.0-uReduced);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,fragmentShader:`varying vec2 vUv;uniform float uTime;uniform vec2 uPointer;uniform float uRipple;uniform float uReduced;void main(){vec2 uv=vUv;float t=uTime*(1.0-uReduced);float a=sin(uv.x*36.0+t*1.1+sin(uv.y*20.0-t));float b=cos(uv.y*31.0-t*.8+sin(uv.x*24.0+t*.6));float caustic=pow(abs(a*b),6.0);float d=distance(uv,uPointer);float age=uTime-uRipple;float ripple=sin(d*65.0-age*8.0)*exp(-abs(d-age*.11)*18.0)*exp(-age*.55)*step(0.0,age)*(1.0-uReduced);vec3 color=mix(vec3(.005,.12,.34),vec3(.05,.48,.9),uv.y);color+=caustic*vec3(.15,.6,.9)+ripple*.16;gl_FragColor=vec4(color,.97);}` }));water.rotation.x=-Math.PI/2;water.position.y=-.04;group.add(water);
        const floaty=new THREE.Group();group.add(floaty);const buoy=new THREE.Mesh(new THREE.TorusGeometry(.93,.24,20,70),new THREE.MeshStandardMaterial({color:0xdfff00,roughness:.27,metalness:.3}));buoy.rotation.x=Math.PI/2;buoy.scale.set(1.3,1,1);buoy.position.y=.12;floaty.add(buoy);
        let horse:InstanceType<typeof THREE.Group>|undefined;let mixer:InstanceType<typeof THREE.AnimationMixer>|undefined;
        new GLTFLoader().load("/horse.glb",gltf=>{
          if(disposed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});return;}
          horse=gltf.scene;const box=new THREE.Box3().setFromObject(horse);const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());const scale=3.5/Math.max(size.x,size.y,size.z);horse.scale.setScalar(scale);horse.position.set(-center.x*scale,-box.min.y*scale-1.18,-center.z*scale);horse.rotation.y=-.48;
          horse.traverse(o=>{if(o instanceof THREE.Mesh){const old=Array.isArray(o.material)?o.material:[o.material];o.material=chrome;old.forEach(m=>m.dispose());}});floaty.add(horse);
          const clip=gltf.animations.find(a=>a.name==="Idle_2")||gltf.animations.find(a=>/Idle/.test(a.name));if(clip){mixer=new THREE.AnimationMixer(horse);mixer.clipAction(clip).play();}draw();
        },undefined,()=>{});
        const bubbles=new THREE.Group();group.add(bubbles);const bubbleGeo=new THREE.SphereGeometry(.065,8,6);const bubbleMat=new THREE.MeshStandardMaterial({color:0xb9eaff,metalness:.7,roughness:.1,transparent:true,opacity:.6});
        for(let i=0;i<22;i++){const m=new THREE.Mesh(bubbleGeo,bubbleMat);const a=i*2.4;const r=1.5+(i%5)*.33;m.position.set(Math.cos(a)*r,-.05,Math.sin(a)*r);bubbles.add(m);}
        const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let px=0,py=0;const start=performance.now();let last=start;let frame=0;let visible=true;let dive=0;
        const motion=matchMedia("(prefers-reduced-motion: reduce)");const render=()=>{if(disposed)return;const now=performance.now(),t=(now-start)/1000,dt=Math.min((now-last)/1000,.05);last=now;uniforms.uTime.value=t;uniforms.uReduced.value=motion.matches?1:0;
          if(!motion.matches){floaty.position.y=Math.sin(t*1.1)*.07;floaty.rotation.z=Math.sin(t*.75)*.028;mixer?.update(dt);bubbles.children.forEach((o,i)=>{o.position.y=.015+Math.max(0,Math.sin(t*1.5+i))*.22;});}
          const target=new THREE.Vector3(7+px*.65,6.8+py*.4,10);if(dive>0)target.lerp(new THREE.Vector3(.2,2.1,3),Math.min(1,(now-dive)/500));camera.position.lerp(target,motion.matches?1:.055);camera.lookAt(0,.2,0);renderer.render(scene,camera);
          if(visible&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(render);
        };
        const draw=()=>{cancelAnimationFrame(frame);render();};
        const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();draw();}});resize.observe(host);
        const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)draw();else cancelAnimationFrame(frame);});observer.observe(host);
        const move=(e:PointerEvent)=>{if(motion.matches)return;const r=host.getBoundingClientRect();px=(e.clientX-r.left)/r.width*2-1;py=(e.clientY-r.top)/r.height*2-1;pointer.set(px,-py);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(water)[0];if(hit?.uv){uniforms.uPointer.value.copy(hit.uv);uniforms.uRipple.value=(performance.now()-start)/1000;}};
        const leave=()=>{px=0;py=0;};const zoom=()=>{if(!motion.matches)dive=performance.now();};const visibility=()=>{if(!document.hidden)draw();else cancelAnimationFrame(frame);};
        host.addEventListener("pointermove",move);host.addEventListener("pointerleave",leave);window.addEventListener("jacuzzi-dive",zoom);document.addEventListener("visibilitychange",visibility);motion.addEventListener("change",draw);setReady(true);draw();
        cleanup=()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();host.removeEventListener("pointermove",move);host.removeEventListener("pointerleave",leave);window.removeEventListener("jacuzzi-dive",zoom);document.removeEventListener("visibilitychange",visibility);motion.removeEventListener("change",draw);mixer?.stopAllAction();const geometries=new Set<InstanceType<typeof THREE.BufferGeometry>>(),materials=new Set<InstanceType<typeof THREE.Material>>();scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove();};
      }catch{setReady(false);}
    })();return()=>{disposed=true;cleanup();};
  },[]);
  return <div className={`jacuzzi-stage ${ready?"is-ready":""}`} role="img" aria-label="Un cheval chromé flotte dans un jacuzzi 3D. L’eau réagit au pointeur."><img className="jacuzzi-fallback" src="/jacuzzi.webp" alt=""/><div ref={mount} className="jacuzzi-canvas"/><span className="scene-caption">{ready?"EAU INTERACTIVE · CHEVAL EN APESANTEUR":"LE JACUZZI DU CREW"}</span></div>;
}
