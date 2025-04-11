import * as THREE from 'three';
import { Position, TeleportEffect } from '../types';
import { CubeController } from './CubeController';

export class TeleportController {
  private readonly scene: THREE.Scene;
  private readonly cellSize: number;
  private readonly boardSize: { width: number; height: number };
  private readonly effects: TeleportEffect[] = [];
  private readonly teleportHeight = 10;
  private readonly animationDuration = 60;
  private readonly particleCount = 50;
  private readonly effectColor = 0x00ffff;
  private readonly effectMaxLifetime = 60;

  constructor(scene: THREE.Scene, boardSize: { width: number; height: number }, cellSize: number) {
    this.scene = scene;
    this.boardSize = boardSize;
    this.cellSize = cellSize;
  }

  public animateTeleport(cube: CubeController, newPosition: Position): void {
    if (!cube.mesh) return;

    cube.teleporting = true;
    const { currentWorldX, currentWorldZ } = this.getCurrentWorldPositions(cube);
    const { targetWorldX, targetWorldZ } = this.getTargetWorldPositions(newPosition);
    const initialRotation = this.getInitialRotation(cube.mesh);

    this.createTeleportEffect(currentWorldX, this.cellSize / 2, currentWorldZ, this.effectColor);

    this.startTeleportAnimation(
      cube,
      currentWorldX,
      currentWorldZ,
      targetWorldX,
      targetWorldZ,
      initialRotation
    );
  }

  public updateTeleportEffects(): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.lifetime++;

      if (effect.lifetime >= this.effectMaxLifetime) {
        this.removeEffect(effect, i);
        continue;
      }

      this.updateEffectParticles(effect);
    }
  }

  private getCurrentWorldPositions(cube: CubeController) {
    return {
      currentWorldX: cube.mesh!.position.x,
      currentWorldZ: cube.mesh!.position.z
    };
  }

  private getTargetWorldPositions(newPosition: Position) {
    return {
      targetWorldX: newPosition.x * this.cellSize - (this.boardSize.width * this.cellSize) / 2 + this.cellSize / 2,
      targetWorldZ: newPosition.y * this.cellSize - (this.boardSize.height * this.cellSize) / 2 + this.cellSize / 2
    };
  }

  private getInitialRotation(mesh: THREE.Object3D) {
    return {
      x: mesh.rotation.x,
      y: mesh.rotation.y,
      z: mesh.rotation.z
    };
  }

  private startTeleportAnimation(
    cube: CubeController,
    currentWorldX: number,
    currentWorldZ: number,
    targetWorldX: number,
    targetWorldZ: number,
    initialRotation: { x: number; y: number; z: number }
  ) {
    let frame = 0;

    const animate = () => {
      if (!cube.mesh || frame >= this.animationDuration) {
        this.finalizeTeleport(cube, targetWorldX, targetWorldZ);
        return;
      }

      const progress = frame / this.animationDuration;
      this.updateCubePositionAndRotation(
        cube,
        progress,
        currentWorldX,
        currentWorldZ,
        targetWorldX,
        targetWorldZ,
        initialRotation
      );

      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }

  private updateCubePositionAndRotation(
    cube: CubeController,
    progress: number,
    currentWorldX: number,
    currentWorldZ: number,
    targetWorldX: number,
    targetWorldZ: number,
    initialRotation: { x: number; y: number; z: number }
  ) {
    if (progress < 0.5) {
      this.handleAscentPhase(cube, progress, initialRotation);
    } else {
      this.handleDescentPhase(
        cube,
        progress,
        currentWorldX,
        currentWorldZ,
        targetWorldX,
        targetWorldZ,
        initialRotation
      );
    }
  }

  private handleAscentPhase(
    cube: CubeController,
    progress: number,
    initialRotation: { x: number; y: number; z: number }
  ) {
    const upProgress = progress * 2;
    const heightFactor = Math.sin((upProgress * Math.PI) / 2);
    cube.mesh!.position.y = this.cellSize / 2 + this.teleportHeight * heightFactor;
    
    cube.mesh!.rotation.x = initialRotation.x + upProgress * Math.PI * 2;
    cube.mesh!.rotation.y = initialRotation.y + upProgress * Math.PI * 4;
    cube.mesh!.rotation.z = initialRotation.z + upProgress * Math.PI * 2;
  }

  private handleDescentPhase(
    cube: CubeController,
    progress: number,
    currentWorldX: number,
    currentWorldZ: number,
    targetWorldX: number,
    targetWorldZ: number,
    initialRotation: { x: number; y: number; z: number }
  ) {
    const downProgress = (progress - 0.5) * 2;
    const heightFactor = Math.cos((downProgress * Math.PI) / 2);
    const currentHeight = this.cellSize / 2 + this.teleportHeight * heightFactor;

    const currentX = currentWorldX + (targetWorldX - currentWorldX) * downProgress;
    const currentZ = currentWorldZ + (targetWorldZ - currentWorldZ) * downProgress;

    cube.mesh!.position.set(currentX, currentHeight, currentZ);

    const rotationSlowdown = 1 + downProgress;
    cube.mesh!.rotation.x = initialRotation.x + rotationSlowdown * Math.PI * 2;
    cube.mesh!.rotation.y = initialRotation.y + rotationSlowdown * Math.PI * 4;
    cube.mesh!.rotation.z = initialRotation.z + rotationSlowdown * Math.PI * 2;
  }

  private finalizeTeleport(cube: CubeController, targetWorldX: number, targetWorldZ: number) {
    cube.reset({
      x: Math.round((targetWorldX + (this.boardSize.width * this.cellSize) / 2 - this.cellSize / 2) / this.cellSize),
      y: Math.round((targetWorldZ + (this.boardSize.height * this.cellSize) / 2 - this.cellSize / 2) / this.cellSize)
    });

    cube.mesh!.position.set(targetWorldX, this.cellSize / 2, targetWorldZ);
    cube.teleporting = false;
    this.createTeleportEffect(targetWorldX, this.cellSize / 2, targetWorldZ, this.effectColor);
  }

  private createTeleportEffect(x: number, y: number, z: number, color: number): void {
    const { particleGeometry, velocities } = this.createParticleGeometry(x, y, z);
    const particleMaterial = this.createParticleMaterial(color);
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    
    this.scene.add(particles);

    this.effects.push({
      particles,
      positions: particleGeometry.attributes.position.array as Float32Array,
      velocities,
      lifetime: 0,
      maxLifetime: this.effectMaxLifetime
    });
  }

  private createParticleGeometry(x: number, y: number, z: number) {
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = [];
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;

      positions[i * 3] = x + Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z + Math.sin(angle) * radius;

      velocities.push({
        x: (Math.random() - 0.5) * 0.2,
        y: Math.random() * 0.2 + 0.1,
        z: (Math.random() - 0.5) * 0.2,
      });

      sizes[i] = Math.random() * 0.2 + 0.1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return { particleGeometry, velocities };
  }

  private createParticleMaterial(color: number) {
    return new THREE.PointsMaterial({
      color,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
  }

  private removeEffect(effect: TeleportEffect, index: number) {
    this.scene.remove(effect.particles);
    this.effects.splice(index, 1);
  }

  private updateEffectParticles(effect: TeleportEffect) {
    const fadeOutFactor = 1 - effect.lifetime / effect.maxLifetime;
    const positions = effect.positions;

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