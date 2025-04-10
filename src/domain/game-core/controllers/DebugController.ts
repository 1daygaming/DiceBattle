import * as THREE from 'three';
import { DebugHelpers } from '../types';
import { CubeController } from './CubeController';

export class DebugController {
  private scene: THREE.Scene;
  private debugHelpers: DebugHelpers;
  private cubePositionHelper: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.debugHelpers = {
      enabled: true,
      axesHelper: null,
      gridHelper: null,
    };
  }

  public init(boardSize: { width: number; height: number }, cellSize: number): void {
    if (!this.debugHelpers.enabled) {
      const debugInfoElement = document.getElementById('debug-info');
      if (debugInfoElement) {
        debugInfoElement.remove();
      }
      return;
    }

    // Create axes helper
    this.debugHelpers.axesHelper = new THREE.AxesHelper(boardSize.width * cellSize);
    this.scene.add(this.debugHelpers.axesHelper);

    // Create grid helper
    const gridSize = boardSize.width * cellSize * 2;
    const gridDivisions = boardSize.width * 2;
    this.debugHelpers.gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
    this.scene.add(this.debugHelpers.gridHelper);

    // Create cube position helper
    const cubePositionGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const cubePositionMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.cubePositionHelper = new THREE.Mesh(cubePositionGeometry, cubePositionMaterial);
    this.cubePositionHelper.position.y = 0;
    this.scene.add(this.cubePositionHelper);

    this.updateDebugInfo();
  }

  public updateDebugInfo(cube?: CubeController): void {
    if (!this.debugHelpers.enabled) return;

    let debugInfoElement = document.getElementById('debug-info');
    if (!debugInfoElement) {
      debugInfoElement = document.createElement('div');
      debugInfoElement.id = 'debug-info';
      debugInfoElement.style.position = 'absolute';
      debugInfoElement.style.bottom = '50%';
      debugInfoElement.style.left = '10px';
      debugInfoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugInfoElement.style.color = 'white';
      debugInfoElement.style.padding = '10px';
      debugInfoElement.style.fontFamily = 'monospace';
      debugInfoElement.style.fontSize = '12px';
      debugInfoElement.style.zIndex = '1000';
      debugInfoElement.style.display = 'block';
      document.body.appendChild(debugInfoElement);
    }

    if (cube) {
      const { top, bottom, left, right, front, back } = cube.faceValues;
      debugInfoElement.innerHTML = `
        <div>Position: x=${cube.position.x}, y=${cube.position.y}</div>
        <div>Faces:</div>
        <div>- Top: ${top}</div>
        <div>- Bottom: ${bottom}</div>
        <div>- Left: ${left}</div>
        <div>- Right: ${right}</div>
        <div>- Front: ${front}</div>
        <div>- Back: ${back}</div>
      `;
    }
  }

  public updateCubePositionHelper(
    cube: CubeController,
    cellSize: number,
    boardSize: { width: number; height: number }
  ): void {
    if (!this.cubePositionHelper) return;

    const worldX = cube.position.x * cellSize - (boardSize.width * cellSize) / 2 + cellSize / 2;
    const worldZ = cube.position.y * cellSize - (boardSize.height * cellSize) / 2 + cellSize / 2;

    this.cubePositionHelper.position.x = worldX;
    this.cubePositionHelper.position.z = worldZ;
  }

  public toggleDebugHelpers(): void {
    this.debugHelpers.enabled = !this.debugHelpers.enabled;

    if (this.debugHelpers.enabled) {
      if (this.debugHelpers.axesHelper) {
        this.scene.add(this.debugHelpers.axesHelper);
      }
      if (this.debugHelpers.gridHelper) {
        this.scene.add(this.debugHelpers.gridHelper);
      }
      if (this.cubePositionHelper) {
        this.scene.add(this.cubePositionHelper);
      }

      this.updateDebugInfo();
      const debugInfoElement = document.getElementById('debug-info');
      if (debugInfoElement) {
        debugInfoElement.style.display = 'block';
      }
    } else {
      if (this.debugHelpers.axesHelper) {
        this.scene.remove(this.debugHelpers.axesHelper);
      }
      if (this.debugHelpers.gridHelper) {
        this.scene.remove(this.debugHelpers.gridHelper);
      }
      if (this.cubePositionHelper) {
        this.scene.remove(this.cubePositionHelper);
      }

      const debugInfoElement = document.getElementById('debug-info');
      if (debugInfoElement) {
        debugInfoElement.style.display = 'none';
      }
    }
  }
}
