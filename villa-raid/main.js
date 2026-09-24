import { createGame } from "./engine.js";

const canvas = document.getElementById("game");
const hp = document.getElementById("hp");
const ammo = document.getElementById("ammo");
const reserve = document.getElementById("reserve");
const remaining = document.getElementById("remaining");
const damage = document.getElementById("damage");
const killfeed = document.getElementById("killfeed");
const start = document.getElementById("start");
const end = document.getElementById("end");
const endTitle = document.getElementById("endTitle");
const endCopy = document.getElementById("endCopy");
const controls = document.getElementById("controls");
const joyBase = document.getElementById("joy");
const joyKnob = joyBase.querySelector(".joyKnob");
const aimPad = document.getElementById("aimPad");
const fire = document.getElementById("fire");
const reload = document.getElementById("reload");
const jump = document.getElementById("jump");

const api = createGame(canvas, {
  onHud(v){ hp.textContent=Math.round(v.health); ammo.textContent=v.ammo; reserve.textContent=v.reserve; remaining.textContent=v.remaining; },
  onDamage(){ damage.classList.add("on"); setTimeout(()=>damage.classList.remove("on"),90); },
  onKill(label){ const row=document.createElement("div"); row.className="kill"; row.textContent=label; killfeed.prepend(row); while(killfeed.children.length>3)killfeed.lastElementChild.remove(); },
  onStatus(status){ if(status==="playing")return; controls.style.display="none"; end.style.display="grid"; endTitle.textContent=status==="won"?"PROPERTY CLEARED":"MISSION FAILED"; endCopy.textContent=status==="won"?"All hostiles are down. The whole compound remains open to explore.":"You were taken out before the compound was cleared."; }
});

document.getElementById("deploy").addEventListener("click",()=>{ start.style.display="none"; controls.style.display="block"; api.start(); });
document.getElementById("restart").addEventListener("click",()=>location.reload());

let moveId=null;
function joyMove(e){ if(moveId===null)moveId=e.pointerId; if(moveId!==e.pointerId)return; joyBase.setPointerCapture?.(e.pointerId); const r=joyBase.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,max=r.width*.33,len=Math.max(1,Math.hypot(x,y)),scale=Math.min(1,max/len); api.setJoystick(Math.max(-1,Math.min(1,x*scale/max)),Math.max(-1,Math.min(1,y*scale/max))); joyKnob.style.transform=`translate(${x*scale}px,${y*scale}px)`; }
function joyEnd(e){ if(moveId!==e.pointerId)return; moveId=null; api.setJoystick(0,0); joyKnob.style.transform="translate(0px,0px)"; }
joyBase.addEventListener("pointerdown",joyMove); joyBase.addEventListener("pointermove",joyMove); joyBase.addEventListener("pointerup",joyEnd); joyBase.addEventListener("pointercancel",joyEnd);

let aimId=null,ax=0,ay=0;
aimPad.addEventListener("pointerdown",e=>{aimId=e.pointerId;ax=e.clientX;ay=e.clientY;aimPad.setPointerCapture?.(e.pointerId);});
aimPad.addEventListener("pointermove",e=>{if(aimId!==e.pointerId)return;api.aimDelta(e.clientX-ax,e.clientY-ay);ax=e.clientX;ay=e.clientY;});
function aimEnd(e){if(aimId===e.pointerId)aimId=null;} aimPad.addEventListener("pointerup",aimEnd);aimPad.addEventListener("pointercancel",aimEnd);

function fireOn(e){e.preventDefault();e.stopPropagation();api.setFiring(true);fire.setPointerCapture?.(e.pointerId);} function fireOff(e){e.preventDefault();e.stopPropagation();api.setFiring(false);} fire.addEventListener("pointerdown",fireOn);fire.addEventListener("pointerup",fireOff);fire.addEventListener("pointercancel",fireOff);
reload.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();api.reload();}); jump.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();api.jump();});

window.addEventListener("pagehide",()=>api.destroy(),{once:true});
