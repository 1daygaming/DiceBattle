import * as THREE from 'three';
import { Board } from './board';
import { Cube } from './cube';
import { CameraController } from './CameraController';
import { TeleportController } from './TeleportController';
import { AIController } from './AIController';
import { CollisionController } from './CollisionController';
import { DebugController } from './DebugController';
import { GameConfig, GameState, Direction } from './types';
import { UI } from './ui';

export class Game {
  private config: GameConfig;
  public state: GameState;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private board: Board | null = null;
  private cube: Cube | null = null;
  private enemyCubes: Cube[] = [];
  public cameraController: CameraController | null = null;
  private teleportController: TeleportController | null = null;
  private aiController: AIController | null = null;
  private collisionController: CollisionController | null = null;
  private debugController: DebugController | null = null;
  private rotationCompletedHandler: (() => void) | null = null;
  private onCollectedNumbersChanged: ((count: number) => void) | null = null;
  private onGameCompleted: (() => void) | null = null;

  constructor(config: GameConfig = {boardSize: { width: 10, height: 10 }, cellSize: 1}) {
    this.config = {
      boardSize: config.boardSize || { width: 10, height: 10 },
      cellSize: config.cellSize || 1
    };

    this.state = {
      active: false,
      collectedNumbers: new Set(),
      moveCount: 0,
      nextObstacleChange: this.getRandomObstacleChangeInterval(),
      playerWins: 0,
      enemyWins: 0
    };
  }

  public init(): void {
    this.initThree();
    this.createGameObjects();
    this.setupCamera();
    this.setupLights();
    this.addObjectsToScene();
    this.setupRenderer();
    this.setupControllers();
    this.setupEventListeners();
  }

  private initThree(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  }

  private createGameObjects(): void {
    if (!this.scene) return;

    this.board = new Board(this.config.boardSize.width, this.config.boardSize.height, this.config.cellSize);
    this.cube = new Cube(this.config.cellSize, this.config.boardSize, this.config.cellSize, this.board);

    for (let i = 0; i < 3; i++) {
      const enemyCube = new Cube(this.config.cellSize, this.config.boardSize, this.config.cellSize, this.board);
      enemyCube.setColor(0xff0000);
      this.enemyCubes.push(enemyCube);
    }
  }

  private setupCamera(): void {
    if (!this.camera) return;

    const boardWidth = this.config.boardSize.width * this.config.cellSize;
    const boardHeight = this.config.boardSize.height * this.config.cellSize;
    const maxDimension = Math.max(boardWidth, boardHeight);

    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();

    this.cameraController = new CameraController(this.camera, this.config.boardSize, this.config.cellSize);
    this.cameraController.updatePosition();
  }

  private setupLights(): void {
    if (!this.scene) return;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;

    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;

    const shadowSize = this.config.boardSize.width * this.config.cellSize * 0.8;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;

    this.scene.add(directionalLight);
  }

  private addObjectsToScene(): void {
    if (!this.scene || !this.board || !this.cube || !this.cube.mesh) return;

    this.scene.add(this.board.mesh);
    this.cube.setScene(this.scene);
    this.scene.add(this.cube.mesh);

    for (const enemyCube of this.enemyCubes) {
      enemyCube.setScene(this.scene);
      if (enemyCube.mesh){
        this.scene.add(enemyCube.mesh);
      }
    }
  }

  private setupRenderer(): void {
    if (!this.scene) return;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const container = document.getElementById('game-canvas');
    if (container) {
      container.appendChild(this.renderer.domElement);
    }
  }

  private setupControllers(): void {
    if (!this.scene || !this.cameraController) return;

    this.teleportController = new TeleportController(this.scene, this.config.boardSize, this.config.cellSize);
    this.aiController = new AIController(this.cameraController);
    this.collisionController = new CollisionController(this.teleportController);
    this.debugController = import.meta.env.DEV ? new DebugController(this.scene) : null
    this.debugController?.init(this.config.boardSize, this.config.cellSize);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onWindowResize(): void {
    if (!this.camera || !this.renderer) return;

    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public start(): void {
    this.reset();
    this.state.active = true;
  }

  isCubeRotating() {
    return this.cube?.rotationInProgress || 
      this.cube?.teleporting || 
      this.enemyCubes.some(cube => cube.rotationInProgress) ||
      this.enemyCubes.some(cube => cube.teleporting);
  }

  public reset(): void {
    if (!this.cube || !this.board) return;

    this.state.collectedNumbers.clear();
    this.state.moveCount = 0;
    this.state.nextObstacleChange = this.getRandomObstacleChangeInterval();

    const startPosition = this.board.getStartPosition();
    this.cube.reset(startPosition);

    const worldX = startPosition.x * this.config.cellSize - (this.config.boardSize.width * this.config.cellSize) / 2 + this.config.cellSize / 2;
    const worldZ = startPosition.y * this.config.cellSize - (this.config.boardSize.height * this.config.cellSize) / 2 + this.config.cellSize / 2;

    if (this.cube.mesh) {
      this.cube.mesh.position.set(worldX, this.config.cellSize / 2, worldZ);
      this.cube.mesh.rotation.set(0, 0, 0);
    }

    let occupiedPositions = [startPosition];

    for (const enemyCube of this.enemyCubes) {
      const enemyPosition = this.getRandomFreePosition(occupiedPositions);
      enemyCube.reset(enemyPosition);
      occupiedPositions.push(enemyPosition);

      if (enemyCube.mesh) {
        const enemyWorldX = enemyPosition.x * this.config.cellSize - (this.config.boardSize.width * this.config.cellSize) / 2 + this.config.cellSize / 2;
        const enemyWorldZ = enemyPosition.y * this.config.cellSize - (this.config.boardSize.height * this.config.cellSize) / 2 + this.config.cellSize / 2;

        enemyCube.mesh.position.set(enemyWorldX, this.config.cellSize / 2, enemyWorldZ);
        enemyCube.mesh.rotation.set(0, 0, 0);
      }
    }

    this.state.playerWins = 0;
    this.state.enemyWins = 0;
  }

  public animate(): void {
    if (!this.scene || !this.camera || !this.renderer || !this.cube || !this.cameraController || !this.collisionController || !this.debugController) return;

    requestAnimationFrame(() => this.animate());

    if (this.cameraController.isAnimating) {
      this.cameraController.animateRotation();
    }

    if (this.teleportController) {
      this.teleportController.updateTeleportEffects();
    }

    if (this.state.active) {
      const playerRotationCompleted = this.cube.update(this.config.boardSize, this.config.cellSize);

      const enemyRotationsCompleted = this.enemyCubes.map(enemyCube =>
        enemyCube.update(this.config.boardSize, this.config.cellSize)
      );

      const allEnemyCubesReady = enemyRotationsCompleted.every(completed => completed !== false) &&
        this.enemyCubes.every(enemyCube => !enemyCube.teleporting);

      if (playerRotationCompleted && !this.cube.teleporting && allEnemyCubesReady) {
        this.checkTargetCell();

        if (!this.cube.rotationInProgress && this.enemyCubes.every(enemyCube => !enemyCube.rotationInProgress)) {
          this.collisionController.checkCubesCollision(this.cube, this.enemyCubes);
          
          if (this.rotationCompletedHandler) {
            this.rotationCompletedHandler();
          }
        }
      }

      this.debugController.updateCubePositionHelper(this.cube, this.config.cellSize, this.config.boardSize);
    }

    this.debugController.updateDebugInfo(this.cube);
    this.renderer.render(this.scene, this.camera);
  }

  public moveCube(direction: Direction): boolean {
    if (!this.state.active || !this.cube || !this.cameraController || !this.aiController) return false;

    if (this.cube.rotationInProgress || 
        this.enemyCubes.some(enemyCube => enemyCube.rotationInProgress) ||
        this.cube.teleporting ||
        this.enemyCubes.some(enemyCube => enemyCube.teleporting)) return false;
    
    const transformedDirection = this.cameraController.transformDirectionByCamera(direction);
    
    if (!this.cube.canRotate(transformedDirection, this.config.boardSize, this.config.cellSize, this.board)) {
      return false;
    }
    
    this.cube.startRotation(transformedDirection, this.config.boardSize, this.config.cellSize, this.board);
    
    for (const enemyCube of this.enemyCubes) {
      const enemyDirection = this.aiController.getAiMoveDirection(enemyCube, this.cube, this.enemyCubes);
      
      if (enemyDirection) {
        const transformedEnemyDirection = this.cameraController.transformDirectionByCamera(enemyDirection);
        
        if (enemyCube.canRotate(transformedEnemyDirection, this.config.boardSize, this.config.cellSize, this.board)) {
          enemyCube.startRotation(transformedEnemyDirection, this.config.boardSize, this.config.cellSize, this.board);
        }
      }
    }
    
    this.state.moveCount++;
    
    if (this.state.moveCount >= this.state.nextObstacleChange) {
      this.updateObstacles();
    }
    
    return true;
  }

  private checkTargetCell(): void {
    if (!this.cube || !this.board) return;

    const { x, y } = this.cube.position;
    const bottomValue = this.cube.getBottomValue();
    const nextNumberToCollect = this.state.collectedNumbers.size + 1;

    if (this.board.checkTargetCell(x, y, bottomValue) && bottomValue === nextNumberToCollect) {
      this.state.collectedNumbers.add(bottomValue);
      this.board.updateTargetCellsHighlight(nextNumberToCollect + 1);

      if (this.onCollectedNumbersChanged) {
        this.onCollectedNumbersChanged(this.state.collectedNumbers.size);
      }

      if (this.state.collectedNumbers.size === this.board.getTargetCellsCount()) {
        this.state.active = false;
        if (this.onGameCompleted) {
          this.onGameCompleted();
        }
      }
    }
  }

  private getRandomObstacleChangeInterval(): number {
    return Math.floor(Math.random() * 6) + 15;
  }

  private updateObstacles(): void {
    if (!this.cube || !this.board) return;

    const cubePosition = { ...this.cube.position };
    this.board.setupObstacleCells(cubePosition);
    this.state.nextObstacleChange = this.getRandomObstacleChangeInterval();
    this.state.moveCount = 0;
  }

  private getRandomFreePosition(excludePositions: { x: number; y: number }[]): { x: number; y: number } {
    const allPositions: { x: number; y: number }[] = [];

    for (let y = 0; y < this.config.boardSize.height; y++) {
      for (let x = 0; x < this.config.boardSize.width; x++) {
        if (excludePositions.some(pos => pos.x === x && pos.y === y)) continue;
        if (this.board?.isObstacle(x, y)) continue;
        allPositions.push({ x, y });
      }
    }

    if (allPositions.length === 0) {
      return { x: 0, y: 0 };
    }

    const randomIndex = Math.floor(Math.random() * allPositions.length);
    return allPositions[randomIndex];
  }

  public setRotationCompletedHandler(handler: () => void): void {
    this.rotationCompletedHandler = handler;
  }

  public toggleDebugHelpers(): void {
    if (this.debugController) {
      this.debugController.toggleDebugHelpers();
    }
  }

  setCollectedNumbersChangedHandler(handler: (count: number) => void): void {
    this.onCollectedNumbersChanged = handler;
  }

  setGameCompletedHandler(handler: () => void): void {
    this.onGameCompleted = handler;
  }
} 