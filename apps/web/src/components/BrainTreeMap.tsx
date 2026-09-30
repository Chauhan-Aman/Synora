import React, { useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";

interface GraphNode {
  id: string;
  name: string;
  group: "artifact" | "topic" | "entity";
  details?: string;
  sourceUrl?: string;
}
interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}
interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
interface BrainTreeMapProps {
  graphData: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string;
  width?: number;
  height?: number;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const LEVEL_H  = 110;   
const BASE_R   = 120;   
const R_DECAY  = 0.4;  

function buildAdj(nodes: GraphNode[], links: GraphLink[]) {
  const adj = new Map<string, Set<string>>();
  nodes.forEach(n => adj.set(n.id, new Set()));
  links.forEach(l => {
    const s = typeof l.source === "string" ? l.source : l.source.id;
    const t = typeof l.target === "string" ? l.target : l.target.id;
    adj.get(s)?.add(t); adj.get(t)?.add(s);
  });
  return adj;
}

interface PNode { node: GraphNode; x: number; y: number; z: number; depth: number; childIds: string[]; parentId?: string; }

function layout(nodes: GraphNode[], links: GraphLink[]): Map<string, PNode> {
  if (!nodes.length) return new Map();
  const adj = buildAdj(nodes, links);
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const out = new Map<string, PNode>();

  const root = nodes
    .filter(n => n.group === "artifact")
    .sort((a, b) => (adj.get(b.id)?.size ?? 0) - (adj.get(a.id)?.size ?? 0))[0] ?? nodes[0];

  const visited = new Set<string>();
  const q: { id: string; depth: number; parentId?: string }[] = [{ id: root.id, depth: 0 }];
  while (q.length) {
    const { id, depth, parentId } = q.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const p: PNode = { node: nodeMap.get(id)!, x: 0, y: 0, z: 0, depth, childIds: [], parentId };
    out.set(id, p);
    if (parentId) out.get(parentId)?.childIds.push(id);
    for (const nId of adj.get(id) ?? []) {
      if (!visited.has(nId)) q.push({ id: nId, depth: depth + 1, parentId: id });
    }
  }
  // Orphan nodes placed in a ring
  let orphanIdx = 0;
  const orphanCount = nodes.filter(n => !visited.has(n.id)).length;
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      const ang = (orphanIdx / orphanCount) * Math.PI * 2;
      out.set(n.id, { 
        node: n, 
        x: (BASE_R * 2) * Math.cos(ang), 
        y: LEVEL_H, 
        z: (BASE_R * 2) * Math.sin(ang), 
        depth: 1, 
        childIds: [] 
      });
      orphanIdx++;
    }
  });

  function leaves(id: string): number {
    const p = out.get(id)!;
    return p.childIds.length === 0 ? 1 : p.childIds.reduce((a, c) => a + leaves(c), 0);
  }
  function place(id: string, a0: number, a1: number, d: number) {
    const p   = out.get(id)!;
    const ang = (a0 + a1) / 2;
    // Tree spreads outwards linearly, much tighter than a multiplicative factor
    let r = 0;
    if (d > 0) {
      r = BASE_R + (d - 1) * 45;
    }
    p.x = r * Math.cos(ang); p.z = r * Math.sin(ang); p.y = d * LEVEL_H;
    if (!p.childIds.length) return;
    const total = p.childIds.reduce((a, c) => a + leaves(c), 0);
    let ptr = a0;
    p.childIds.forEach(c => {
      const frac = leaves(c) / total;
      place(c, ptr, ptr + frac * (a1 - a0), d + 1);
      ptr += frac * (a1 - a0);
    });
  }
  place(root.id, 0, Math.PI * 2, 0);
  return out;
}

// ─── Colors & Sprites ────────────────────────────────────────────────────────

const COLORS: Record<string, { sphere: string; border: string }> = {
  artifact: { sphere: "#10b981", border: "#6ee7b7" },
  topic:    { sphere: "#8b5cf6", border: "#c4b5fd" },
  entity:   { sphere: "#3b82f6", border: "#93c5fd" },
};

function makeSprite(text: string, border: string): THREE.Sprite {
  const W = 512, H = 76;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(6,6,20,0.88)";
  ctx.beginPath(); ctx.roundRect(4, 4, W - 8, H - 8, 10); ctx.fill();
  ctx.strokeStyle = border; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(4, 4, W - 8, H - 8, 10); ctx.stroke();
  ctx.font = "600 24px Inter,sans-serif";
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const label = text.length > 30 ? text.slice(0, 28) + "…" : text;
  ctx.fillText(label, W / 2, H / 2);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0, depthWrite: false })
  );
  sprite.scale.set(32, 6, 1);
  return sprite;
}

// ─── Component ────────────────────────────────────────────────────────────────

const BrainTreeMap: React.FC<BrainTreeMapProps> = ({ graphData, onNodeClick, selectedNodeId, width = 800, height = 600 }) => {
  const mountRef  = useRef<HTMLDivElement>(null);
  const cleanRef  = useRef<(() => void) | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse     = useRef(new THREE.Vector2(-9999, -9999));
  
  // Use refs for props that change often so we don't rebuild the entire scene
  const selectedRef = useRef(selectedNodeId);
  const clickRef    = useRef(onNodeClick);
  useEffect(() => { selectedRef.current = selectedNodeId; }, [selectedNodeId]);
  useEffect(() => { clickRef.current = onNodeClick; }, [onNodeClick]);

  const positions = useMemo(() => layout(graphData.nodes, graphData.links), [graphData]);

  const build = useCallback(() => {
    const el = mountRef.current; if (!el) return;
    cleanRef.current?.();

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x050512, 0.0010);

    const maxD    = positions.size ? Math.max(...[...positions.values()].map(p => p.depth)) : 2;
    const treeH   = maxD * LEVEL_H;
    const defaultFocusY = treeH * 0.3;

    // Camera State
    const initR   = Math.max(500, BASE_R * 4.5);
    let theta = 0.3, phi = 0.62, radius = initR;
    let tTheta = theta, tPhi = phi, tRadius = initR;
    
    // Smooth Focus State
    const curFocus = new THREE.Vector3(0, defaultFocusY, 0);
    const tgtFocus = new THREE.Vector3(0, defaultFocusY, 0);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 8000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const dir = new THREE.DirectionalLight(0xa78bfa, 0.9); dir.position.set(80, 300, 80); scene.add(dir);
    const ptR = new THREE.PointLight(0xf59e0b, 3, 280); ptR.position.set(0, 0, 0); scene.add(ptR);
    const ptT = new THREE.PointLight(0x10b981, 1.2, 400); ptT.position.set(0, treeH, 0); scene.add(ptT);

    // Stars
    const sp = new Float32Array(3000); for (let i = 0; i < 3000; i++) sp[i] = (Math.random() - 0.5) * 3000;
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.18 })));

    // Ground ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(16, 60, 64),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.07, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = -1; scene.add(ring);

    const spheres = new Map<string, THREE.Mesh>();
    const labels  = new Map<string, THREE.Sprite>();
    const lines: THREE.Line[] = [];
    const parts:  THREE.Points[] = [];

    // ── Nodes ──
    [...positions.values()].forEach(({ node, x, y, z, depth }, idx) => {
      const c      = COLORS[node.group] ?? COLORS.entity;
      const isRoot = depth === 0;
      const col    = isRoot ? "#f59e0b" : c.sphere;
      const border = isRoot ? "#fcd34d" : c.border;
      const r      = isRoot ? 11 : Math.max(4.5, 8.5 - depth * 1.2);
      const delay  = idx * 0.055;
      const phase  = Math.random() * Math.PI * 2;

      const mat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(col), emissive: new THREE.Color(col),
        emissiveIntensity: isRoot ? 0.85 : 0.25, shininess: 100,
        transparent: true, opacity: 0,
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), mat);
      sphere.position.set(x, -30, z);
      sphere.userData = { node, targetY: y, delay, phase, r, isRoot };
      scene.add(sphere); spheres.set(node.id, sphere);

      sphere.add(new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.9, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 0, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
      ));

      const sp = makeSprite(node.name, border);
      sp.position.set(x, -30, z);
      sp.userData = { nodeId: node.id, isRoot, delay: delay + 0.4 };
      scene.add(sp); labels.set(node.id, sp);
    });

    // ── Edges ──
    graphData.links.forEach(l => {
      const si = typeof l.source === "string" ? l.source : l.source.id;
      const ti = typeof l.target === "string" ? l.target : l.target.id;
      const s = positions.get(si), t = positions.get(ti);
      if (!s || !t) return;
      const bx = (Math.random() - 0.5) * 30, bz = (Math.random() - 0.5) * 30;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(s.x, s.y, s.z),
        new THREE.Vector3((s.x + t.x) / 2 + bx, (s.y + t.y) / 2 + 15, (s.z + t.z) / 2 + bz),
        new THREE.Vector3(t.x, t.y, t.z)
      );
      const lGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
      const line = new THREE.Line(lGeo, new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      scene.add(line); lines.push(line);

      const pc = 7, pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pc * 3), 3));
      const part = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xa78bfa, size: 2.5, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      part.userData = { curve, t: Math.random(), speed: 0.0005 + Math.random() * 0.0007, count: pc };
      scene.add(part); parts.push(part);
    });

    // ── Animate ──
    let isDrag = false, lx = 0, ly = 0, animId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // Determine target focus based on selected node
      const selId = selectedRef.current;
      if (selId && spheres.has(selId)) {
        const selObj = spheres.get(selId)!;
        tgtFocus.set(selObj.position.x, selObj.userData.targetY, selObj.position.z);
        
        // If this is the first frame we're focusing, zoom in
        if (tRadius > 250 && !isDrag) {
            tRadius = 250;
        }
      } else {
        tgtFocus.set(0, defaultFocusY, 0);
      }
      
      // Smoothly interpolate focus point
      curFocus.lerp(tgtFocus, 0.05);

      // Camera smooth orbit + pan
      if (!isDrag && !selId) tTheta += 0.00038;
      theta  += (tTheta - theta)   * 0.06;
      phi    += (tPhi   - phi)     * 0.06;
      radius += (tRadius - radius) * 0.06;
      
      camera.position.set(
        curFocus.x + radius * Math.sin(phi) * Math.cos(theta),
        curFocus.y + radius * Math.cos(phi),
        curFocus.z + radius * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(curFocus);

      // Rise animation + bob
      spheres.forEach((sphere, nid) => {
        const ud = sphere.userData;
        const el = Math.max(0, t - ud.delay);
        const pg = Math.min(el / 1.4, 1);
        const ez = 1 - Math.pow(1 - pg, 3);
        (sphere.material as THREE.MeshPhongMaterial).opacity = ez * 0.95;
        sphere.position.y = pg < 1 ? -30 + ez * (ud.targetY + 30) : ud.targetY + Math.sin(t * 0.9 + ud.phase) * 2.2;

        const glow = sphere.children[0] as THREE.Mesh;
        if (glow) {
          const sel = nid === selId;
          (glow.material as THREE.MeshBasicMaterial).opacity = sel
            ? 0.30 + Math.sin(t * 4) * 0.12
            : ez * (0.06 + Math.sin(t * 1.6 + ud.phase) * 0.025);
          sphere.scale.setScalar(sel ? 1.22 + Math.sin(t * 3) * 0.07 : 1);
        }
      });

      // Labels follow spheres
      labels.forEach((sp, nid) => {
        const ud = sp.userData;
        const el = Math.max(0, t - ud.delay);
        const ez = Math.min(el / 0.9, 1);
        (sp.material as THREE.SpriteMaterial).opacity = ez * 0.92;
        const sphere = spheres.get(nid);
        if (sphere && ez > 0) {
          const r      = sphere.userData.r as number;
          const offset = ud.isRoot ? -(r + 11) : (r + 11);
          sp.position.set(sphere.position.x, sphere.position.y + offset, sphere.position.z);
        }
      });

      // Edge fade-in
      lines.forEach(l => { const m = l.material as THREE.LineBasicMaterial; if (m.opacity < 0.38) m.opacity = Math.min(m.opacity + 0.003, 0.38); });

      // Particles flow
      parts.forEach(p => {
        const ud = p.userData;
        const m  = p.material as THREE.PointsMaterial;
        if (m.opacity < 0.72) m.opacity = Math.min(m.opacity + 0.005, 0.72);
        ud.t = (ud.t + ud.speed) % 1;
        const attr = p.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < ud.count; i++) {
          const pt = (ud.curve as THREE.QuadraticBezierCurve3).getPoint((ud.t + i / ud.count) % 1);
          attr.setXYZ(i, pt.x, pt.y, pt.z);
        }
        attr.needsUpdate = true;
      });

      (ring.material as THREE.MeshBasicMaterial).opacity = 0.05 + Math.sin(t * 1.4) * 0.022;
      renderer.render(scene, camera);
    };
    tick();

    // ── Events ──
    const onDown = (e: PointerEvent) => {
      isDrag = true; lx = e.clientX; ly = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      mouse.current.x =  ((e.clientX - rect.left) / width)  * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top)  / height) * 2 + 1;
      if (!isDrag) return;
      tTheta -= (e.clientX - lx) * 0.005;
      tPhi   += (e.clientY - ly) * 0.005;
      tPhi    = Math.max(0.05, Math.min(Math.PI * 0.90, tPhi));
      lx = e.clientX; ly = e.clientY;
    };
    const onUp = () => {
      isDrag = false;
      raycaster.current.setFromCamera(mouse.current, camera);
      const hits = raycaster.current.intersectObjects([...spheres.values()]);
      if (hits.length) {
         clickRef.current?.(hits[0].object.userData.node as GraphNode);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      tRadius = Math.max(150, Math.min(1400, tRadius + e.deltaY * 0.6));
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup",   onUp);
    renderer.domElement.addEventListener("wheel",       onWheel, { passive: false });

    cleanRef.current = () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup",   onUp);
      renderer.domElement.removeEventListener("wheel",       onWheel);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  // Note: we removed selectedNodeId and onNodeClick from deps, they are tracked via refs!
  }, [graphData, width, height, positions]);

  useEffect(() => { build(); return () => cleanRef.current?.(); }, [build]);

  if (!graphData.nodes.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-synora-text-secondary gap-4">
        <div className="text-5xl">🌱</div>
        <p className="text-sm">Your knowledge tree will grow here</p>
        <p className="text-xs opacity-60">Add documents to start building your brain map</p>
      </div>
    );
  }

  return <div ref={mountRef} style={{ width, height, cursor: "grab" }} className="rounded-xl overflow-hidden select-none" />;
};

export default BrainTreeMap;
