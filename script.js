const canvas = document.getElementById('cvs');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.FogExp2(0x0a0a12, 0.018);

// --- CAMERA: Catcher's POV — low, behind plate, looking toward pitcher ---
const camera = new THREE.PerspectiveCamera(62, 1, 0.01, 200);
camera.position.set(0, 1.05, 19.8);   // behind the plate, catcher height
camera.lookAt(0, 1.3, 0);             // looking toward mound

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
setTimeout(resize, 100);

// ── LIGHTING: stadium night game ──────────────────────────────────────────
// Dim ambient
scene.add(new THREE.AmbientLight(0x1a1a2e, 1.2));

// Main stadium floods — warm orange-amber (like the image)
function addFlood(x, y, z, color, intensity) {
  const light = new THREE.SpotLight(color, intensity, 80, Math.PI / 5, 0.5, 1.5);
  light.position.set(x, y, z);
  light.target.position.set(0, 0, 9);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  scene.add(light);
  scene.add(light.target);
}
addFlood(-18, 22, -5,  0xffaa44, 2.2);
addFlood( 18, 22, -5,  0xffbb55, 2.0);
addFlood(-14, 18, 22,  0xff9933, 1.6);
addFlood( 14, 18, 22,  0xffaa44, 1.4);
addFlood(  0, 20, -12, 0xffcc66, 1.0);

// Fill light from behind camera (catcher side)
const fill = new THREE.PointLight(0x334466, 0.8, 30);
fill.position.set(0, 4, 22);
scene.add(fill);

// ── FIELD ────────────────────────────────────────────────────────────────
// Grass — dark green, night game
const grass = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: 0x1a3d1a })
);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

// Infield dirt
const dirt = new THREE.Mesh(
  new THREE.CircleGeometry(28, 64),
  new THREE.MeshLambertMaterial({ color: 0x6b4226 })
);
dirt.rotation.x = -Math.PI / 2;
dirt.position.set(0, 0.005, 0);
scene.add(dirt);

// Pitcher's mound area
const moundBase = new THREE.Mesh(
  new THREE.CircleGeometry(3.5, 48),
  new THREE.MeshLambertMaterial({ color: 0x7a4f2d })
);
moundBase.rotation.x = -Math.PI / 2;
moundBase.position.set(0, 0.006, 0);
scene.add(moundBase);

const mound = new THREE.Mesh(
  new THREE.CylinderGeometry(1.8, 2.6, 0.28, 32),
  new THREE.MeshLambertMaterial({ color: 0x7a4f2d })
);
mound.position.set(0, 0.14, 0);
mound.receiveShadow = true;
mound.castShadow = true;
scene.add(mound);

const rubber = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.06, 0.15),
  new THREE.MeshLambertMaterial({ color: 0xeeeeee })
);
rubber.position.set(0, 0.285, 0);
scene.add(rubber);

// Home plate (visible close to camera)
const plate = new THREE.Mesh(
  new THREE.BoxGeometry(0.43, 0.025, 0.3),
  new THREE.MeshLambertMaterial({ color: 0xfafafa })
);
plate.position.set(0, 0.013, 18.44);
scene.add(plate);

// Batters boxes (chalk lines)
function chalkRect(x, z, w, d) {
  const pts = [
    new THREE.Vector3(x - w/2, 0.015, z - d/2),
    new THREE.Vector3(x + w/2, 0.015, z - d/2),
    new THREE.Vector3(x + w/2, 0.015, z + d/2),
    new THREE.Vector3(x - w/2, 0.015, z + d/2),
    new THREE.Vector3(x - w/2, 0.015, z - d/2),
  ];
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Line(g, m));
}
chalkRect(-0.76, 18.44, 0.9, 1.82);
chalkRect( 0.76, 18.44, 0.9, 1.82);

// Foul lines
function foulLine(angle) {
  const pts = [new THREE.Vector3(0, 0.01, 18.44)];
  const r = 55;
  pts.push(new THREE.Vector3(Math.sin(angle) * r, 0.01, 18.44 - Math.cos(angle) * r));
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.35 })));
}
foulLine(-0.7); foulLine(0.7);

// ── STADIUM STANDS (simplified geometry for atmosphere) ──────────────────
function addStands(startAngle, endAngle, segments, color, emissive) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const r1 = 30, r2 = 52, height = 12;
  for (let i = 0; i <= segments; i++) {
    const a = startAngle + (endAngle - startAngle) * i / segments;
    shape.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
  }
  for (let i = segments; i >= 0; i--) {
    const a = startAngle + (endAngle - startAngle) * i / segments;
    shape.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
  }
  shape.closePath();

  const extrudeSettings = { depth: height, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mat = new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: 0.15 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.position.z = 0;
  scene.add(mesh);
}

// Main stands sweeping around behind the pitcher (the crowd we're looking toward)
addStands(Math.PI + 0.8, Math.PI * 2 - 0.8, 32, 0x1a1520, 0x221a10);

// Side stands visible in periphery
addStands(-0.8, 0.8, 16, 0x181420, 0x1a1408);

// Crowd texture — rows of tiny colored points to simulate fans
(function addCrowd() {
  const positions = [];
  const colors = [];
  const crowdColors = [
    [1.0, 0.6, 0.1], [0.9, 0.2, 0.1], [0.2, 0.3, 0.8],
    [0.8, 0.8, 0.8], [0.15, 0.15, 0.15], [0.9, 0.7, 0.2],
    [0.5, 0.1, 0.1], [0.3, 0.5, 0.3]
  ];
  const rand = (min, max) => min + Math.random() * (max - min);

  for (let i = 0; i < 3000; i++) {
    const angle = rand(Math.PI * 0.55, Math.PI * 1.45);
    const r = rand(31, 50);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = rand(1, 10);
    positions.push(x, y, z);
    const c = crowdColors[Math.floor(Math.random() * crowdColors.length)];
    colors.push(c[0], c[1], c[2]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.28, vertexColors: true, sizeAttenuation: true });
  scene.add(new THREE.Points(geo, mat));
})();

// Scoreboard / screen glow behind pitcher
(function addScoreboard() {
  // Big screen top-center
  const screenGeo = new THREE.PlaneGeometry(12, 6);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x1a2a3a, side: THREE.DoubleSide });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 16, -32);
  scene.add(screen);

  // Glow from screen
  const screenLight = new THREE.PointLight(0x2244aa, 1.5, 25);
  screenLight.position.set(0, 14, -30);
  scene.add(screenLight);

  // Scoreboard frame
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(13, 7, 0.4), frameMat);
  frame.position.set(0, 16, -32.3);
  scene.add(frame);
})();

// Stadium light towers (behind camera sides, casting down)
function lightTower(x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 20, 6),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  pole.position.set(x, 10, z);
  scene.add(pole);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, 1),
    new THREE.MeshLambertMaterial({ color: 0x222222, emissive: 0xffaa44, emissiveIntensity: 0.5 })
  );
  head.position.set(x, 20.5, z);
  scene.add(head);
}
lightTower(-22, 18); lightTower(22, 18);
lightTower(-18, -10); lightTower(18, -10);

// ── PITCHER — improved articulated figure in wind-up ────────────────────
(function makePitcher() {
  const JERSEY = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });   // white home jersey
  const PANTS  = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
  const SKIN   = new THREE.MeshLambertMaterial({ color: 0xc8845a });
  const HAT    = new THREE.MeshLambertMaterial({ color: 0x111122 });
  const CLEAT  = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const GLOVE  = new THREE.MeshLambertMaterial({ color: 0x4a2800 });

  const root = new THREE.Group();
  root.position.set(0, 0.28, 0.25); // on the mound

  // Torso — slight forward lean toward plate
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.85, 12), JERSEY);
  torso.position.set(0, 0.77, 0);
  torso.rotation.x = 0.18; // lean forward
  root.add(torso);

  // Hips / belt area
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.18, 0.22, 10), PANTS);
  hips.position.set(0, 0.35, 0.02);
  root.add(hips);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 14), SKIN);
  head.position.set(0, 1.47, -0.05);
  head.scale.set(1, 1.05, 1);
  root.add(head);

  // Hat brim & crown
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.145, 0.17, 10), HAT);
  hatCrown.position.set(0, 1.60, -0.05);
  root.add(hatCrown);
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16), HAT);
  hatBrim.position.set(0, 1.505, 0.04);
  root.add(hatBrim);

  // Left leg — stride leg, extended forward toward plate
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.85, 8), PANTS);
  legL.position.set(-0.13, -0.04, 0.26); // forward stride
  legL.rotation.x = -0.55;
  root.add(legL);

  const cleatL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.28), CLEAT);
  cleatL.position.set(-0.13, -0.4, 0.55);
  root.add(cleatL);

  // Right leg — pivot leg, planted on rubber
  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.85, 8), PANTS);
  legR.position.set(0.13, -0.07, -0.05);
  legR.rotation.x = 0.2;
  root.add(legR);

  const cleatR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.26), CLEAT);
  cleatR.position.set(0.13, -0.45, 0.02);
  root.add(cleatR);

  // Throwing arm — raised, ball release position
  const armThrow = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.68, 8), JERSEY);
  armThrow.position.set(-0.28, 1.05, -0.1);
  armThrow.rotation.z = 0.4;
  armThrow.rotation.x = -0.6;
  root.add(armThrow);

  // Glove arm — out in front, balanced
  const armGlove = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.65, 8), JERSEY);
  armGlove.position.set(0.28, 0.95, 0.15);
  armGlove.rotation.z = -0.5;
  armGlove.rotation.x = 0.35;
  root.add(armGlove);

  // Glove
  const glove = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), GLOVE);
  glove.scale.set(1.2, 0.7, 1);
  glove.position.set(0.48, 0.82, 0.32);
  root.add(glove);

  // Jersey number / stripe detail — small colored band
  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.195, 0.012, 6, 20, Math.PI * 1.6),
    new THREE.MeshLambertMaterial({ color: 0x1a2a6a })
  );
  stripe.position.set(0, 0.92, 0);
  stripe.rotation.x = Math.PI / 2;
  root.add(stripe);

  scene.add(root);
})();

// ── STRIKE ZONE (visible from catcher POV) ───────────────────────────────
(function makeStrikeZone() {
  const w = 0.435;
  const bot = 0.50, top = 1.10;
  const h = top - bot;
  const zz = 18.44;

  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const pts = [];

  // Outer box
  pts.push(new THREE.Vector3(-w/2, bot, zz), new THREE.Vector3( w/2, bot, zz));
  pts.push(new THREE.Vector3(-w/2, top, zz), new THREE.Vector3( w/2, top, zz));
  pts.push(new THREE.Vector3(-w/2, bot, zz), new THREE.Vector3(-w/2, top, zz));
  pts.push(new THREE.Vector3( w/2, bot, zz), new THREE.Vector3( w/2, top, zz));

  // Vertical dividers
  pts.push(new THREE.Vector3(-w/6, bot, zz), new THREE.Vector3(-w/6, top, zz));
  pts.push(new THREE.Vector3( w/6, bot, zz), new THREE.Vector3( w/6, top, zz));

  // Horizontal dividers
  pts.push(new THREE.Vector3(-w/2, bot + h/3,   zz), new THREE.Vector3(w/2, bot + h/3,   zz));
  pts.push(new THREE.Vector3(-w/2, bot + 2*h/3, zz), new THREE.Vector3(w/2, bot + 2*h/3, zz));

  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  scene.add(new THREE.LineSegments(geo, mat));
})();

// ── PHYSICS ───────────────────────────────────────────────────────────────
const G_GRAV = 9.81;
const mph2ms = 0.44704;
const DIST = 18.44;

function F(v) {
  const B0 = 0.0039, delta = 0.0058, vd = 35.0, vl = 0.1;
  return B0 / (1 + Math.exp((v - vd) / vl)) + delta;
}

function G_phi(phi) {
  return 0.5 * (
    Math.sin(4 * phi) -
    0.25 * Math.sin(8 * phi) +
    0.08 * Math.sin(12 * phi) -
    0.025 * Math.sin(16 * phi)
  );
}

function runRK4(v0_mph, theta_deg, omega_rpm, phi0_deg) {
  const v0    = v0_mph * mph2ms;
  const theta = theta_deg * Math.PI / 180;
  const omega = omega_rpm * (2 * Math.PI / 60);
  const phi0  = phi0_deg * Math.PI / 180;
  const h     = 1e-4;
  const T_est = DIST / v0;
  const dt    = h * T_est;

  let s = [0, 0, 0, v0 * Math.cos(theta), 0, v0 * Math.sin(theta), phi0];

  function deriv([x, y, z, vx, vy, vz, phi]) {
    const v  = Math.sqrt(vx*vx + vy*vy + vz*vz);
    const Fv = F(v);
    const Gp = G_phi(phi);
    return [
      vx, vy, vz,
      -Fv * v * vx,
      -Fv * v * vy + G_GRAV * Gp,
      -G_GRAV - Fv * v * vz,
      omega
    ];
  }

  function rk4Step(s, dt) {
    const k1 = deriv(s);
    const s2 = s.map((v, i) => v + 0.5 * dt * k1[i]);
    const k2 = deriv(s2);
    const s3 = s.map((v, i) => v + 0.5 * dt * k2[i]);
    const k3 = deriv(s3);
    const s4 = s.map((v, i) => v + dt * k3[i]);
    const k4 = deriv(s4);
    return s.map((v, i) => v + (dt / 6) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
  }

  const positions = [[...s]];
  let tTotal = 0;
  for (let i = 0; i < 20000; i++) {
    s = rk4Step(s, dt);
    tTotal += dt;
    positions.push([...s]);
    if (s[0] >= DIST) break;
  }
  return { positions, tTotal };
}

// sim coords: x=forward(toward plate), y=lateral, z=up
// scene coords from CATCHER'S POV: ball starts far (small z) comes toward camera (large z)
// so: scene.x = sim.y (lateral), scene.y = sim.z (up), scene.z = sim.x (forward, but inverted for catcher POV)
function simToScene(sx, sy, sz) {
  // Pitcher releases at sim.x=0 (z=0 in scene = mound), plate at sim.x=18.44 (z=18.44 in scene)
  return new THREE.Vector3(sy, sz, sx);
}

// Baseball mesh
function makeBaseball() {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.037, 20, 20),
    new THREE.MeshPhongMaterial({ color: 0xf8f6ee, shininess: 80 })
  );
  ball.castShadow = true;
  const seamMat = new THREE.LineBasicMaterial({ color: 0xcc2222 });
  for (let s = 0; s < 2; s++) {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * Math.PI * 2 + s * Math.PI;
      const r = 0.039;
      pts.push(new THREE.Vector3(r * Math.sin(t) * 0.5, r * Math.cos(t), r * Math.sin(t) * 0.87));
    }
    ball.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), seamMat));
  }
  return ball;
}

// ── ANIMATION STATE ───────────────────────────────────────────────────────
let ball = null, trailLine = null, animId = null;

function clearScene() {
  if (ball)      { scene.remove(ball);      ball      = null; }
  if (trailLine) { scene.remove(trailLine); trailLine = null; }
  if (animId)    { cancelAnimationFrame(animId); animId = null; }
}

function throwPitch() {
  clearScene();
  document.getElementById('status').textContent = 'Simulating…';

  const v0    = parseFloat(document.getElementById('s_v0').value);
  const theta = parseFloat(document.getElementById('s_theta').value);
  const omega = parseFloat(document.getElementById('s_omega').value);
  const phi0  = parseFloat(document.getElementById('s_phi0').value);

  const { positions, tTotal } = runRK4(v0, theta, omega, phi0);

  const last   = positions[positions.length - 1];
  const finalV = Math.sqrt(last[3]**2 + last[4]**2 + last[5]**2) / mph2ms;
  const dropZ  = positions[0][2] - last[2];
  const latY   = last[1];

  document.getElementById('st_x').textContent = (latY  * 39.37).toFixed(1) + '"';
  document.getElementById('st_z').textContent = (dropZ * 39.37).toFixed(1) + '"';
  document.getElementById('st_t').textContent = tTotal.toFixed(2) + 's';
  document.getElementById('st_v').textContent = finalV.toFixed(0) + ' mph';

  ball = makeBaseball();
  const p0 = simToScene(positions[0][0], positions[0][1], positions[0][2]);
  ball.position.copy(p0);
  scene.add(ball);

  const trailPts = [p0.clone()];
  trailLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(trailPts),
    new THREE.LineBasicMaterial({ color: 0xf5a623, transparent: true, opacity: 0.6 })
  );
  scene.add(trailLine);

  const step = Math.max(1, Math.floor(positions.length / 320));
  let idx = 0;

  document.getElementById('status').textContent = 'In flight…';

  function animStep() {
    if (idx >= positions.length) {
      document.getElementById('status').textContent = 'Pitch complete';
      return;
    }
    for (let k = 0; k < step && idx < positions.length; k++, idx++) {
      const pos = simToScene(positions[idx][0], positions[idx][1], positions[idx][2]);
      ball.position.copy(pos);
      ball.rotation.x += omega * 0.005;
      ball.rotation.z += omega * 0.003;
      trailPts.push(pos.clone());
    }
    trailLine.geometry.setFromPoints(trailPts);
    trailLine.geometry.attributes.position.needsUpdate = true;
    animId = requestAnimationFrame(animStep);
  }
  animId = requestAnimationFrame(animStep);
}

document.getElementById('throwBtn').addEventListener('click', throwPitch);

// Slider bindings
function bindSlider(id, dispId, fmt) {
  document.getElementById(id).addEventListener('input', function() {
    document.getElementById(dispId).textContent = fmt(parseFloat(this.value));
  });
}
bindSlider('s_v0',    'd_v0',    v => v);
bindSlider('s_theta', 'd_theta', v => v.toFixed(1) + '°');
bindSlider('s_omega', 'd_omega', v => v);
bindSlider('s_phi0',  'd_phi0',  v => v.toFixed(1) + '°');

// Render loop
(function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
})();