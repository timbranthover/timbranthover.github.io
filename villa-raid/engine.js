import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { buildWorld } from "./world.js";

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export async function createGame(canvas, cb={}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=false;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(58,4/3,.05,90); camera.rotation.order="YXZ"; scene.add(camera);
  const colliders=[],enemies=[];
  const world=await buildWorld(scene,camera,colliders,enemies);
  const {weapon,muzzle,spawn,sourceDataUrl}=world;
  const pos=spawn.clone();
  const raycaster=new THREE.Raycaster();
  const keys={};
  let yaw=0,pitch=0,jx=0,jy=0,firing=false,ammo=30,reserve=120,health=100,lastShot=0,running=false,reloading=false,verticalV=0,grounded=true,frame=0,audio=null;

  cb.onReady?.({sourceDataUrl});
  const hud=()=>cb.onHud?.({health:Math.round(health),ammo,reserve,remaining:enemies.filter(e=>e.alive).length});
  const resize=()=>{const r=canvas.getBoundingClientRect();const w=Math.max(2,Math.round(r.width)),h=Math.max(2,Math.round(r.height));camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
  resize(); addEventListener("resize",resize);

  const kd=e=>{keys[e.code]=true;if(e.code==="KeyR")reload();if(e.code==="Space")jump();};
  const ku=e=>{keys[e.code]=false;}; addEventListener("keydown",kd);addEventListener("keyup",ku);
  const md=e=>{if(!running)return;if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.();if(e.button===0)firing=true;};
  const mu=()=>{firing=false;};
  const mm=e=>{if(!running||document.pointerLockElement!==canvas)return;yaw-=e.movementX*.0021;pitch=clamp(pitch-e.movementY*.0019,-1.15,1.0);};
  canvas.addEventListener("mousedown",md);addEventListener("mouseup",mu);addEventListener("mousemove",mm);

  const collides=(x,z)=>{const r=.36;for(const b of colliders){if(x+r>b.min.x&&x-r<b.max.x&&z+r>b.min.z&&z-r<b.max.z)return true;}return false;};
  const opaqueWorld=[];scene.traverse(o=>{if(o.isMesh&&!o.userData.enemy&&!camera.children.includes(o))opaqueWorld.push(o);});
  const see=e=>{if(e.staticPhoto)return false;const a=e.root.position,b=pos;if(a.distanceTo(b)>18)return false;const origin=new THREE.Vector3(a.x,1.45,a.z);const dir=new THREE.Vector3().subVectors(b,origin);const dist=dir.length();dir.normalize();raycaster.set(origin,dir);const hits=raycaster.intersectObjects(opaqueWorld,false);return hits.length===0||hits[0].distance>dist;};
  const damage=n=>{if(!running||health<=0)return;health=Math.max(0,health-n);hud();cb.onDamage?.();if(health<=0){running=false;cb.onStatus?.("dead");}};

  const shotSound=()=>{if(!audio)return;const now=audio.currentTime;const buf=audio.createBuffer(1,Math.floor(audio.sampleRate*.075),audio.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const src=audio.createBufferSource();src.buffer=buf;const bp=audio.createBiquadFilter();bp.type="bandpass";bp.frequency.value=1050;bp.Q.value=.6;const g=audio.createGain();g.gain.setValueAtTime(.38,now);g.gain.exponentialRampToValueAtTime(.01,now+.075);src.connect(bp).connect(g).connect(audio.destination);src.start(now);};
  function reload(){if(reloading||ammo>=30||reserve<=0||!running)return;reloading=true;const start=performance.now(),base=weapon.position.clone();const timer=setInterval(()=>{const t=(performance.now()-start)/900;if(t>=1){clearInterval(timer);const take=Math.min(30-ammo,reserve);ammo+=take;reserve-=take;weapon.position.copy(base);reloading=false;hud();}else{weapon.position.y=base.y-Math.sin(t*Math.PI)*.25;weapon.rotation.z=-.02-Math.sin(t*Math.PI)*.35;}},16);}
  function jump(){if(grounded&&running){verticalV=4.0;grounded=false;}}

  const shoot=now=>{
    if(reloading||ammo<=0||now-lastShot<96)return;
    lastShot=now;ammo--;hud();shotSound();muzzle.intensity=7;setTimeout(()=>muzzle.intensity=0,34);weapon.position.z+=.04;weapon.rotation.x-=.04;pitch=clamp(pitch+.003+(Math.random()-.5)*.004,-1.15,1.0);yaw+=(Math.random()-.5)*.005;navigator.vibrate?.(7);
    raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
    const targets=[];for(const e of enemies)if(e.alive)targets.push(e.head,e.body);
    const hits=raycaster.intersectObjects(targets,false);
    if(hits.length){const mesh=hits[0].object,e=mesh.userData.enemy,part=mesh.userData.part;e.hp-=part==="head"?100:55;cb.onHit?.(part,e.name);if(e.hp<=0&&e.alive){e.alive=false;if(!e.staticPhoto){e.root.rotation.z=.2;e.root.position.y=-.72;}cb.onKill?.(`${part==="head"?"HEADSHOT":"KILL"} — ${e.name}`);hud();if(!enemies.some(x=>x.alive)){running=false;cb.onStatus?.("won");}}}
    if(ammo===0&&reserve>0)setTimeout(reload,160);
  };

  let last=performance.now();
  const loop=now=>{
    frame=requestAnimationFrame(loop);const dt=Math.min(.034,(now-last)/1000);last=now;
    if(running){
      const fk=(keys.KeyW?1:0)-(keys.KeyS?1:0)-jy,sk=(keys.KeyD?1:0)-(keys.KeyA?1:0)+jx,mag=Math.hypot(fk,sk),f=mag>1?fk/mag:fk,s=mag>1?sk/mag:sk,speed=keys.ShiftLeft?4.6:3.05;
      const sin=Math.sin(yaw),cos=Math.cos(yaw),dx=(s*cos-f*sin)*speed*dt,dz=(-f*cos-s*sin)*speed*dt,nx=pos.x+dx,nz=pos.z+dz;
      if(!collides(nx,pos.z))pos.x=nx;if(!collides(pos.x,nz))pos.z=nz;pos.x=clamp(pos.x,-14,14);pos.z=clamp(pos.z,-17,15);
      if(!grounded||verticalV!==0){verticalV-=10.5*dt;pos.y+=verticalV*dt;if(pos.y<=spawn.y){pos.y=spawn.y;verticalV=0;grounded=true;}}
      camera.position.copy(pos);camera.rotation.set(pitch,yaw,0);if(firing)shoot(now);
      weapon.position.x+=(.34-weapon.position.x)*Math.min(1,dt*13);weapon.position.y+=(-.29-weapon.position.y)*Math.min(1,dt*13);weapon.position.z+=(-.63-weapon.position.z)*Math.min(1,dt*16);weapon.rotation.x+=(-.03-weapon.rotation.x)*Math.min(1,dt*14);if(!reloading)weapon.rotation.z+=(-.02-weapon.rotation.z)*Math.min(1,dt*10);
      for(const e of enemies){if(!e.alive||e.staticPhoto)continue;const p=e.points[e.target];const d=new THREE.Vector3().subVectors(p,e.root.position);d.y=0;if(d.length()<.3)e.target=(e.target+1)%e.points.length;else{d.normalize();e.root.position.addScaledVector(d,e.speed*dt);e.root.rotation.y=Math.atan2(d.x,d.z);}const dist=e.root.position.distanceTo(pos);if(dist<17&&now>e.nextShot&&see(e)){e.nextShot=now+800+Math.random()*850;e.root.lookAt(pos.x,1.35,pos.z);if(Math.random()<clamp(.67-dist*.026,.16,.58))damage(5+Math.random()*7);}}
    }
    renderer.render(scene,camera);
  };
  frame=requestAnimationFrame(loop);hud();

  return {
    sourceDataUrl,
    start(){if(!audio)audio=new AudioContext();else if(audio.state==="suspended")audio.resume();running=true;weapon.visible=true;cb.onStatus?.("playing");},
    destroy(){cancelAnimationFrame(frame);removeEventListener("resize",resize);removeEventListener("keydown",kd);removeEventListener("keyup",ku);canvas.removeEventListener("mousedown",md);removeEventListener("mouseup",mu);removeEventListener("mousemove",mm);renderer.dispose();running=false;},
    setJoystick(x,y){jx=x;jy=y;},aimDelta(dx,dy){yaw-=dx*.0041;pitch=clamp(pitch-dy*.0035,-1.15,1.0);},setFiring(v){firing=v;},reload,jump
  };
}
