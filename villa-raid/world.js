import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const PHOTO_FILES = [0,1,2,3].map(i => `./img/scene512.b64.0${i}`);
const FALLBACK = {
  stucco: 0xd7d0bd,
  stuccoDark: 0xb8b09e,
  floor: 0xa89272,
  wood: 0x6a4328,
  green: 0x274c2e,
  stone: 0x887a64,
  dark: 0x343530,
};

async function loadSourceTexture() {
  const parts = await Promise.all(PHOTO_FILES.map(async (url) => {
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) throw new Error(`photo chunk failed: ${url}`);
    return (await r.text()).trim();
  }));
  const dataUrl = `data:image/webp;base64,${parts.join("")}`;
  const texture = await new THREE.TextureLoader().loadAsync(dataUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, dataUrl };
}

function projectedMaterial(texture, projector, fallback = FALLBACK.stucco, side = THREE.FrontSide) {
  projector.updateMatrixWorld(true);
  projector.updateProjectionMatrix();
  const bias = new THREE.Matrix4().set(
    .5,0,0,.5,
    0,.5,0,.5,
    0,0,.5,.5,
    0,0,0,1
  );
  const projectorMatrix = new THREE.Matrix4()
    .multiplyMatrices(projector.projectionMatrix, projector.matrixWorldInverse)
    .premultiply(bias);
  return new THREE.ShaderMaterial({
    side,
    uniforms: {
      uTex: { value: texture },
      uProjector: { value: projectorMatrix },
      uFallback: { value: new THREE.Color(fallback) },
    },
    vertexShader: `
      uniform mat4 uProjector;
      varying vec4 vProjected;
      varying vec3 vNormalW;
      void main(){
        vec4 world = modelMatrix * vec4(position, 1.0);
        vProjected = uProjector * world;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTex;
      uniform vec3 uFallback;
      varying vec4 vProjected;
      varying vec3 vNormalW;
      void main(){
        vec3 p = vProjected.xyz / vProjected.w;
        vec2 uv = p.xy;
        bool inside = vProjected.w > 0.0 && p.z > 0.0 && p.z < 1.0 &&
                      uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
        vec3 c = inside ? texture2D(uTex, uv).rgb : uFallback;
        if (!inside) {
          float fakeLight = 0.78 + 0.22 * max(0.0, dot(normalize(vNormalW), normalize(vec3(-.4,.8,.25))));
          c *= fakeLight;
        }
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
}

function makeAK(camera) {
  const metal = new THREE.MeshPhongMaterial({ color:0x242522, shininess:18 });
  const wood = new THREE.MeshPhongMaterial({ color:0x7a3f23, shininess:8 });
  const g = new THREE.Group();
  const box = (sx,sy,sz,x,y,z,mat,rx=0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), mat);
    m.position.set(x,y,z); m.rotation.x = rx; g.add(m); return m;
  };
  box(.19,.17,.65,0,.02,-.18,metal);
  box(.16,.14,.42,0,-.02,-.54,wood);
  box(.15,.2,.46,0,-.03,.38,wood,-.12);
  box(.11,.30,.14,0,-.20,.06,wood,-.28);
  box(.13,.38,.17,0,-.22,-.16,metal,-.23);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.032,.041,.72,8),metal);
  barrel.rotation.x = Math.PI/2; barrel.position.set(0,.05,-.86); g.add(barrel);
  g.position.set(.34,-.29,-.63); g.rotation.set(-.03,-.06,-.02); camera.add(g);
  const muzzle = new THREE.PointLight(0xffa45a,0,4.5,2); muzzle.position.set(0,.05,-1.18); g.add(muzzle);
  return { weapon:g, muzzle };
}

function addCollider(colliders, mesh, padding = 0) {
  mesh.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(mesh);
  if (padding) b.expandByScalar(padding);
  colliders.push(b);
}

function makePhotoTarget(projector, scene, enemies, name, u, v, distance, scale=1) {
  const ndc = new THREE.Vector3(u*2-1, 1-v*2, .2).unproject(projector);
  const dir = ndc.sub(projector.position).normalize();
  const p = projector.position.clone().addScaledVector(dir, distance);
  const root = new THREE.Group(); root.position.copy(p); root.position.y -= .55*scale;
  const invisible = new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false });
  const body = new THREE.Mesh(new THREE.BoxGeometry(.68*scale,1.12*scale,.5*scale), invisible);
  body.position.y=.62*scale;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.22*scale,8,6), invisible);
  head.position.y=1.37*scale;
  root.add(body, head); scene.add(root);
  const e = {root,body,head,hp:100,alive:true,points:[],target:0,speed:0,nextShot:Infinity,name,staticPhoto:true};
  body.userData.enemy=e; body.userData.part="body"; head.userData.enemy=e; head.userData.part="head";
  enemies.push(e);
}

function makeGuard(scene, enemies, name, x,z, points) {
  const root=new THREE.Group(); root.position.set(x,0,z);
  const dark=new THREE.MeshLambertMaterial({color:0x343833});
  const pants=new THREE.MeshLambertMaterial({color:0x4d5048});
  const skin=new THREE.MeshLambertMaterial({color:0xaf8768});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.62,1.0,.34),dark); body.position.y=1.20;
  const hips=new THREE.Mesh(new THREE.BoxGeometry(.54,.34,.3),pants); hips.position.y=.61;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.23,8,6),skin); head.position.y=1.92;
  const l1=new THREE.Mesh(new THREE.BoxGeometry(.20,.76,.22),pants); l1.position.set(-.15,.28,0);
  const l2=l1.clone(); l2.position.x=.15;
  const rifle=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.82),new THREE.MeshLambertMaterial({color:0x252622})); rifle.position.set(.34,1.25,-.13); rifle.rotation.x=-.16;
  root.add(body,hips,head,l1,l2,rifle); root.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} }); scene.add(root);
  const e={root,body,head,hp:100,alive:true,points:points.map(([px,pz])=>new THREE.Vector3(px,0,pz)),target:0,speed:.75+Math.random()*.25,nextShot:0,name,staticPhoto:false};
  body.userData.enemy=e;body.userData.part="body";head.userData.enemy=e;head.userData.part="head";enemies.push(e);
}

export async function buildWorld(scene, camera, colliders, enemies) {
  const { texture, dataUrl } = await loadSourceTexture();
  scene.background = new THREE.Color(0x89a0b8);
  scene.fog = new THREE.Fog(0x8798a7, 30, 65);
  scene.add(new THREE.HemisphereLight(0xd9e4ec,0x5c5648,.85));
  const sun = new THREE.DirectionalLight(0xffefd4,.85); sun.position.set(-8,18,12); scene.add(sun);

  const spawn = new THREE.Vector3(0, 2.15, 12);
  const projector = new THREE.PerspectiveCamera(58, 4/3, .05, 80);
  projector.position.copy(spawn); projector.rotation.order="YXZ"; projector.rotation.set(0,0,0); projector.updateMatrixWorld(true);

  const plateDistance = 36;
  const plateH = 2*Math.tan(THREE.MathUtils.degToRad(projector.fov/2))*plateDistance;
  const plateW = plateH*projector.aspect;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(plateW,plateH),new THREE.MeshBasicMaterial({map:texture,depthWrite:false}));
  plate.position.set(0,spawn.y,-24); scene.add(plate);

  const projStucco = projectedMaterial(texture,projector,FALLBACK.stucco,THREE.DoubleSide);
  const projStone = projectedMaterial(texture,projector,FALLBACK.stone,THREE.DoubleSide);
  const projFloor = projectedMaterial(texture,projector,FALLBACK.floor,THREE.DoubleSide);
  const regular = {
    stucco:new THREE.MeshLambertMaterial({color:FALLBACK.stucco}),
    darkStucco:new THREE.MeshLambertMaterial({color:FALLBACK.stuccoDark}),
    floor:new THREE.MeshLambertMaterial({color:FALLBACK.floor}),
    wood:new THREE.MeshLambertMaterial({color:FALLBACK.wood}),
    green:new THREE.MeshLambertMaterial({color:FALLBACK.green}),
    stone:new THREE.MeshLambertMaterial({color:FALLBACK.stone}),
    dark:new THREE.MeshLambertMaterial({color:FALLBACK.dark}),
  };
  const box=(x,y,z,sx,sy,sz,mat=projStucco,collide=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=false;scene.add(m);if(collide)addCollider(colliders,m);return m;};

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30,34),projFloor); ground.rotation.x=-Math.PI/2; ground.position.set(0,0,-3); scene.add(ground);
  box(5.6,.16,5.2,9.1,.32,5.1,projStone,true);

  box(-5.8,3.15,-6.0,4.9,6.3,.32,projStucco,true);
  box(-1.7,4.5,-6.0,3.3,3.6,.32,projStucco,true);
  box(-.75,1.25,-6.0,1.4,2.5,.32,projStucco,true);
  box(-8.35,3.15,-9.0,.32,6.3,6.2,projStucco,true);
  box(-.05,3.15,-9.0,.32,6.3,6.2,projStucco,true);
  box(-4.2,3.15,-12.0,8.6,6.3,.32,projStucco,true);
  box(-4.2,6.25,-9.0,8.6,.26,6.2,projStucco,true);
  const doorPortal = new THREE.Mesh(new THREE.PlaneGeometry(1.9,2.9),projStucco); doorPortal.position.set(-2.45,1.45,-5.82); scene.add(doorPortal);

  box(-4.2,.06,-9.0,8.2,.12,5.7,regular.floor,false);
  box(-4.2,1.55,-9.25,.18,3.1,5.0,regular.darkStucco,true);
  box(-6.2,.48,-10.65,2.7,.65,.95,regular.dark,true);
  box(-6.2,.92,-11.0,2.7,.7,.22,regular.dark,true);
  box(-2.4,.85,-10.7,3.1,1.7,.75,regular.wood,true);
  box(-2.4,1.72,-10.95,3.1,.12,.12,regular.dark,false);
  box(-6.9,.78,-7.75,2.7,.12,1.4,regular.wood,true);

  box(3.9,2.45,-9.4,6.3,4.9,.32,projStucco,true);
  box(7.2,2.45,-11.3,.32,4.9,4.2,projStucco,true);
  box(.7,2.45,-11.3,.32,4.9,4.2,projStucco,true);
  box(3.9,2.45,-13.35,6.6,4.9,.32,projStucco,true);
  box(3.9,4.85,-11.3,6.6,.24,4.2,projStucco,true);
  const guestPortal = new THREE.Mesh(new THREE.PlaneGeometry(1.45,2.55),projStucco);guestPortal.position.set(1.55,1.28,-9.22);scene.add(guestPortal);
  box(3.9,.05,-11.25,6.1,.1,3.8,regular.floor,false);
  box(5.5,1.5,-12.65,.18,3.0,1.4,regular.darkStucco,true);
  box(3.7,.9,-12.4,2.6,1.8,.7,regular.wood,true);

  box(9.2,1.45,-7.4,4.0,2.9,.32,projStucco,true);
  box(11.2,1.45,-9.1,.32,2.9,3.8,projStucco,true);
  box(9.2,2.88,-9.0,4.1,.2,3.9,projStucco,true);
  box(-10.8,1.1,-5.0,.5,2.2,18,projStone,true);
  box(10.9,1.1,-2.5,.5,2.2,17,projStone,true);
  box(0,1.1,-15.0,22,2.2,.5,projStone,true);

  const palm = new THREE.Group();
  const trunkMat = projectedMaterial(texture,projector,0x6f523b,THREE.DoubleSide);
  for(let i=0;i<8;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(.30-i*.015,.36-i*.012,1.05,7),trunkMat);t.position.y=.5+i*.95;t.rotation.z=-.022*i;palm.add(t);}
  const frondMat=projectedMaterial(texture,projector,0x355c36,THREE.DoubleSide);
  for(let i=0;i<12;i++){const f=new THREE.Mesh(new THREE.PlaneGeometry(.62,4.9,1,3),frondMat);f.position.y=7.35;f.rotation.x=-1.02;f.rotation.z=i/12*Math.PI*2;f.position.x=Math.cos(f.rotation.z)*.95;f.position.z=Math.sin(f.rotation.z)*.95;palm.add(f);}
  palm.position.set(-8.25,0,-3.0);scene.add(palm);colliders.push(new THREE.Box3(new THREE.Vector3(-8.7,0,-3.45),new THREE.Vector3(-7.8,7.7,-2.55)));

  const treeMat=new THREE.MeshLambertMaterial({color:0x314b31,flatShading:true});
  for(const [x,z,s] of [[-11,-18,2.1],[-5,-18,2.4],[2,-18,2.0],[8,-17,2.3],[13,-15,2.0]]){
    const c=new THREE.Mesh(new THREE.ConeGeometry(2.3*s,5.0*s,7),treeMat);c.position.set(x,2.5*s,z);scene.add(c);
  }

  makePhotoTarget(projector,scene,enemies,"Poolside target A",.342,.755,10.8,.92);
  makePhotoTarget(projector,scene,enemies,"Poolside target B",.392,.760,10.6,.95);
  makePhotoTarget(projector,scene,enemies,"Poolside target C",.447,.760,10.6,.95);
  makePhotoTarget(projector,scene,enemies,"Poolside target D",.505,.773,10.5,.92);
  makeGuard(scene,enemies,"Interior guard",-5.5,-10.2,[[-5.5,-10.2],[-2.0,-10.2],[-2.0,-7.4],[-6.6,-7.4]]);
  makeGuard(scene,enemies,"Rear guard",8.1,-12.8,[[8.1,-12.8],[8.9,-8.7],[6.8,-8.7]]);

  const { weapon,muzzle } = makeAK(camera);
  camera.position.copy(spawn); camera.rotation.set(0,0,0);
  return { weapon,muzzle,spawn,sourceDataUrl:dataUrl,projector };
}
