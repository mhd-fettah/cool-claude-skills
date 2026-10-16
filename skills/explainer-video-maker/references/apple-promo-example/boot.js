import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
Object.assign(window, {THREE, Reflector, RoomEnvironment, RoundedBoxGeometry}); window.LOADING = [];
for (const f of ['timeline.js', 'lib.js', 'world.js', 'scenes.js', 'main.js'])
  await new Promise((ok, err) => { const s = document.createElement('script'); s.src = f; s.onload = ok; s.onerror = err; document.head.appendChild(s); });
