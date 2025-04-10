// Type definitions for the game entities

export interface BoardSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface FaceValues {
  top: number;
  bottom: number;
  left: number;
  right: number;
  front: number;
  back: number;
}

export interface CubeMesh extends THREE.Mesh {
  position: THREE.Vector3;
  rotation: THREE.Euler;
}
