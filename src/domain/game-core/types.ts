import * as THREE from 'three';

export interface BoardSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameConfig {
  boardSize: BoardSize;
  cellSize: number;
}

export interface TeleportEffect {
  particles: THREE.Points;
  positions: Float32Array;
  velocities: Array<{ x: number; y: number; z: number }>;
  lifetime: number;
  maxLifetime: number;
}

export interface DebugHelpers {
  enabled: boolean;
  axesHelper: THREE.AxesHelper | null;
  gridHelper: THREE.GridHelper | null;
}

export interface GameState {
  active: boolean;
  collectedNumbers: Set<number>;
  moveCount: number;
  nextObstacleChange: number;
  playerWins: number;
  enemyWins: number;
}

export interface CameraState {
  angle: number;
  targetAngle: number;
  isAnimating: boolean;
  height: number;
  distance: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';
