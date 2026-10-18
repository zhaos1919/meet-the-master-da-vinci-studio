'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Download, Eye, Moon, RotateCcw, Sparkles, Sun, Sunset } from 'lucide-react';

type Mode = 'day' | 'sunset' | 'night';
type View = 'overview' | 'desk' | 'painting';

const LIGHTS = {
  day: { label: '白天', bg: 0x9aa9aa, hemi: 2.1, ambient: .8, sun: 4.2, sunColor: 0xfff1d0, exposure: 1.05 },
  sunset: { label: '黄昏', bg: 0x8d6557, hemi: 1.15, ambient: .5, sun: 5.2, sunColor: 0xffa45b, exposure: 1.08 },
  night: { label: '夜晚', bg: 0x111a2a, hemi: .45, ambient: .25, sun: .55, sunColor: 0x8098cc, exposure: 1.16 },
} as const;

const VIEWS: Record<View, { label: string; position: [number, number, number]; target: [number, number, number] }> = {
  overview: { label: '建筑全景', position: [3.55, 1.68, 2.62], target: [-.35, 1.42, -.55] },
  desk: { label: '研究桌近景', position: [1.05, 1.58, 2.15], target: [2.92, .82, .02] },
  painting: { label: '绘画区近景', position: [-1.05, 1.65, 2.15], target: [-3, 1.55, -1.1] },
};

function makeBackdrop() {
  const c = document.createElement('canvas'), x = c.getContext('2d')!;
  c.width = 1024; c.height = 512;
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#879b9e'); g.addColorStop(.55, '#b9b5a5'); g.addColorStop(1, '#4e554b');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  x.fillStyle = 'rgba(59,74,64,.48)'; x.beginPath(); x.moveTo(0, 380);
  for (let i = 0; i <= 16; i++) x.lineTo(i * 64, 325 - Math.sin(i * 1.25) * 38);
  x.lineTo(1024, 512); x.lineTo(0, 512); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function StudioV3() {
  const mount = useRef<HTMLDivElement>(null), api = useRef<any>(null);
  const [mode, setMode] = useState<Mode>('day');
  const [view, setView] = useState<View>('overview');
  const [tour, setTour] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [details, setDetails] = useState(false);
  const [report, setReport] = useState({ meshes: 0, materials: 0, textures: 0, nodes: 0 });
  const [debugReport, setDebugReport] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(LIGHTS.day.bg); scene.fog = new THREE.FogExp2(LIGHTS.day.bg, .012);
    const camera = new THREE.PerspectiveCamera(48, host.clientWidth / host.clientHeight, .06, 80);
    camera.position.set(...VIEWS.overview.position);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setSize(host.clientWidth, host.clientHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = LIGHTS.day.exposure;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(...VIEWS.overview.target); controls.enableDamping = true; controls.dampingFactor = .06; controls.minDistance = .8; controls.maxDistance = 13; controls.maxPolarAngle = Math.PI * .49;

    const hemi = new THREE.HemisphereLight(0xdce5e3, 0x3f3328, LIGHTS.day.hemi), ambient = new THREE.AmbientLight(0xffead4, LIGHTS.day.ambient);
    const sun = new THREE.DirectionalLight(LIGHTS.day.sunColor, LIGHTS.day.sun); sun.position.set(4.5, 7, 3.5); sun.target.position.set(0, 1.25, 0); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -7; sun.shadow.camera.right = 7; sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7; sun.shadow.bias = -.00022;
    const windowFill = new THREE.SpotLight(0xd8ebff, 5.5, 14, .78, .7, 1.4); windowFill.position.set(-3.7, 3.7, -2.6); windowFill.target.position.set(0, 1, 0);
    const deskWarm = new THREE.PointLight(0xffb363, .4, 6, 1.6); deskWarm.position.set(.3, 1.8, .1);
    const paintingLight = new THREE.SpotLight(0xffd8ad, 1.2, 8, .55, .7, 1.2); paintingLight.position.set(-1.8, 3.4, 1.1); paintingLight.target.position.set(-1.6, 1.4, -.9);
    scene.add(hemi, ambient, sun, sun.target, windowFill, windowFill.target, deskWarm, paintingLight, paintingLight.target);

    const landscape = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), new THREE.MeshBasicMaterial({ map: makeBackdrop(), fog: false })); landscape.position.set(0, 3, -7.5); scene.add(landscape);
    let model: THREE.Group | null = null, interactables: THREE.Object3D[] = [], auto = false, elapsed = 0;
    const setPreset = (key: View, immediate = false) => {
      const preset = VIEWS[key]; setView(key);
      if (immediate) { camera.position.set(...preset.position); controls.target.set(...preset.target); controls.update(); return; }
      const startPos = camera.position.clone(), startTarget = controls.target.clone(), endPos = new THREE.Vector3(...preset.position), endTarget = new THREE.Vector3(...preset.target); let n = 0;
      const glide = () => { n = Math.min(1, n + .045); const e = 1 - Math.pow(1 - n, 3); camera.position.lerpVectors(startPos, endPos, e); controls.target.lerpVectors(startTarget, endTarget, e); controls.update(); if (n < 1) requestAnimationFrame(glide); }; glide();
    };
    const applyMode = (m: Mode) => {
      const l = LIGHTS[m]; setMode(m); (scene.background as THREE.Color).setHex(l.bg); (scene.fog as THREE.FogExp2).color.setHex(l.bg);
      hemi.intensity = l.hemi; ambient.intensity = l.ambient; sun.color.setHex(l.sunColor); sun.intensity = l.sun; renderer.toneMappingExposure = l.exposure;
      windowFill.color.setHex(m === 'day' ? 0xd8ebff : m === 'sunset' ? 0xffb171 : 0x607ab3); windowFill.intensity = m === 'day' ? 5.5 : m === 'sunset' ? 4.2 : .8;
      deskWarm.intensity = m === 'night' ? 6.5 : m === 'sunset' ? 1.5 : .4; paintingLight.intensity = m === 'night' ? 5 : m === 'sunset' ? 2 : 1.2;
      (landscape.material as THREE.MeshBasicMaterial).color.setHex(m === 'day' ? 0xffffff : m === 'sunset' ? 0xeaa078 : 0x1c2945);
    };

    const publicBase = import.meta.env.BASE_URL || '/';
    new GLTFLoader().load(`${publicBase}models/Clos-Luce-Leonardo-Atelier.glb`, (gltf) => {
      model = gltf.scene; scene.add(model);
      const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(); let meshes = 0, nodes = 0;
      const named: Record<string, { name: string; position: number[]; size: number[] }> = {};
      model.traverse((obj) => {
        nodes++;
        if (obj.name) {
          const lower = obj.name.toLowerCase();
          if (['architecture','timber','ceiling','window','fireplace','painting','desk','workbench','shelves','barrier','mannequin','garment'].some((n) => lower.includes(n))) {
            const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3()), p = b.getCenter(new THREE.Vector3()); named[obj.name] = { name: obj.name, position: p.toArray(), size: s.toArray() };
          }
        }
        if ((obj as THREE.Mesh).isMesh) {
          meshes++; const mesh = obj as THREE.Mesh; mesh.castShadow = meshes % 5 === 0; mesh.receiveShadow = true;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat) => { materials.add(mat); Object.values(mat).forEach((v) => { if (v && (v as THREE.Texture).isTexture) textures.add(v as THREE.Texture); }); });
          if (obj.name.toLowerCase().includes('painting') || obj.parent?.name.toLowerCase().includes('painting')) interactables.push(obj);
        }
      });
      const bbox = new THREE.Box3().setFromObject(model), size = bbox.getSize(new THREE.Vector3()), center = bbox.getCenter(new THREE.Vector3());
      const runtimeReport = { bbox: { min: bbox.min.toArray(), max: bbox.max.toArray(), size: size.toArray(), center: center.toArray() }, meshes, materials: materials.size, textures: textures.size, nodes, topLevel: model.children.map((c) => c.name), named, extensionsUsed: gltf.parser.json.extensionsUsed ?? [], extensionsRequired: gltf.parser.json.extensionsRequired ?? [] };
      console.info('[Atelier V3 GLB report]', JSON.stringify(runtimeReport)); (window as any).__atelierReport = runtimeReport;
      setDebugReport(JSON.stringify(runtimeReport));
      setReport({ meshes, materials: materials.size, textures: textures.size, nodes }); setProgress(100); setReady(true);
      const requested = new URLSearchParams(location.search).get('view') as View | null; setPreset(requested && VIEWS[requested] ? requested : 'overview', true);
      const hash = location.hash.slice(1) as Mode; if (LIGHTS[hash]) applyMode(hash);
    }, (event) => { if (event.total) setProgress(Math.round(event.loaded / event.total * 100)); }, (err) => { console.error(err); setError('模型加载失败，请检查 GLB 文件。'); });

    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
    const dblclick = (e: MouseEvent) => { if (!model) return; const r = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX-r.left)/r.width*2-1, -(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(pointer, camera); const hits = ray.intersectObjects(interactables.length ? interactables : model.children, true); if (hits.length) { setPreset('painting'); setDetails(true); } };
    renderer.domElement.addEventListener('dblclick', dblclick);
    api.current = { applyMode, setPreset, setAuto: (v: boolean) => auto = v, reset: () => setPreset('overview'), download: () => { renderer.render(scene, camera); const a = document.createElement('a'); a.download = `atelier-v3-${mode}.png`; a.href = renderer.domElement.toDataURL('image/png'); a.click(); } };
    const clock = new THREE.Clock(); let raf = 0;
    const animate = () => { raf = requestAnimationFrame(animate); const dt = clock.getDelta(); elapsed += dt; if (auto) { const a = elapsed * .13; camera.position.set(Math.cos(a)*5.4, 1.7 + Math.sin(a*.5)*.12, Math.sin(a)*4.7); controls.target.set(0, 1.35, 0); } controls.update(); renderer.render(scene, camera); }; animate();
    const resize = () => { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); }; window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); renderer.domElement.removeEventListener('dblclick', dblclick); controls.dispose(); renderer.dispose(); host.removeChild(renderer.domElement); };
  }, []);

  const chooseMode = (m: Mode) => api.current?.applyMode(m);
  return <main className="experience v3">
    <div ref={mount} className="viewport" />
    <header className="masthead"><div className="seal">L</div><div><p>MEET THE MASTER · V3 GLB</p><h1>遇见画家 <span>/</span> 克洛·吕斯画室</h1></div></header>
    {!ready && !error && <div className="loading"><div className="loader"/><span>正在加载画室资产… {progress}%</span></div>}
    {error && <div className="loading"><strong>{error}</strong></div>}
    {ready && <div className="asset-status"><i/>{report.meshes} MESHES · {report.materials} MATERIALS · {report.textures} TEXTURES</div>}
    <output id="atelier-runtime-report" hidden>{debugReport}</output>
    <div className="view-presets">{(Object.keys(VIEWS) as View[]).map((v) => <button aria-label={VIEWS[v].label} className={view===v?'active':''} key={v} onClick={() => api.current?.setPreset(v)}>{VIEWS[v].label}</button>)}</div>
    <nav className="controls"><div className="mode-group">{(['day','sunset','night'] as Mode[]).map((m,i)=>{const I=[Sun,Sunset,Moon][i];return <button aria-label={`切换至${LIGHTS[m].label}`} className={mode===m?'active':''} key={m} onClick={()=>chooseMode(m)}><I size={17}/><span>{LIGHTS[m].label}</span></button>})}</div><i/><button aria-label={tour?'停止自动漫游':'开始自动漫游'} className={tour?'active':''} onClick={()=>setTour(v=>{api.current?.setAuto(!v);return !v})}><Sparkles size={17}/><span>{tour?'停止漫游':'自动漫游'}</span></button><button aria-label="重置视角" onClick={()=>api.current?.reset()}><RotateCcw size={17}/><span>重置视角</span></button><button aria-label="导出截图" onClick={()=>api.current?.download()}><Download size={17}/><span>导出</span></button></nav>
    {details && <aside className="art-panel"><button className="close" onClick={()=>setDetails(false)}>×</button><p className="eyebrow">ORIGINAL GLB DISPLAY</p><h2>绘画角</h2><h3>Clos Lucé Atelier</h3><p>此视角直接使用 GLB 中的绘画区域、原始材质与家具布置。第一阶段尚未隐藏或改造原模型对象。</p><button className="view-close" onClick={()=>setDetails(false)}><Eye size={14}/>返回画室</button></aside>}
  </main>;
}
