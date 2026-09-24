import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
function tex(colors, size = 128, blocks = 700) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < blocks; i++) {
        ctx.globalAlpha = 0.04 + Math.random() * 0.12;
        ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
        const s = 1 + Math.random() * 7;
        ctx.fillRect(Math.random() * size, Math.random() * size, s, s);
    }
    ctx.globalAlpha = 1;
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
}
export function buildWorld(scene, camera, colliders, enemies) {
    scene.background = new THREE.Color(0x86999b);
    scene.fog = new THREE.Fog(0x86999b, 28, 75);
    const stuccoTex = tex(["#cbc7b6", "#d9d5c7", "#bdb8a7"], 128, 900); stuccoTex.repeat.set(3, 2);
    const stoneTex = tex(["#776b59", "#8b7b65", "#675e50", "#9b8b73"], 128, 350); stoneTex.repeat.set(5, 2);
    const dirtTex = tex(["#8a765e", "#a08a6e", "#756651", "#b19b7f"], 128, 1200); dirtTex.repeat.set(22, 18);
    const tileTex = tex(["#8f4d39", "#aa6049", "#734335", "#bd6c50"], 128, 450); tileTex.repeat.set(6, 3);
    const woodTex = tex(["#6b4a31", "#7c5638", "#513622"], 128, 600); woodTex.repeat.set(3, 3);
    const mats = {stucco:new THREE.MeshLambertMaterial({map:stuccoTex}),stone:new THREE.MeshLambertMaterial({map:stoneTex}),dirt:new THREE.MeshLambertMaterial({map:dirtTex}),tile:new THREE.MeshLambertMaterial({map:tileTex}),wood:new THREE.MeshLambertMaterial({map:woodTex}),darkWood:new THREE.MeshLambertMaterial({color:0x463427}),interior:new THREE.MeshLambertMaterial({color:0xb9b2a1}),floor:new THREE.MeshLambertMaterial({color:0x9b8064})};
    scene.add(new THREE.HemisphereLight(0xb9c8c7, 0x5b5547, 1.15));
    const sun = new THREE.DirectionalLight(0xfff4db, 1.25); sun.position.set(-18,32,24); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-35; sun.shadow.camera.right=35; sun.shadow.camera.top=35; sun.shadow.camera.bottom=-35; sun.shadow.camera.near=1; sun.shadow.camera.far=90; scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90,90),mats.dirt); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
    const addBox=(x,y,z,sx,sy,sz,material,collidable=true,cast=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;scene.add(m);if(collidable)colliders.push(new THREE.Box3().setFromObject(m));return m;};
    const wallX=(x,z,len,h=3.2,mat=mats.stucco)=>addBox(x,h/2,z,len,h,.32,mat); const wallZ=(x,z,len,h=3.2,mat=mats.stucco)=>addBox(x,h/2,z,.32,h,len,mat);
    addBox(-8.5,.05,-6.5,14.5,.1,11,mats.floor,false,false); wallX(-8.5,-12,14.5,4.2); wallZ(-15.75,-6.5,11,4.2); wallZ(-1.25,-6.5,11,4.2); wallX(-13.1,-1,5.2,4.2); wallX(-5.1,-1,3.6,4.2); wallX(-2.1,-1,1.4,4.2); wallZ(-10.5,-6.4,10.4,3,mats.interior); wallZ(-5.5,-8.6,6.4,3,mats.interior); wallX(-8,-5.4,5,3,mats.interior); wallX(-5,-9,1.2,3,mats.interior); wallX(-3,-9,3.6,3,mats.interior); addBox(-8.5,4.35,-6.5,15,.3,11.5,mats.tile,false); addBox(-8.5,4.52,-6.5,10,.2,7.5,mats.tile,false);
    addBox(5,.05,-7,8.5,.1,8,mats.floor,false,false); wallX(5,-11,8.5,3.8); wallZ(.75,-7,8,3.8); wallZ(9.25,-7,8,3.8); wallX(2,-3,2.5,3.8); wallX(7.7,-3,3,3.8); wallZ(5,-7,7.2,3,mats.interior); addBox(5,3.95,-7,9,.26,8.5,mats.tile,false);
    addBox(15.5,1.5,-2,2.4,3,28,mats.stone); addBox(12,.75,-4,4.5,1.5,20,mats.stone); addBox(12.3,1.58,-4,3.8,.16,19,mats.dirt,false,false); addBox(0,1,-15.6,32,2,1.2,mats.stone); addBox(-18,1,0,1.2,2,32,mats.stone);
    addBox(-3,.03,8.2,18,.06,10.5,new THREE.MeshLambertMaterial({color:0xb7ab91}),false,false); const pool=new THREE.Mesh(new THREE.BoxGeometry(9.4,.16,4.6),new THREE.MeshPhongMaterial({color:0x4f9fa0,transparent:true,opacity:.78,shininess:70})); pool.position.set(-4.2,.03,8.3); pool.receiveShadow=true; scene.add(pool); addBox(-9.2,.28,8.3,.28,.5,4.7,mats.stone); addBox(.8,.28,8.3,.28,.5,4.7,mats.stone); addBox(-4.2,.28,6,10.3,.5,.28,mats.stone); addBox(-4.2,.28,10.6,10.3,.5,.28,mats.stone);
    addBox(4.4,.78,6.8,2.4,.12,1.2,mats.wood); for(const [x,z] of [[3.2,6.8],[5.6,6.8],[4.4,5.9],[4.4,7.7]])addBox(x,.45,z,.55,.9,.55,mats.darkWood); addBox(-12.7,.35,3,3,.7,.9,mats.wood); addBox(-12.7,1,3.35,3,1.2,.22,mats.wood); addBox(8.8,.4,5,1.4,.8,.8,mats.stone); addBox(8.8,.92,5,1,.28,.6,new THREE.MeshLambertMaterial({color:0x314b2a}),false);
    const palm=new THREE.Group(),trunkMat=new THREE.MeshLambertMaterial({color:0x76553d}); for(let i=0;i<7;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(.28-i*.015,.34-i*.012,1.2,7),trunkMat);s.position.y=.55+i;s.rotation.z=-.018*i;s.castShadow=true;palm.add(s);} const frondMat=new THREE.MeshLambertMaterial({color:0x2f5d35,side:THREE.DoubleSide}); for(let i=0;i<11;i++){const f=new THREE.Mesh(new THREE.PlaneGeometry(.7,5.5,1,4),frondMat);f.position.y=7.35;f.rotation.x=-Math.PI/2.7;f.rotation.z=i/11*Math.PI*2;f.position.x=Math.cos(f.rotation.z)*1.15;f.position.z=Math.sin(f.rotation.z)*1.15;f.castShadow=true;palm.add(f);} palm.position.set(11.1,0,4);scene.add(palm);colliders.push(new THREE.Box3(new THREE.Vector3(10.65,0,3.55),new THREE.Vector3(11.55,7.5,4.45)));
    const hillMat=new THREE.MeshLambertMaterial({color:0x7c765f,flatShading:true}); for(let i=0;i<12;i++){const h=new THREE.Mesh(new THREE.ConeGeometry(8+Math.random()*11,10+Math.random()*11,7),hillMat);h.position.set(-42+i*8,4,-45-Math.random()*12);h.rotation.y=Math.random();scene.add(h);}
    addBox(-13.2,.42,-4.3,2.7,.84,.9,new THREE.MeshLambertMaterial({color:0x5b4d42})); addBox(-13.2,.8,-4.68,2.7,.8,.18,new THREE.MeshLambertMaterial({color:0x5b4d42})); addBox(-8,.8,-3.3,2.4,.14,1.4,mats.wood); for(const [x,z] of [[-9.2,-3.3],[-6.8,-3.3],[-8,-2.45],[-8,-4.15]])addBox(x,.48,z,.55,.96,.55,mats.darkWood); addBox(-3.4,.9,-10.4,3.3,1.8,.8,new THREE.MeshLambertMaterial({color:0x8f8a7f})); addBox(-2.2,.9,-7.8,.8,1.8,3.2,new THREE.MeshLambertMaterial({color:0x8f8a7f})); addBox(4.7,.82,-9.5,3.8,1.64,.8,mats.darkWood); addBox(4.7,1.62,-9.72,3.8,.12,.12,new THREE.MeshLambertMaterial({color:0x373b38}));
    for(const [x,y,z,p] of [[-12.5,2.5,-2,18],[-7.8,2.5,-2,16],[-2.6,2.5,-2.8,14],[4.7,2.5,-3.2,14],[4.5,2.5,-9.5,12]]){const l=new THREE.PointLight(0xffd493,p,9,2);l.position.set(x,y,z);scene.add(l);}
    const gunMat=new THREE.MeshPhongMaterial({color:0x292b28,shininess:18}),bakelite=new THREE.MeshPhongMaterial({color:0x7e3f24,shininess:9}),weapon=new THREE.Group(); const receiver=new THREE.Mesh(new THREE.BoxGeometry(.19,.18,.72),gunMat);receiver.position.set(0,0,-.18);weapon.add(receiver); const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.78,8),gunMat);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.04,-.88);weapon.add(barrel); const handguard=new THREE.Mesh(new THREE.BoxGeometry(.16,.15,.46),bakelite);handguard.position.set(0,-.03,-.55);weapon.add(handguard); const stock=new THREE.Mesh(new THREE.BoxGeometry(.16,.22,.52),bakelite);stock.position.set(0,-.03,.46);stock.rotation.x=-.12;weapon.add(stock); const grip=new THREE.Mesh(new THREE.BoxGeometry(.12,.33,.16),bakelite);grip.position.set(0,-.22,.06);grip.rotation.x=-.3;weapon.add(grip); const mag=new THREE.Mesh(new THREE.BoxGeometry(.13,.42,.19),gunMat);mag.position.set(0,-.24,-.18);mag.rotation.x=-.24;weapon.add(mag); weapon.position.set(.33,-.29,-.63);weapon.rotation.set(-.03,-.06,-.02);camera.add(weapon); const muzzle=new THREE.PointLight(0xffaa55,0,5,2);muzzle.position.set(0,.05,-1.27);weapon.add(muzzle);
    const enemyMat=new THREE.MeshLambertMaterial({color:0x313638}),pants=new THREE.MeshLambertMaterial({color:0x45483f}),skin=new THREE.MeshLambertMaterial({color:0xb18a69});
    const makeEnemy=(name,x,z,points)=>{const root=new THREE.Group();root.position.set(x,0,z);const body=new THREE.Mesh(new THREE.BoxGeometry(.65,1.05,.34),enemyMat);body.position.y=1.25;const hips=new THREE.Mesh(new THREE.BoxGeometry(.58,.35,.3),pants);hips.position.y=.63;const head=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),skin);head.position.y=2.03;const leg1=new THREE.Mesh(new THREE.BoxGeometry(.22,.78,.24),pants);leg1.position.set(-.16,.28,0);const leg2=leg1.clone();leg2.position.x=.16;const rifle=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.9),gunMat);rifle.position.set(.38,1.3,-.15);rifle.rotation.x=-.2;root.add(body,hips,head,leg1,leg2,rifle);root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(root);const e={root,body,head,hp:100,alive:true,points:points.map(([px,pz])=>new THREE.Vector3(px,0,pz)),target:0,speed:1+Math.random()*.45,nextShot:0,name};body.userData.enemy=e;body.userData.part="body";head.userData.enemy=e;head.userData.part="head";enemies.push(e);};
    makeEnemy("Pool guard",3.5,12,[[3.5,12],[7.2,10.8],[4.8,8.6]]); makeEnemy("Patio guard",-12,4,[[-12,4],[-10.8,1.3],[-14,1.3]]); makeEnemy("Villa guard",-8,-3.6,[[-8,-3.6],[-12,-4.5],[-7.8,-7]]); makeEnemy("Kitchen guard",-3.2,-10,[[-3.2,-10],[-2.5,-6.2],[-4.8,-6]]); makeEnemy("Guesthouse guard",4.7,-8.8,[[4.7,-8.8],[7.6,-5.6],[2.2,-4]]); makeEnemy("Garden guard",11.6,-1,[[11.6,-1],[11.4,5.5],[9,2.2]]); return {weapon,muzzle};
}
