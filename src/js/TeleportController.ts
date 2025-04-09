import * as THREE from 'three';
import {Position, TeleportEffect} from './types';
import {Cube} from './cube';

export class TeleportController {
  private scene: THREE.Scene;
  private cellSize: number;
  private boardSize: { width: number; height: number };
  private effects: TeleportEffect[] = [];

  constructor(scene: THREE.Scene, boardSize: { width: number; height: number }, cellSize: number) {
    this.scene = scene;
    this.boardSize = boardSize;
    this.cellSize = cellSize;
  }

  public animateTeleport(cube: Cube, newPosition: Position): void {
    if (!cube.mesh) return;
    
    cube.teleporting = true;

    const currentWorldX = cube.mesh.position.x;
    const currentWorldZ = cube.mesh.position.z;

    const targetWorldX = newPosition.x * this.cellSize - (this.boardSize.width * this.cellSize) / 2 + this.cellSize / 2;
    const targetWorldZ = newPosition.y * this.cellSize - (this.boardSize.height * this.cellSize) / 2 + this.cellSize / 2;

    const teleportHeight = 10;
    const animationDuration = 60;
    let frame = 0;

    const initialRotation = {
      x: cube.mesh.rotation.x,
      y: cube.mesh.rotation.y,
      z: cube.mesh.rotation.z
    };

    this.createTeleportEffect(currentWorldX, this.cellSize / 2, currentWorldZ, 0x00ffff);

    const updateTeleportAnimation = () => {
      if (!cube.mesh) return;
      
      if (frame >= animationDuration) {
        cube.reset(newPosition);

        cube.mesh.position.set(
          targetWorldX,
          this.cellSize / 2,
          targetWorldZ
        );

        cube.teleporting = false;
        this.createTeleportEffect(targetWorldX, this.cellSize / 2, targetWorldZ, 0x00ffff);
        return;
      }

      const progress = frame / animationDuration;

      if (progress < 0.5) {
        const upProgress = progress * 2;
        const heightFactor = Math.sin(upProgress * Math.PI / 2);
        cube.mesh.position.y = this.cellSize / 2 + teleportHeight * heightFactor;
        cube.mesh.rotation.x = initialRotation.x + upProgress * Math.PI * 2;
        cube.mesh.rotation.y = initialRotation.y + upProgress * Math.PI * 4;
        cube.mesh.rotation.z = initialRotation.z + upProgress * Math.PI * 2;
      } else {
        const downProgress = (progress - 0.5) * 2;
        const heightFactor = Math.cos(downProgress * Math.PI / 2);
        const currentHeight = this.cellSize / 2 + teleportHeight * heightFactor;

        const currentX = currentWorldX + (targetWorldX - currentWorldX) * downProgress;
        const currentZ = currentWorldZ + (targetWorldZ - currentWorldZ) * downProgress;

        cube.mesh.position.set(
          currentX,
          currentHeight,
          currentZ
        );

        const rotationSlowdown = 1 + downProgress;
        cube.mesh.rotation.x = initialRotation.x + (rotationSlowdown) * Math.PI * 2;
        cube.mesh.rotation.y = initialRotation.y + (rotationSlowdown) * Math.PI * 4;
        cube.mesh.rotation.z = initialRotation.z + (rotationSlowdown) * Math.PI * 2;
      }

      frame++;
      requestAnimationFrame(updateTeleportAnimation);
    };

    updateTeleportAnimation();
  }

  private createTeleportEffect(x: number, y: number, z: number, color: number): void {
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;

      positions[i * 3] = x + Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z + Math.sin(angle) * radius;

      velocities.push({
        x: (Math.random() - 0.5) * 0.2,
        y: Math.random() * 0.2 + 0.1,
        z: (Math.random() - 0.5) * 0.2
      });

      sizes[i] = Math.random() * 0.2 + 0.1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      color: color,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);

    const effect: TeleportEffect = {
      particles,
      positions,
      velocities,
      lifetime: 0,
      maxLifetime: 60
    };

    this.effects.push(effect);
  }

  public updateTeleportEffects(): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.lifetime++;

      if (effect.lifetime >= effect.maxLifetime) {
        this.scene.remove(effect.particles);
        this.effects.splice(i, 1);
        continue;
      }

      const fadeOutFactor = 1 - effect.lifetime / effect.maxLifetime;
      const positions = effect.particles.geometry.attributes.position.array;

      for (let j = 0; j < positions.length / 3; j++) {
        positions[j * 3] += effect.velocities[j].x;
        positions[j * 3 + 1] += effect.velocities[j].y;
        positions[j * 3 + 2] += effect.velocities[j].z;
        effect.velocities[j].y -= 0.01;
      }

      (effect.particles.material as THREE.PointsMaterial).opacity = fadeOutFactor * 0.8;
      effect.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
} 