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
    const allCubes = [playerCube, ...enemyCubes];
    const processedPairs = new Set<string>();

    for (let i = 0; i < allCubes.length; i++) {
      for (let j = i + 1; j < allCubes.length; j++) {
        const cube1 = allCubes[i];
        const cube2 = allCubes[j];
        
        if (cube1.teleporting || cube2.teleporting) continue;
        
        const pairKey = `${i}-${j}`;
        if (processedPairs.has(pairKey)) continue;
        
        if (this.areCubesColliding(cube1, cube2)) {
          if (cube1 === playerCube || cube2 === playerCube) {
            const enemy = cube1 === playerCube ? cube2 : cube1;
            this.handleCollision(playerCube, enemy, enemyCubes);
          } else {
            this.handleEnemyCollision(cube1, cube2, enemyCubes);
          }
          processedPairs.add(pairKey);
        }
      }
    }
  }

  private areCubesColliding(cube1: CubeController, cube2: CubeController): boolean {
    const pos1 = cube1.position;
    const pos2 = cube2.position;

    const isSameCell = pos1.x === pos2.x && pos1.y === pos2.y;
    const isAdjacent = 
      (Math.abs(pos1.x - pos2.x) === 1 && pos1.y === pos2.y) ||
      (Math.abs(pos1.y - pos2.y) === 1 && pos1.x === pos2.x);

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

  private handleEnemyCollision(
    enemy1: CubeController,
    enemy2: CubeController,
    allEnemies: CubeController[]
  ): void {
    this.logCollisionDetails(enemy1, enemy2);

    const value1 = enemy1.getTopValue();
    const value2 = enemy2.getTopValue();

    if (value1 > value2) {
      this.handleEnemyWinBattle(enemy2, enemy1, allEnemies);
    } else if (value2 > value1) {
      this.handleEnemyWinBattle(enemy1, enemy2, allEnemies);
    } else {
      this.handleEnemyDraw(enemy1, enemy2, allEnemies);
    }
  }

  private handleEnemyWinBattle(
    loser: CubeController,
    winner: CubeController,
    allEnemies: CubeController[]
  ): void {
    console.log('Enemy battle! Winner:', winner === loser ? 'Draw' : 'Enemy');
    const otherPositions = allEnemies
      .filter(cube => cube !== winner && cube !== loser)
      .map(cube => cube.position);
    
    this.teleportCube(loser, [...otherPositions, winner.position]);
  }

  private handleEnemyDraw(
    enemy1: CubeController,
    enemy2: CubeController,
    allEnemies: CubeController[]
  ): void {
    console.log('Enemy battle draw!');
    if (enemy1.position.x === enemy2.position.x && 
        enemy1.position.y === enemy2.position.y) {
      this.teleportBothEnemies(enemy1, enemy2, allEnemies);
    }
  }

  private teleportBothEnemies(
    enemy1: CubeController,
    enemy2: CubeController,
    allEnemies: CubeController[]
  ): void {
    const otherPositions = allEnemies
      .filter(cube => cube !== enemy1 && cube !== enemy2)
      .map(cube => cube.position);

    const newPos1 = this.findRandomFreePosition(otherPositions);
    this.teleportController.animateTeleport(enemy1, newPos1);

    const newPos2 = this.findRandomFreePosition([...otherPositions, newPos1]);
    this.teleportController.animateTeleport(enemy2, newPos2);
  }

  private logCollisionDetails(cube1: CubeController, cube2: CubeController): void {
    console.log('Cubes collided! Starting battle!');
    console.log('Cube1 face values:', cube1.faceValues);
    console.log('Cube2 face values:', cube2.faceValues);
    console.log(`Cube1 value: ${cube1.getTopValue()}, Cube2 value: ${cube2.getTopValue()}`);
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