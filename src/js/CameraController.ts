import * as THREE from 'three';
import { CameraState, Direction } from './types';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private state: CameraState;
  private maxDimension = 0;

  constructor(camera: THREE.PerspectiveCamera, boardSize: { width: number; height: number }, cellSize: number) {
    this.camera = camera;
    this.maxDimension = Math.max(boardSize.width, boardSize.height) * cellSize;
    
    this.state = {
      angle: 225,
      targetAngle: 45,
      isAnimating: false,
      height: this.maxDimension * 1.5,
      distance: this.maxDimension * 2.5
    };
  }

  public updatePosition(): void {
    const angleRad = (this.state.angle * Math.PI) / 180;
    const x = Math.sin(angleRad) * this.state.distance;
    const z = Math.cos(angleRad) * this.state.distance;

    this.camera.position.set(x, this.state.height, z);
    this.camera.lookAt(0, -2, 0);
    this.camera.updateProjectionMatrix();
  }

  public animateRotation(): void {
    if (!this.state.isAnimating) return;

    let angleDiff = this.state.targetAngle - this.state.angle;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    const rotationSpeed = 5;
    if (Math.abs(angleDiff) < rotationSpeed) {
      this.state.angle = this.state.targetAngle;
      this.state.isAnimating = false;
      this.updatePosition();
      return;
    }

    const step = Math.sign(angleDiff) * rotationSpeed;
    this.state.angle += step;
    this.state.angle = (this.state.angle + 360) % 360;
    this.updatePosition();
  }

  public rotateLeft(): void {
    this.state.targetAngle = (this.state.angle + 90) % 360;
    this.state.isAnimating = true;
  }

  public rotateRight(): void {
    this.state.targetAngle = (this.state.angle - 90 + 360) % 360;
    this.state.isAnimating = true;
  }

  public transformDirectionByCamera(direction: Direction): Direction {
    const normalizedAngle = (this.state.angle % 360 + 360) % 360;
    const sector = Math.floor((normalizedAngle + 45) / 90) % 4;

    switch (sector) {
      case 0:
        return direction;
      case 1:
        switch (direction) {
          case 'up': return 'right';
          case 'right': return 'down';
          case 'down': return 'left';
          case 'left': return 'up';
        }
      case 2:
        switch (direction) {
          case 'up': return 'down';
          case 'right': return 'left';
          case 'down': return 'up';
          case 'left': return 'right';
        }
      case 3:
        switch (direction) {
          case 'up': return 'left';
          case 'right': return 'up';
          case 'down': return 'right';
          case 'left': return 'down';
        }
      default:
        return direction;
    }
  }

  public increaseHeight(): void {
    this.state.height = Math.min(this.state.height + this.maxDimension * 0.15, this.maxDimension * 3);
    this.updatePosition();
  }

  public decreaseHeight(): void {
    this.state.height = Math.max(this.state.height - this.maxDimension * 0.15, this.maxDimension * 0.8);
    this.updatePosition();
  }

  public get isAnimating(): boolean {
    return this.state.isAnimating;
  }
} 