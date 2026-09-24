import { createGame } from "./engine.js";

const $=id=>document.getElementById(id);
const canvas=$("game"),hp=$("hp"),ammo=$("ammo"),reserve=$("reserve"),remaining=$("remaining"),damage=$("damage"),hitmark=$("hitmark"),killfeed=$("killfeed"),start=$("start"),end=$("end"),endTitle=$("endTitle"),endCopy=$("endCopy"),controls=$("controls"),joyBase=$("joy"),joyKnob=joyBase.querySelector(".joyKnob"),aimPad=$("aimPad"),fire=$("fire"),reload=$("reload"),jump=$("jump"),deploy=$("deploy"),sourceOverlay=$("sourceOverlay");

let api;
try{
  api=await createGame(canvas,{
    onReady(){},
    onHud(v){hp.textContent=Math.round(v.health);ammo.textContent=v.ammo;reserve.textContent=v.reserve;remaining.textContent=v.remaining;},
    onDamage(){damage.classList.add("on");setTimeout(()=>damage.classList.remove("on"),90);},
    onHit(){hitmark.classList.add("on");setTimeout(()=>hitmark.classList.remove("on"),85);},
    onKill(label){const row=document.createElement("div");row.className="kill";row.textContent=label;killfeed.prepend(row);while(killfeed.children.length>3)killfeed.lastElementChild.remove();},
    onStatus(status){if(status==="playing")return;controls.style.display="none";end.style.display="grid";endTitle.textContent=status==="won"?"PROPERTY CLEARED":"MISSION FAILED";endCopy.textContent=status==="won"?"All six targets are down. Restart to run the photo map again.":"You were taken out inside the compound.";}
  });
  sourceOverlay.src=api.sourceDataUrl;
  deploy.disabled=false;deploy.textContent="TAP TO DEPLOY";
}catch(err){console.error(err);deploy.textContent="MAP LOAD FAILED";document.querySelector(".startCard p").textContent="The photo-map assets failed to load. Refresh once and try again.";}

deploy.addEventListener("click",()=>{
  if(!api)return;
  start.style.display="none";controls.style.display="block";api.start();
  requestAnimationFrame(()=>requestAnimationFrame(()=>sourceOverlay.classList.add("away")));
});
$("restart").addEventListener("click",()=>location.reload());

let moveId=null;
function joyMove(e){if(moveId===null)moveId=e.pointerId;if(moveId!==e.pointerId)return;joyBase.setPointerCapture?.(e.pointerId);const r=joyBase.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,max=r.width*.33,len=Math.max(1,Math.hypot(x,y)),scale=Math.min(1,max/len);api?.setJoystick(Math.max(-1,Math.min(1,x*scale/max)),Math.max(-1,Math.min(1,y*scale/max)));joyKnob.style.transform=`translate(${x*scale}px,${y*scale}px)`;}
function joyEnd(e){if(moveId!==e.pointerId)return;moveId=null;api?.setJoystick(0,0);joyKnob.style.transform="translate(0px,0px)";}
joyBase.addEventListener("pointerdown",joyMove);joyBase.addEventListener("pointermove",joyMove);joyBase.addEventListener("pointerup",joyEnd);joyBase.addEventListener("pointercancel",joyEnd);

let aimId=null,ax=0,ay=0;
aimPad.addEventListener("pointerdown",e=>{aimId=e.pointerId;ax=e.clientX;ay=e.clientY;aimPad.setPointerCapture?.(e.pointerId);});
aimPad.addEventListener("pointermove",e=>{if(aimId!==e.pointerId)return;api?.aimDelta(e.clientX-ax,e.clientY-ay);ax=e.clientX;ay=e.clientY;});
function aimEnd(e){if(aimId===e.pointerId)aimId=null;}aimPad.addEventListener("pointerup",aimEnd);aimPad.addEventListener("pointercancel",aimEnd);

function fireOn(e){e.preventDefault();e.stopPropagation();api?.setFiring(true);fire.setPointerCapture?.(e.pointerId);}function fireOff(e){e.preventDefault();e.stopPropagation();api?.setFiring(false);}fire.addEventListener("pointerdown",fireOn);fire.addEventListener("pointerup",fireOff);fire.addEventListener("pointercancel",fireOff);
reload.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();api?.reload();});jump.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();api?.jump();});
window.addEventListener("pagehide",()=>api?.destroy(),{once:true});
