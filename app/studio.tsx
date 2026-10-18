'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Download,
  Eye,
  Info,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Sunset,
} from 'lucide-react';

type Mode = 'day' | 'sunset' | 'night';
const M: Record<Mode, any> = {
  day: {
    label: '白天',
    bg: 0x91a9b3,
    fog: 0x9cadad,
    sky: 0xcbdce0,
    ground: 0x78634c,
    hemi: 2.15,
    sun: 0xfff1d0,
    sunI: 5.4,
    amb: 1.45,
    land: 0xffffff,
  },
  sunset: {
    label: '黄昏',
    bg: 0xc97b62,
    fog: 0xb67460,
    sky: 0xffb27a,
    ground: 0x493c38,
    hemi: 1.25,
    sun: 0xff8a3c,
    sunI: 7.2,
    amb: 0.82,
    land: 0xf19a77,
  },
  night: {
    label: '夜晚',
    bg: 0x101c35,
    fog: 0x16213a,
    sky: 0x6078a6,
    ground: 0x16131a,
    hemi: 0.42,
    sun: 0x7d94ca,
    sunI: 0.75,
    amb: 0.28,
    land: 0x263453,
  },
};
function tex(kind: string) {
  const c = document.createElement('canvas'),
    x = c.getContext('2d')!;
  c.width = c.height = 768;
  let seed = 73421,
    r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  x.fillStyle =
    kind === 'wall'
      ? '#b9ac91'
      : kind === 'floor'
        ? '#80674f'
        : kind === 'brick'
          ? '#784838'
          : '#c8b68e';
  x.fillRect(0, 0, 768, 768);
  if (kind === 'floor') {
    for (let j = 0; j < 8; j++)
      for (let i = -1; i < 9; i++) {
        let o = (j % 2) * 48;
        x.fillStyle = `hsl(${25 + r() * 10} 24% ${35 + r() * 9}%)`;
        x.fillRect(i * 96 + o + 3, j * 96 + 3, 90, 90);
        x.strokeStyle = '#49372f';
        x.strokeRect(i * 96 + o + 3, j * 96 + 3, 90, 90);
      }
  } else if (kind === 'brick') {
    for (let j = 0; j < 18; j++)
      for (let i = -1; i < 8; i++) {
        let o = (j % 2) * 55;
        x.fillStyle = `hsl(${8 + r() * 8} 35% ${30 + r() * 10}%)`;
        x.fillRect(i * 110 + o + 4, j * 45 + 4, 102, 37);
      }
  } else {
    for (let i = 0; i < 3800; i++) {
      let a = r() * 0.13;
      x.fillStyle = `rgba(${r() > 0.5 ? 255 : 35},${r() > 0.5 ? 245 : 30},${r() > 0.5 ? 220 : 25},${a})`;
      x.fillRect(r() * 768, r() * 768, 1 + r() * 4, 1 + r() * 4);
    }
    if (kind === 'paper') {
      x.strokeStyle = 'rgba(79,55,35,.45)';
      x.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        x.beginPath();
        x.moveTo(70, 120 + i * 35);
        x.bezierCurveTo(
          180,
          100 + i * 38,
          450,
          155 + i * 27,
          690,
          125 + i * 34,
        );
        x.stroke();
      }
    }
  }
  let t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
function landscape() {
  const c = document.createElement('canvas'),
    x = c.getContext('2d')!;
  c.width = 1280;
  c.height = 720;
  let g = x.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#91afbd');
  g.addColorStop(0.55, '#c9c4aa');
  g.addColorStop(1, '#69725e');
  x.fillStyle = g;
  x.fillRect(0, 0, 1280, 720);
  let layer = (y: number, col: string, a: number, n: number) => {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, 720);
    x.lineTo(0, y);
    for (let i = 0; i <= n; i++)
      x.lineTo(
        (i * 1280) / n,
        y - Math.sin(i * 1.8) * a - Math.sin(i * 0.55) * a * 0.7,
      );
    x.lineTo(1280, 720);
    x.fill();
  };
  layer(405, 'rgba(98,112,106,.55)', 54, 12);
  layer(500, 'rgba(68,84,70,.72)', 38, 18);
  layer(590, '#354a37', 28, 32);
  for (let i = 0; i < 90; i++) {
    x.fillStyle = `rgba(26,53,31,${0.45 + (i % 4) * 0.1})`;
    x.beginPath();
    x.arc(
      (i * 137) % 1280,
      530 + (i % 7) * 18,
      18 + (i % 5) * 5,
      0,
      Math.PI * 2,
    );
    x.fill();
  }
  let t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function woodTexture() {
  const c = document.createElement('canvas'), x = c.getContext('2d')!;
  c.width = 1024; c.height = 256;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6e452a'); g.addColorStop(.5, '#3a2116'); g.addColorStop(1, '#5a351f');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 256);
  let seed = 9813, rnd = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 110; i++) {
    const y = rnd() * 256, amp = 2 + rnd() * 8;
    x.strokeStyle = `rgba(${20 + rnd() * 25},${9 + rnd() * 14},${4 + rnd() * 8},${.12 + rnd() * .24})`;
    x.lineWidth = .4 + rnd() * 2; x.beginPath(); x.moveTo(0, y);
    for (let px = 0; px <= 1024; px += 32) x.lineTo(px, y + Math.sin(px * .018 + i) * amp);
    x.stroke();
  }
  for (let i = 0; i < 14; i++) {
    const px = rnd() * 1024, py = rnd() * 256;
    x.strokeStyle = 'rgba(22,10,5,.36)'; x.lineWidth = 3;
    x.beginPath(); x.ellipse(px, py, 18 + rnd() * 28, 5 + rnd() * 8, 0, 0, Math.PI * 2); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

function cloudTexture() {
  const c = document.createElement('canvas'), x = c.getContext('2d')!;
  c.width = c.height = 512;
  let seed = 1327, rnd = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 70; i++) {
    const px = 55 + rnd() * 402, py = 90 + rnd() * 330, r = 25 + rnd() * 72;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(255,255,250,${.28 + rnd() * .3})`); g.addColorStop(.55, 'rgba(250,250,245,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(px-r, py-r, r*2, r*2);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function box(
  p: THREE.Object3D,
  s: number[],
  v: number[],
  mat: THREE.Material,
  rot = [0, 0, 0],
  name = '',
) {
  let o = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), mat);
  o.position.set(v[0], v[1], v[2]);
  o.rotation.set(rot[0], rot[1], rot[2]);
  o.castShadow = o.receiveShadow = true;
  o.name = name;
  p.add(o);
  return o;
}

export default function Studio() {
  const host = useRef<HTMLDivElement>(null),
    api = useRef<any>(null);
  const [mode, setMode] = useState<Mode>('day'),
    [tour, setTour] = useState(false),
    [info, setInfo] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const el = host.current,
      scene = new THREE.Scene();
    scene.background = new THREE.Color(M.day.bg);
    scene.fog = new THREE.FogExp2(M.day.fog, 0.019);
    const camera = new THREE.PerspectiveCamera(
        52,
        el.clientWidth / el.clientHeight,
        0.1,
        100,
      ),
      initial = new THREE.Vector3(4.25, 2.05, 3.45);
    camera.position.copy(initial);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.35, 2.45, -1.15);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 2.1;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI * 0.48;
    const plasterT = tex('wall'),
      floorT = tex('floor'),
      brickT = tex('brick'),
      paperT = tex('paper'),
      woodT = woodTexture();
    floorT.repeat.set(3.2, 2.6);
    plasterT.repeat.set(2.2, 1.2);
    brickT.repeat.set(2, 2);
    const plaster = new THREE.MeshStandardMaterial({
        map: plasterT,
        roughness: 0.94,
        color: 0xd0c2a5,
      }),
      floor = new THREE.MeshStandardMaterial({
        map: floorT,
        roughness: 0.88,
        color: 0xa98b69,
      }),
      wood = new THREE.MeshStandardMaterial({
        map: woodT,
        bumpMap: woodT,
        bumpScale: 0.055,
        color: 0xa97b52,
        roughness: 0.82,
      }),
      dark = new THREE.MeshStandardMaterial({
        map: woodT,
        bumpMap: woodT,
        bumpScale: 0.07,
        color: 0x57351f,
        roughness: 0.86,
      }),
      brick = new THREE.MeshStandardMaterial({ map: brickT, bumpMap: brickT, bumpScale: .085, roughness: 0.96 }),
      stone = new THREE.MeshStandardMaterial({ color: 0x8e887b, roughness: 1 }),
      brass = new THREE.MeshStandardMaterial({
        color: 0x856330,
        roughness: 0.38,
        metalness: 0.68,
      });
    box(scene, [10, 0.22, 8], [0, -0.08, 0], floor);
    // Open atrium: four perimeter roof bands replace the former solid ceiling.
    box(scene, [10, 0.28, 1.4], [0, 5.02, -3.3], plaster);
    box(scene, [10, 0.28, 1.4], [0, 5.02, 3.3], plaster);
    box(scene, [1.5, 0.28, 5.2], [-4.25, 5.02, 0], plaster);
    box(scene, [1.5, 0.28, 5.2], [4.25, 5.02, 0], plaster);
    box(scene, [10, 5, 0.24], [0, 2.5, 4], plaster);
    box(scene, [0.24, 5, 8], [-5, 2.5, 0], plaster);
    box(scene, [0.24, 5, 8], [5, 2.5, 0], plaster);
    box(scene, [10, 0.9, 0.28], [0, 0.45, -4], plaster);
    box(scene, [10, 0.8, 0.28], [0, 4.6, -4], plaster);
    box(scene, [1.1, 3.7, 0.28], [-4.45, 2.45, -4], brick);
    box(scene, [1.35, 3.7, 0.28], [-1.75, 2.45, -4], brick);
    box(scene, [4.85, 3.7, 0.28], [2.575, 2.45, -4], brick);
    box(scene, [3.4, 2.15, 0.05], [2.25, 2.15, -3.84], brick);
    box(scene, [.035, 3.75, 6.8], [-4.865, 2.2, -.25], brick);
    box(scene, [.035, 2.9, 3.25], [4.865, 2.0, -1.55], brick);
    // Thin limewash remnants break up the regular brick field.
    box(scene, [.025, 1.15, 2.2], [-4.84, 1.05, 1.05], plaster);
    box(scene, [1.35, .75, .025], [3.55, .72, -3.845], plaster);
    box(scene, [.025, .9, 1.45], [4.84, 3.25, -.55], plaster);
    const landMat = new THREE.MeshBasicMaterial({ map: landscape() });
    box(scene, [6.8, 3.9, 0.03], [-1.9, 2.45, -4.55], landMat);
    for (const wx of [-3.15, -0.92]) {
      box(scene, [0.09, 3.1, 0.09], [wx, 2.55, -3.78], dark);
      box(scene, [1.55, 0.08, 0.09], [wx, 2.48, -3.78], dark);
      box(scene, [1.72, 0.18, 0.25], [wx, 4.08, -3.91], stone);
      box(scene, [1.72, 0.15, 0.44], [wx, 0.95, -4], stone);
      box(scene, [0.18, 3.25, 0.25], [wx - 0.82, 2.48, -3.91], stone);
      box(scene, [0.18, 3.25, 0.25], [wx + 0.82, 2.48, -3.91], stone);
    }
    // Sparse historic structure around the opening, with a deep stone reveal.
    for (const z of [-3.55, -2.75, 2.75, 3.55])
      box(scene, [10.2, 0.3, 0.34], [0, 4.78, z], dark);
    for (const x of [-4.55, -3.72, 3.72, 4.55])
      box(scene, [0.42, 0.16, 5.25], [x, 4.84, 0], wood);
    const atriumStone = new THREE.MeshStandardMaterial({ color: 0xb9ad94, roughness: .98, bumpMap: plasterT, bumpScale: .035 });
    box(scene, [7.45, .3, .42], [0, 4.94, -2.78], atriumStone);
    box(scene, [7.45, .3, .42], [0, 4.94, 2.78], atriumStone);
    box(scene, [.42, .3, 5.15], [-3.72, 4.94, 0], atriumStone);
    box(scene, [.42, .3, 5.15], [3.72, 4.94, 0], atriumStone);
    // Vertical inner curb gives the skylight real architectural thickness.
    box(scene, [7.45, .58, .22], [0, 5.22, -2.68], atriumStone);
    box(scene, [7.45, .58, .22], [0, 5.22, 2.68], atriumStone);
    box(scene, [.22, .58, 5.15], [-3.62, 5.22, 0], atriumStone);
    box(scene, [.22, .58, 5.15], [3.62, 5.22, 0], atriumStone);

    // Infinite-feeling sky volume above the opening.
    const skyUniforms = {
      top: { value: new THREE.Color(0x6f9ec2) },
      bottom: { value: new THREE.Color(0xe8d9ba) },
      offset: { value: 18 }, exponent: { value: .72 }, cloudStrength: { value: .34 },
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(34, 32, 18), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: skyUniforms,
      vertexShader: 'varying vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader: 'uniform vec3 top;uniform vec3 bottom;uniform float offset;uniform float exponent;uniform float cloudStrength;varying vec3 vWorld;void main(){float h=normalize(vWorld+vec3(0.0,offset,0.0)).y;vec3 base=mix(bottom,top,max(pow(max(h,0.0),exponent),0.0));float n=sin(vWorld.x*.34)+sin(vWorld.z*.28)+sin((vWorld.x+vWorld.z)*.19);float c=smoothstep(.75,1.85,n)*cloudStrength;gl_FragColor=vec4(mix(base,vec3(.94,.94,.91),c),1.0);}',
    })); sky.position.y = 4; scene.add(sky);
    const cloudMap = cloudTexture(), cloudLayers: THREE.Sprite[] = [];
    for (let i = 0; i < 3; i++) {
      const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudMap, transparent: true, opacity: .72 - i * .08, depthWrite: false, color: 0xfff7e8 }));
      cloud.scale.set(8.5 + i * 2.2, 4.2 + i * 1.1, 1);
      cloud.position.set((i - 1) * 2.2, 7.6 + i * 1.8, (i % 2 ? 1 : -1) * 1.6); cloud.userData.speed = .018 + i * .009; scene.add(cloud); cloudLayers.push(cloud);
    }
    const starGeo = new THREE.BufferGeometry(), starPos: number[] = [];
    for (let i = 0; i < 120; i++) { const a = i * 2.399, r = 3 + (i % 17) * .42; starPos.push(Math.cos(a) * r, 9 + (i % 13) * .38, Math.sin(a) * r); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xd9e3ff, size: .055, transparent: true, opacity: 0, depthWrite: false })); scene.add(stars);
    for (const p of [
      [10, 0.24, 0.18, 0, 0.18, -3.84],
      [10, 0.24, 0.18, 0, 0.18, 3.84],
      [0.18, 0.24, 8, -4.84, 0.18, 0],
      [0.18, 0.24, 8, 4.84, 0.18, 0],
    ])
      box(scene, p.slice(0, 3), p.slice(3), dark);
    box(scene, [2, 3.25, 0.18], [4.86, 1.65, 1.4], wood, [0, Math.PI / 2, 0]);
    for (let y = 0.6; y < 3; y += 1.05)
      for (let z = 0.85; z < 2.1; z += 0.7)
        box(scene, [0.035, 0.72, 0.5], [4.74, y, z], dark, [0, Math.PI / 2, 0]);
    box(scene, [4.5, 0.22, 2.05], [0.15, 1.42, 0.35], wood, [0, -0.1, 0]);
    box(scene, [4.05, .44, .16], [.15, 1.18, 1.27], dark, [0, -.1, 0]);
    box(scene, [4.05, .44, .16], [.15, 1.18, -.57], dark, [0, -.1, 0]);
    for (const x of [-1.05, .15, 1.35]) {
      box(scene, [1.02, .31, .06], [x, 1.18, 1.34], wood, [0, -.1, 0]);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(.075, .014, 8, 20, Math.PI), brass);
      handle.rotation.set(Math.PI / 2, 0, -.1); handle.position.set(x + .08, 1.17, 1.43); scene.add(handle);
    }
    for (const p of [
      [-1.65, 0.72, 0.98],
      [1.95, 0.72, 0.62],
      [-1.82, 0.72, -0.35],
      [1.78, 0.72, -0.71],
    ])
      box(scene, [0.34, 1.45, 0.34], p, dark, [0, -0.1, 0]);
    box(scene, [3.7, 0.18, 0.18], [0.05, 0.48, 0.12], dark, [0, -0.1, 0]);
    const paper = new THREE.MeshStandardMaterial({
      map: paperT,
      roughness: 0.86,
      side: THREE.DoubleSide,
    });
    for (const p of [
      [-0.8, 1.58, 0.12, 0.08],
      [0.2, 1.57, 0.1, -0.18],
      [0.85, 1.58, 0.45, 0.16],
    ])
      box(scene, [1.15, 0.025, 0.8], p.slice(0, 3), paper, [0, p[3], 0]);
    let scroll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.095, 1.35, 18),
      paper,
    );
    scroll.rotation.z = Math.PI / 2;
    scroll.position.set(-1.35, 1.68, 0.82);
    scroll.castShadow = true;
    scene.add(scroll);
    let quill = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 1.15, 10),
      new THREE.MeshStandardMaterial({ color: 0xe1d0a8 }),
    );
    quill.scale.x = 0.28;
    quill.rotation.z = -0.65;
    quill.position.set(0.95, 2.15, 0.35);
    scene.add(quill);
    let ink = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.28, 18),
      new THREE.MeshStandardMaterial({ color: 0x191717 }),
    );
    ink.position.set(0.67, 1.72, 0.38);
    scene.add(ink);
    let arm = new THREE.Group();
    arm.position.set(1.45, 2, -0.08);
    for (let i = 0; i < 3; i++) {
      let t = new THREE.Mesh(
        new THREE.TorusGeometry(0.43, 0.022, 10, 48),
        brass,
      );
      t.rotation.set(i * 0.72, i * 0.56, i * 0.34);
      arm.add(t);
    }
    arm.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), brass));
    scene.add(arm);
    box(scene, [0.42, 0.08, 0.42], [1.45, 1.62, -0.08], dark);
    let artGroup = new THREE.Group();
    artGroup.position.set(2.35, 2.65, -3.78);
    scene.add(artGroup);
    let art = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 2.14, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 }),
    );
    art.name = 'mona';
    artGroup.add(art);
    new THREE.TextureLoader().load('/assets/mona-lisa.jpg', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      (art.material as THREE.MeshStandardMaterial).map = t;
      (art.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });
    let frame = new THREE.MeshStandardMaterial({
      color: 0x5a3517,
      roughness: 0.48,
      metalness: 0.12,
    });
    for (const v of [
      [1.9, 0.18, 0, 1.15],
      [1.9, 0.18, 0, -1.15],
      [0.18, 2.48, -0.81, 0],
      [0.18, 2.48, 0.81, 0],
    ])
      box(artGroup, [v[0], v[1], 0.18], [v[2], v[3], 0.02], frame);
    for (const sx of [-0.91, 0.91])
      for (const sy of [-1.25, 1.25]) {
        let d = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 8), brass);
        d.scale.set(0.8, 0.8, 0.35);
        d.position.set(sx, sy, 0.12);
        artGroup.add(d);
      }
    for (const x of [-0.2, 1.25, 3.65])
      box(scene, [0.9, 1.25, 0.1], [x, 2.55, 3.82], dark);
    box(scene, [1.7, 0.72, 0.7], [-3.8, 0.38, 2.85], dark);
    box(scene, [1.75, 0.12, 0.78], [-3.8, 0.8, 2.85], wood);
    for (let x = -0.3; x <= 0.3; x += 0.6)
      for (let z = -0.3; z <= 0.3; z += 0.6)
        box(scene, [0.13, 0.8, 0.13], [2.95 + x, 0.42, 1.9 + z], dark);
    box(scene, [0.95, 0.14, 0.75], [2.95, 0.88, 1.9], wood);
    const hemi = new THREE.HemisphereLight(M.day.sky, M.day.ground, M.day.hemi),
      amb = new THREE.AmbientLight(0xffecd2, M.day.amb),
      sun = new THREE.DirectionalLight(M.day.sun, M.day.sunI);
    scene.add(hemi, amb);
    const atriumLight = new THREE.PointLight(0xcfe7ff, 34, 15, 1.25);
    atriumLight.position.set(0, 7.2, 0); atriumLight.castShadow = true;
    atriumLight.shadow.mapSize.set(1024, 1024); scene.add(atriumLight);
    sun.position.set(-6, 7, -6);
    sun.target.position.set(1, 0, 1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
    const warm1 = new THREE.PointLight(0xffa14b, 0.6, 7, 1.7);
    warm1.position.set(0.15, 2.25, 0.35);
    warm1.castShadow = true;
    scene.add(warm1);
    const warm2 = new THREE.SpotLight(0xffd29b, 0.4, 7, 0.7, 0.55, 1.3);
    warm2.position.set(2.3, 4.4, -2.1);
    warm2.target.position.copy(artGroup.position);
    scene.add(warm2, warm2.target);
    let candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.42, 14),
      new THREE.MeshStandardMaterial({ color: 0xd6c4a1 }),
    );
    candle.position.set(0.05, 1.82, 0.02);
    scene.add(candle);
    let flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb24b }),
    );
    flame.scale.y = 1.7;
    flame.position.set(0.05, 2.08, 0.02);
    scene.add(flame);
    let current: Mode = 'day',
      auto = false,
      elapsed = 0;
    const apply = (m: Mode) => {
      current = m;
      let v = M[m];
      (scene.background as THREE.Color).setHex(v.bg);
      (scene.fog as THREE.FogExp2).color.setHex(v.fog);
      hemi.color.setHex(v.sky);
      hemi.groundColor.setHex(v.ground);
      hemi.intensity = v.hemi;
      sun.color.setHex(v.sun);
      sun.intensity = v.sunI;
      amb.intensity = v.amb;
      warm1.intensity = m === 'night' ? 18 : m === 'sunset' ? 3.2 : 0.6;
      warm2.intensity = m === 'night' ? 22 : m === 'sunset' ? 3.5 : 0.4;
      landMat.color.setHex(v.land);
      atriumLight.color.setHex(m === 'day' ? 0xcfe9ff : m === 'sunset' ? 0xffb77e : 0x6d83bd);
      atriumLight.intensity = m === 'day' ? 34 : m === 'sunset' ? 24 : 7;
      skyUniforms.top.value.setHex(m === 'day' ? 0x5c91bd : m === 'sunset' ? 0xb86f72 : 0x07152f);
      skyUniforms.bottom.value.setHex(m === 'day' ? 0xe5d8bd : m === 'sunset' ? 0xf2b07d : 0x172b51);
      skyUniforms.cloudStrength.value = m === 'night' ? .08 : m === 'sunset' ? .26 : .36;
      cloudLayers.forEach((c) => {
        const mat = c.material as THREE.SpriteMaterial;
        mat.color.setHex(m === 'day' ? 0xfffbef : m === 'sunset' ? 0xffc0a0 : 0x65759a);
        mat.opacity = m === 'night' ? .2 : m === 'sunset' ? .52 : .72;
      });
      (stars.material as THREE.PointsMaterial).opacity = m === 'night' ? .88 : 0;
      renderer.toneMappingExposure = m === 'day' ? 1.18 : m === 'sunset' ? 1.08 : 1.12;
    };
    const requestedMode = window.location.hash.slice(1) as Mode;
    if (M[requestedMode]) {
      apply(requestedMode);
      setMode(requestedMode);
    }
    if (new URLSearchParams(window.location.search).get('view') === 'atrium') {
      camera.position.set(2.7, 1.75, 2.8);
      controls.target.set(0, 6.7, 0);
      controls.update();
    }
    const reset = () => {
        camera.position.copy(initial);
        controls.target.set(0.35, 2.45, -1.15);
        controls.update();
      },
      fixed = () => {
        camera.position.copy(initial);
        controls.target.set(0.35, 2.45, -1.15);
        controls.update();
      },
      download = () => {
        fixed();
        renderer.render(scene, camera);
        let a = document.createElement('a');
        a.download = `${current}.png`;
        a.href = renderer.domElement.toDataURL('image/png');
        a.click();
      };
    api.current = {
      apply,
      reset,
      fixed,
      download,
      setAuto: (v: boolean) => (auto = v),
      focus: () => {
        camera.position.set(3.9, 2.85, -0.3);
        controls.target.copy(artGroup.position);
        controls.update();
      },
    };
    let ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2(),
      click = (e: MouseEvent) => {
        let r = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          (-(e.clientY - r.top) / r.height) * 2 + 1,
        );
        ray.setFromCamera(pointer, camera);
        if (ray.intersectObjects(artGroup.children, true).length) {
          api.current.focus();
          setInfo(true);
        }
      };
    renderer.domElement.addEventListener('dblclick', click);
    let clock = new THREE.Clock(),
      raf = 0,
      animate = () => {
        raf = requestAnimationFrame(animate);
        let dt = clock.getDelta();
        elapsed += dt;
        if (auto) {
          let a = elapsed * 0.12;
          camera.position.set(
            Math.cos(a) * 6.9,
            2.8 + Math.sin(a * 0.7) * 0.35,
            Math.sin(a) * 5.7,
          );
          controls.target.set(0, 1.6, -0.65);
        }
        controls.update();
        cloudLayers.forEach((cloud, i) => {
          cloud.position.x += cloud.userData.speed * dt;
          if (cloud.position.x > 4.5 + i) cloud.position.x = -4.5 - i;
        });
        flame.scale.y = 1.55 + Math.sin(elapsed * 9) * 0.18;
        renderer.render(scene, camera);
      };
    animate();
    setReady(true);
    let resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('dblclick', click);
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);
  const choose = (m: Mode) => {
    setMode(m);
    api.current?.apply(m);
  };
  return (
    <main className="experience">
      <div ref={host} className="viewport" />
      <header className="masthead">
        <div className="seal">L</div>
        <div>
          <p>MEET THE MASTER</p>
          <h1>
            遇见画家 <span>/</span> 达芬奇的虚拟画室
          </h1>
        </div>
      </header>
      <div className="hint">
        <Eye size={14} />
        <span>拖动环视 · 滚轮移动 · 双击画作细读</span>
      </div>
      {!ready && (
        <div className="loading">
          <div className="loader" />
          <span>正在构建画室…</span>
        </div>
      )}
      <nav className="controls">
        <div className="mode-group">
          {(['day', 'sunset', 'night'] as Mode[]).map((m, i) => {
            let I = [Sun, Sunset, Moon][i];
            return (
              <button
                aria-label={`切换至${M[m].label}`}
                key={m}
                className={mode === m ? 'active' : ''}
                onClick={() => choose(m)}
              >
                <I size={17} />
                <span>{M[m].label}</span>
              </button>
            );
          })}
        </div>
        <i />
        <button
          aria-label={tour ? '停止自动漫游' : '开始自动漫游'}
          className={tour ? 'active' : ''}
          onClick={() =>
            setTour((v) => {
              api.current?.setAuto(!v);
              return !v;
            })
          }
        >
          <Sparkles size={17} />
          <span>{tour ? '停止漫游' : '自动漫游'}</span>
        </button>
        <button aria-label="重置视角" onClick={() => api.current?.reset()}>
          <RotateCcw size={17} />
          <span>重置视角</span>
        </button>
        <button aria-label="导出固定机位截图" onClick={() => api.current?.download()}>
          <Download size={17} />
          <span>导出</span>
        </button>
      </nav>
      {info && (
        <aside className="art-panel">
          <button className="close" onClick={() => setInfo(false)}>
            ×
          </button>
          <p className="eyebrow">PORTRAIT · 1503–1519</p>
          <h2>蒙娜丽莎</h2>
          <h3>Leonardo da Vinci</h3>
          <p>
            以人物背后的螺旋山水与含蓄神情闻名。达芬奇使用“渐隐法”消除轮廓边界，让光影像呼吸一样连续。
          </p>
          <div className="rule" />
          <small>木板油画 · 卢浮宫博物馆藏</small>
          <button className="view-close" onClick={() => setInfo(false)}>
            <Info size={14} />
            返回画室
          </button>
        </aside>
      )}
      <div className="mode-name">
        <span>LIGHT STUDY</span>
        <b>{M[mode].label}</b>
      </div>
    </main>
  );
}
