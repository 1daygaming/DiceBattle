import * as THREE from 'three';
import { Direction, GameConfig, GameState } from './types';
import { BoardController } from '@/domain/game-core/controllers/BoardController';
import { CubeController } from '@/domain/game-core/controllers/CubeController';
import { TeleportController } from '@/domain/game-core/controllers/TeleportController';
import { CameraController } from '@/domain/game-core/controllers/CameraController';
import { AIController } from '@/domain/game-core/controllers/AIController';
import { CollisionController } from '@/domain/game-core/controllers/CollisionController';
import { DebugController } from '@/domain/game-core/controllers/DebugController';
export class Game {
  public state: GameState;
  public cameraController: CameraController | null = null;
  private config: GameConfig;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private boardController: BoardController | null = null;
  private currentUserCubeController: CubeController | null = null;
  private enemyCubes: CubeController[] = [];
  private teleportController: TeleportController | null = null;
  private aiController: AIController | null = null;
  private collisionController: CollisionController | null = null;
  private debugController: DebugController | null = null;
  private rotationCompletedHandler: (() => void) | null = null;
  private onCollectedNumbersChanged: ((count: number) => void) | null = null;
  private onGameCompleted: (() => void) | null = null;

  constructor(config: GameConfig = { boardSize: { width: 10, height: 10 }, cellSize: 1 }) {
    this.config = {
      boardSize: config.boardSize || { width: 10, height: 10 },
      cellSize: config.cellSize || 1,
    };

    this.state = {
      active: false,
      collectedNumbers: new Set(),
      moveCount: 0,
      nextObstacleChange: this.getRandomObstacleChangeInterval(),
      playerWins: 0,
      enemyWins: 0,
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

    this.boardController = new BoardController(
      this.config.boardSize.width,
      this.config.boardSize.height,
      this.config.cellSize
    );
    this.currentUserCubeController = new CubeController(
      this.config.cellSize,
      this.config.boardSize,
      this.config.cellSize,
      this.boardController
    );

    for (let i = 0; i < 3; i++) {
      const enemyCube = new CubeController(
        this.config.cellSize,
        this.config.boardSize,
        this.config.cellSize,
        this.boardController
      );
      enemyCube.setColor(0xff0000);
      this.enemyCubes.push(enemyCube);
    }
  }

  private setupCamera(): void {
    if (!this.camera) return;

    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();

    this.cameraController = new CameraController(
      this.camera,
      this.config.boardSize,
      this.config.cellSize
    );
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
    if (
      !this.scene ||
      !this.boardController ||
      !this.currentUserCubeController ||
      !this.currentUserCubeController.mesh
    )
      return;

    this.scene.add(this.boardController.mesh);
    this.currentUserCubeController.setScene(this.scene);
    this.scene.add(this.currentUserCubeController.mesh);

    for (const enemyCube of this.enemyCubes) {
      enemyCube.setScene(this.scene);
      if (enemyCube.mesh) {
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

    this.teleportController = new TeleportController(
      this.scene,
      this.config.boardSize,
      this.config.cellSize
    );
    this.aiController = new AIController(this.cameraController);
    this.collisionController = new CollisionController(this.teleportController);
    this.debugController = import.meta.env.DEV ? new DebugController(this.scene) : null;
    this.debugController?.init(this.config.boardSize, this.config.cellSize);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onWindowResize(): void {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public start(): void {
    this.reset();
    this.state.active = true;
  }

  isCubeRotating() {
    return (
      this.currentUserCubeController?.rotationInProgress ||
      this.currentUserCubeController?.teleporting ||
      this.enemyCubes.some(cube => cube.rotationInProgress) ||
      this.enemyCubes.some(cube => cube.teleporting)
    );
  }

  public reset(): void {
    if (!this.currentUserCubeController || !this.boardController) return;

    this.state.collectedNumbers.clear();
    this.state.moveCount = 0;
    this.state.nextObstacleChange = this.getRandomObstacleChangeInterval();

    const startPosition = this.boardController.getStartPosition();
    this.currentUserCubeController.reset(startPosition);

    const worldX =
      startPosition.x * this.config.cellSize -
      (this.config.boardSize.width * this.config.cellSize) / 2 +
      this.config.cellSize / 2;
    const worldZ =
      startPosition.y * this.config.cellSize -
      (this.config.boardSize.height * this.config.cellSize) / 2 +
      this.config.cellSize / 2;

    if (this.currentUserCubeController.mesh) {
      this.currentUserCubeController.mesh.position.set(worldX, this.config.cellSize / 2, worldZ);
      this.currentUserCubeController.mesh.rotation.set(0, 0, 0);
    }

    const occupiedPositions = [startPosition];

    for (const enemyCube of this.enemyCubes) {
      const enemyPosition = this.getRandomFreePosition(occupiedPositions);
      enemyCube.reset(enemyPosition);
      occupiedPositions.push(enemyPosition);

      if (enemyCube.mesh) {
        const enemyWorldX =
          enemyPosition.x * this.config.cellSize -
          (this.config.boardSize.width * this.config.cellSize) / 2 +
          this.config.cellSize / 2;
        const enemyWorldZ =
          enemyPosition.y * this.config.cellSize -
          (this.config.boardSize.height * this.config.cellSize) / 2 +
          this.config.cellSize / 2;

        enemyCube.mesh.position.set(enemyWorldX, this.config.cellSize / 2, enemyWorldZ);
        enemyCube.mesh.rotation.set(0, 0, 0);
      }
    }

    this.state.playerWins = 0;
    this.state.enemyWins = 0;
  }

  public animate(): void {
    if (
      !this.scene ||
      !this.camera ||
      !this.renderer ||
      !this.currentUserCubeController ||
      !this.cameraController ||
      !this.collisionController ||
      !this.debugController
    )
      return;

    requestAnimationFrame(() => this.animate());

    if (this.cameraController.isAnimating) {
      this.cameraController.animateRotation();
    }

    if (this.teleportController) {
      this.teleportController.updateTeleportEffects();
    }

    if (this.state.active) {
      const playerRotationCompleted = this.currentUserCubeController.update(
        this.config.boardSize,
        this.config.cellSize
      );

      const enemyRotationsCompleted = this.enemyCubes.map(enemyCube =>
        enemyCube.update(this.config.boardSize, this.config.cellSize)
      );

      const allEnemyCubesReady =
        enemyRotationsCompleted.every(completed => completed !== false) &&
        this.enemyCubes.every(enemyCube => !enemyCube.teleporting);

      if (
        playerRotationCompleted &&
        !this.currentUserCubeController.teleporting &&
        allEnemyCubesReady
      ) {
        this.checkTargetCell();

        if (
          !this.currentUserCubeController.rotationInProgress &&
          this.enemyCubes.every(enemyCube => !enemyCube.rotationInProgress)
        ) {
          this.collisionController.checkCubesCollision(
            this.currentUserCubeController,
            this.enemyCubes
          );

          if (this.rotationCompletedHandler) {
            this.rotationCompletedHandler();
          }
        }
      }

      this.debugController.updateCubePositionHelper(
        this.currentUserCubeController,
        this.config.cellSize,
        this.config.boardSize
      );
    }

    this.debugController.updateDebugInfo(this.currentUserCubeController);
    this.renderer.render(this.scene, this.camera);
  }

  public moveCube(direction: Direction): boolean {
    if (
      !this.state.active ||
      !this.currentUserCubeController ||
      !this.cameraController ||
      !this.aiController
    )
      return false;

    if (
      this.currentUserCubeController.rotationInProgress ||
      this.enemyCubes.some(enemyCube => enemyCube.rotationInProgress) ||
      this.currentUserCubeController.teleporting ||
      this.enemyCubes.some(enemyCube => enemyCube.teleporting)
    )
      return false;

    const transformedDirection = this.cameraController.transformDirectionByCamera(direction);

    if (
      !this.currentUserCubeController.canRotate(
        transformedDirection,
        this.config.boardSize,
        this.config.cellSize,
        this.boardController
      )
    ) {
      return false;
    }

    this.currentUserCubeController.startRotation(
      transformedDirection,
      this.config.boardSize,
      this.config.cellSize,
      this.boardController
    );

    for (const enemyCube of this.enemyCubes) {
      const enemyDirection = this.aiController.getAiMoveDirection(
        enemyCube,
        this.currentUserCubeController,
        this.enemyCubes
      );

      if (enemyDirection) {
        const transformedEnemyDirection =
          this.cameraController.transformDirectionByCamera(enemyDirection);

        if (
          enemyCube.canRotate(
            transformedEnemyDirection,
            this.config.boardSize,
            this.config.cellSize,
            this.boardController
          )
        ) {
          enemyCube.startRotation(
            transformedEnemyDirection,
            this.config.boardSize,
            this.config.cellSize,
            this.boardController
          );
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
    if (!this.currentUserCubeController || !this.boardController) return;

    const { x, y } = this.currentUserCubeController.position;
    const bottomValue = this.currentUserCubeController.getBottomValue();
    const nextNumberToCollect = this.state.collectedNumbers.size + 1;

    if (
      this.boardController.checkTargetCell(x, y, bottomValue) &&
      bottomValue === nextNumberToCollect
    ) {
      this.state.collectedNumbers.add(bottomValue);
      this.boardController.updateTargetCellsHighlight(nextNumberToCollect + 1);

      if (this.onCollectedNumbersChanged) {
        this.onCollectedNumbersChanged(this.state.collectedNumbers.size);
      }

      if (this.state.collectedNumbers.size === this.boardController.getTargetCellsCount()) {
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
    if (!this.currentUserCubeController || !this.boardController) return;

    const cubePosition = { ...this.currentUserCubeController.position };
    this.boardController.setupObstacleCells(cubePosition);
    this.state.nextObstacleChange = this.getRandomObstacleChangeInterval();
    this.state.moveCount = 0;
  }

  private getRandomFreePosition(excludePositions: { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    const allPositions: { x: number; y: number }[] = [];

    for (let y = 0; y < this.config.boardSize.height; y++) {
      for (let x = 0; x < this.config.boardSize.width; x++) {
        if (excludePositions.some(pos => pos.x === x && pos.y === y)) continue;
        if (this.boardController?.isObstacle(x, y)) continue;
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
