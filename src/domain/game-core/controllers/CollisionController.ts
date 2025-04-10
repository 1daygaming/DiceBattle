import { CubeController } from './CubeController';
import { TeleportController } from './TeleportController';
import { Position } from '../types';

export class CollisionController {
  private readonly BOARD_SIZE = 10;
  private teleportController: TeleportController;

  constructor(teleportController: TeleportController) {
    this.teleportController = teleportController;
  }

  public checkCubesCollision(playerCube: CubeController, enemyCubes: CubeController[]): void {
    for (const enemyCube of enemyCubes) {
      if (this.areCubesColliding(playerCube, enemyCube)) {
        this.handleCollision(playerCube, enemyCube, enemyCubes);
        break;
      }
    }
  }

  private areCubesColliding(playerCube: CubeController, enemyCube: CubeController): boolean {
    const playerPos = playerCube.position;
    const enemyPos = enemyCube.position;

    const isSameCell = playerPos.x === enemyPos.x && playerPos.y === enemyPos.y;
    const isAdjacent = 
      (Math.abs(playerPos.x - enemyPos.x) === 1 && playerPos.y === enemyPos.y) ||
      (Math.abs(playerPos.y - enemyPos.y) === 1 && playerPos.x === enemyPos.x);

    return isSameCell || isAdjacent;
  }

  private handleCollision(
    playerCube: CubeController,
    enemyCube: CubeController,
    enemyCubes: CubeController[]
  ): void {
    this.logCollisionDetails(playerCube, enemyCube);

    const playerValue = playerCube.getTopValue();
    const enemyValue = enemyCube.getTopValue();

    if (playerValue > enemyValue) {
      this.handlePlayerWin(enemyCube, playerCube, enemyCubes);
    } else if (enemyValue > playerValue) {
      this.handleEnemyWin(playerCube, enemyCubes);
    } else {
      this.handleDraw(playerCube, enemyCube, enemyCubes);
    }
  }

  private logCollisionDetails(playerCube: CubeController, enemyCube: CubeController): void {
    console.log('Cubes collided! Starting battle!');
    console.log('Player face values:', playerCube.faceValues);
    console.log('Enemy face values:', enemyCube.faceValues);
    console.log(`Player value: ${playerCube.getTopValue()}, Enemy value: ${enemyCube.getTopValue()}`);
  }

  private handlePlayerWin(
    enemyCube: CubeController,
    playerCube: CubeController,
    enemyCubes: CubeController[]
  ): void {
    console.log('Player won!');
    this.teleportCube(
      enemyCube,
      [playerCube.position, ...enemyCubes.map(cube => cube.position)]
    );
  }

  private handleEnemyWin(playerCube: CubeController, enemyCubes: CubeController[]): void {
    console.log('Enemy won!');
    this.teleportCube(
      playerCube,
      enemyCubes.map(cube => cube.position)
    );
  }

  private handleDraw(
    playerCube: CubeController,
    enemyCube: CubeController,
    enemyCubes: CubeController[]
  ): void {
    console.log('Draw!');
    if (playerCube.position.x === enemyCube.position.x && 
        playerCube.position.y === enemyCube.position.y) {
      this.teleportBothCubes(playerCube, enemyCube, enemyCubes);
    }
  }

  private teleportBothCubes(
    playerCube: CubeController,
    enemyCube: CubeController,
    enemyCubes: CubeController[]
  ): void {
    const otherPositions = enemyCubes
      .filter(cube => cube !== enemyCube)
      .map(cube => cube.position);

    const newPlayerPos = this.findRandomFreePosition(otherPositions);
    this.teleportController.animateTeleport(playerCube, newPlayerPos);

    const newEnemyPos = this.findRandomFreePosition([...otherPositions, newPlayerPos]);
    this.teleportController.animateTeleport(enemyCube, newEnemyPos);
  }

  private teleportCube(cube: CubeController, excludePositions: Position[]): void {
    const newPosition = this.findRandomFreePosition(excludePositions);
    this.teleportController.animateTeleport(cube, newPosition);
  }

  private findRandomFreePosition(excludePositions: Position[]): Position {
    const allPossiblePositions = this.generateAllBoardPositions();
    const availablePositions = allPossiblePositions.filter(
      pos => !excludePositions.some(ex => ex.x === pos.x && ex.y === pos.y)
    );

    return availablePositions.length > 0
      ? availablePositions[Math.floor(Math.random() * availablePositions.length)]
      : { x: 0, y: 0 }; // Fallback position
  }

  private generateAllBoardPositions(): Position[] {
    const positions: Position[] = [];
    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        positions.push({ x, y });
      }
    }
    return positions;
  }
}