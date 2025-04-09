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

export interface Cube {
  position: Position;
  mesh: CubeMesh;
  faceValues: FaceValues;
  rotationInProgress: boolean;
  teleporting: boolean;
  
  setScene(scene: THREE.Scene): void;
  canRotate(direction: string, boardSize: BoardSize, cellSize: number, board: Board): boolean;
  startRotation(direction: string, boardSize: BoardSize, cellSize: number, board: Board): void;
  update(boardSize: BoardSize, cellSize: number): boolean;
  reset(position: Position): void;
  setColor(color: number): void;
  getTopValue(): number;
  getBottomValue(): number;
}

export interface Board {
  mesh: THREE.Mesh;
  getSize(): BoardSize;
  getStartPosition(): Position;
  setupObstacleCells(excludePosition: Position): void;
  updateTargetCellsHighlight(nextNumber: number): void;
  getTargetCellsCount(): number;
  isObstacle(x: number, y: number): boolean;
  checkTargetCell(x: number, y: number, value: number): boolean;
}

export interface Game {
  boardSize: BoardSize;
  cellSize: number;
  active: boolean;
  collectedNumbers: Set<number>;
  moveCount: number;
  nextObstacleChange: number;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  lights: THREE.Light[];
  board: Board;
  cube: Cube;
  enemyCubes: Cube[];
  cubePositionHelper: THREE.Mesh;
  teleportEffects: any[];
  playerWins: number;
  enemyWins: number;
  aiEnabled: boolean;
  lastMoveDirection: string | null;
  debugHelpers: {
    enabled: boolean;
    axesHelper: THREE.AxesHelper | null;
    gridHelper: THREE.GridHelper | null;
  };
  ui: any;
  cameraAngle: number;
  targetCameraAngle: number;
  cameraAnimating: boolean;
  cameraDistance: number;
  cameraHeight: number;
  rotationCompletedHandler: (() => void) | null;
  onCollectedNumbersChanged: ((count: number) => void) | null;
  onGameCompleted: (() => void) | null;

  init(): void;
  start(): void;
  reset(): void;
  animate(): void;
  moveCube(direction: string): boolean;
  isActive(): boolean;
  isCubeRotating(): boolean;
  rotateCameraLeft(): void;
  rotateCameraRight(): void;
  increaseCameraHeight(): void;
  decreaseCameraHeight(): void;
  toggleDebugHelpers(): void;
  setRotationCompletedHandler(handler: () => void): void;
  setCollectedNumbersChangedHandler(handler: (count: number) => void): void;
  setGameCompletedHandler(handler: () => void): void;
  setUI(ui: any): void;
} 