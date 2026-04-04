  const canvas = document.getElementById('cvs');
  const wrap = document.getElementById('wrap');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 60, 110);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 200);
  camera.position.set(0, 1.1, 18.8);
  camera.lookAt(0, 1.5, 0);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 100);

  /* Lighting */
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(8, 15, 10);
  sun.castShadow = true;
  scene.add(sun);

  /* Field */
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshLambertMaterial({ color: 0x3a7d3a })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  const dirt = new THREE.Mesh(
    new THREE.CircleGeometry(9, 48),
    new THREE.MeshLambertMaterial({ color: 0x9e6b3a })
  );
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.set(0, 0.005, 0);
  scene.add(dirt);

  const basePath = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 18.44),
    new THREE.MeshLambertMaterial({ color: 0x7a5228 })
  );
  basePath.rotation.x = -Math.PI / 2;
  basePath.position.set(0, 0.006, 9.22);
  scene.add(basePath);

  const mound = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 2.4, 0.25, 32),
    new THREE.MeshLambertMaterial({ color: 0x9e6b3a })
  );
  mound.position.set(0, 0.12, 0);
  mound.receiveShadow = true;
  scene.add(mound);

  const rubber = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.15),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  rubber.position.set(0, 0.26, 0);
  scene.add(rubber);

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.43, 0.02, 0.3),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  plate.position.set(0, 0.01, 18.44);
  scene.add(plate);

  /* Strike zone */
/* Updated Strike Zone: 3x3 Grid */
/* Accurate 3x3 Strike Zone Grid */
/* Accurate 3x3 Strike Zone Grid */
(function makeStrikeZone() {
  const w = 0.435;      // Width of home plate (meters)
  const bot = 0.50;     // Approx. height of knees
  const top = 1.10;     // Approx. height of mid-torso
  const h = top - bot;
  const zz = 18.44;     // Front edge of home plate

  const mat = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.6 
  });

  const points = [];

  // Outer Border
  points.push(new THREE.Vector3(-w/2, bot, zz), new THREE.Vector3(w/2, bot, zz));
  points.push(new THREE.Vector3(w/2, bot, zz), new THREE.Vector3(w/2, top, zz));
  points.push(new THREE.Vector3(w/2, top, zz), new THREE.Vector3(-w/2, top, zz));
  points.push(new THREE.Vector3(-w/2, top, zz), new THREE.Vector3(-w/2, bot, zz));

  // Vertical Grid Lines (Dividing width into thirds)
  points.push(new THREE.Vector3(-w/6, bot, zz), new THREE.Vector3(-w/6, top, zz));
  points.push(new THREE.Vector3(w/6, bot, zz), new THREE.Vector3(w/6, top, zz));

  // Horizontal Grid Lines (Dividing height into thirds)
  points.push(new THREE.Vector3(-w/2, bot + h/3, zz), new THREE.Vector3(w/2, bot + h/3, zz));
  points.push(new THREE.Vector3(-w/2, bot + 2*h/3, zz), new THREE.Vector3(w/2, bot + 2*h/3, zz));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const strikeZoneGrid = new THREE.LineSegments(geometry, mat);
  scene.add(strikeZoneGrid);
})();

  /* Pitcher figure */
  (function makePitcher() {
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a4a7a });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd4956a });
    const hatMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a3a });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 10), bodyMat);
    body.position.set(0, 0.71, 0.3);
    scene.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinMat);
    head.position.set(0, 1.4, 0.3);
    scene.add(head);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.14, 10), hatMat);
    hat.position.set(0, 1.52, 0.3);
    scene.add(hat);
  })();

  /* Baseball factory */
  function makeBaseball() {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.037, 20, 20),
      new THREE.MeshPhongMaterial({ color: 0xf5f5e8, shininess: 60 })
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

  /* Physics constants */
  const G        = 9.81;
  const mph2ms   = 0.44704;
  const DIST     = 18.44;

  /*
   * Aerodynamic drag function F(v) for a baseball.
   * Source: Giordano, "Computational Physics" (fitted to experimental data).
   * Returns drag coefficient such that deceleration = F(v) * v * v_component
   */
  function F(v) {
    const B0 = 0.0039, delta = 0.0058, vd = 35.0, vl = 0.1;
    return B0 / (1 + Math.exp((v - vd) / vl)) + delta;
  }

  /*
   * Lateral force function G(phi) for a knuckleball.
   * Source: Watts & Sawyer wind-tunnel data, fitted by Giordano.
   * Eq (57): f_y / (m*g) = 0.5 * [sin(4φ) - 0.25*sin(8φ) + 0.08*sin(12φ) - 0.025*sin(16φ)]
   */
  function G_phi(phi) {
    return 0.5 * (
      Math.sin(4  * phi) -
      0.25 * Math.sin(8  * phi) +
      0.08 * Math.sin(12 * phi) -
      0.025 * Math.sin(16 * phi)
    );
  }

  /*
   * Integrate the knuckleball ODEs using 4th-order Runge-Kutta.
   *
   * State vector: [x, y, z, vx, vy, vz, phi]
   *   x  = distance toward hitter (m)
   *   y  = lateral displacement (m, +y = hitter's right)
   *   z  = vertical displacement (m, +z = up)
   *   phi = angular orientation of ball (rad)
   *
   * Equations of motion (node45, eqs 58-64):
   *   dx/dt  = vx
   *   dy/dt  = vy
   *   dz/dt  = vz
   *   dvx/dt = -F(v)*v*vx
   *   dvy/dt = -F(v)*v*vy + g*G(phi)   <- lateral knuckleball force
   *   dvz/dt = -g - F(v)*v*vz
   *   dphi/dt = omega
   *
   * Initial conditions (eqs 65-71):
   *   x=y=z=0, vx=v0*cos(theta), vy=0, vz=v0*sin(theta), phi=phi0
   */
  function runRK4(v0_mph, theta_deg, omega_rpm, phi0_deg) {
    const v0    = v0_mph   * mph2ms;
    const theta = theta_deg * Math.PI / 180;
    const omega = omega_rpm  * (2 * Math.PI / 60);
    const phi0  = phi0_deg   * Math.PI / 180;
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
        -Fv * v * vy + G * Gp,
        -G - Fv * v * vz,
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

  /* Convert simulation coords [x=forward, y=lateral, z=up]
     to Three.js scene coords  [X=lateral, Y=up, Z=forward] */
  function simToScene(sx, sy, sz) {
    return new THREE.Vector3(sy, sz, sx);
  }

  /* Scene state */
  let ball      = null;
  let trailLine = null;
  let animId    = null;

  function clearScene() {
    if (ball)      { scene.remove(ball);      ball      = null; }
    if (trailLine) { scene.remove(trailLine); trailLine = null; }
    if (animId)    { cancelAnimationFrame(animId); animId = null; }
  }

  function throwPitch() {
    clearScene();
    document.getElementById('status').textContent = 'Simulating\u2026';

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
      new THREE.LineBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.75 })
    );
    scene.add(trailLine);

    const step = Math.max(1, Math.floor(positions.length / 320));
    let idx = 0;

    document.getElementById('status').textContent = 'In flight\u2026';

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

  /* Slider bindings */
  function bindSlider(id, dispId, fmt) {
    document.getElementById(id).addEventListener('input', function() {
      document.getElementById(dispId).textContent = fmt(parseFloat(this.value));
    });
  }
  bindSlider('s_v0',    'd_v0',    v => v);
  bindSlider('s_theta', 'd_theta', v => v.toFixed(1) + '\u00b0');
  bindSlider('s_omega', 'd_omega', v => v);
  bindSlider('s_phi0',  'd_phi0',  v => v.toFixed(1) + '\u00b0');

  /* Render loop */
  (function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  })();