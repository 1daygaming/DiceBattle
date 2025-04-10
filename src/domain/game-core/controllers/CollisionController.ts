import { CubeController } from './CubeController';
import { TeleportController } from './TeleportController';

export class CollisionController {
  private teleportController: TeleportController;

  constructor(teleportController: TeleportController) {
    this.teleportController = teleportController;
  }

  public checkCubesCollision(playerCube: CubeController, enemyCubes: CubeController[]): void {
    const playerPos = playerCube.position;

    for (const enemyCube of enemyCubes) {
      const enemyPos = enemyCube.position;

      const isSameCell = playerPos.x === enemyPos.x && playerPos.y === enemyPos.y;
      const isAdjacent =
        (Math.abs(playerPos.x - enemyPos.x) === 1 && playerPos.y === enemyPos.y) ||
        (Math.abs(playerPos.y - enemyPos.y) === 1 && playerPos.x === enemyPos.x);

      if (isSameCell || isAdjacent) {
        console.log('Cubes collided! Starting battle!');

        const playerTopValue = playerCube.getTopValue();
        const enemyTopValue = enemyCube.getTopValue();

        console.log('Player face values:', playerCube.faceValues);
        console.log('Enemy face values:', enemyCube.faceValues);
        console.log(`Player value: ${playerTopValue}, Enemy value: ${enemyTopValue}`);

        if (playerTopValue > enemyTopValue) {
          console.log('Player won!');
          this.teleportEnemyCube(enemyCube, playerCube, enemyCubes);
        } else if (enemyTopValue > playerTopValue) {
          console.log('Enemy won!');
          this.teleportPlayerCube(playerCube, enemyCubes);
        } else {
          console.log('Draw!');
          if (isSameCell) {
            this.teleportBothCubes(playerCube, enemyCube, enemyCubes);
          }
        }

        break;
      }
    }
  }

  private teleportEnemyCube(
    enemyCube: CubeController,
    playerCube: CubeController,
    enemyCubes: CubeController[]
  ): void {
    const allPositions = [playerCube.position, ...enemyCubes.map(cube => cube.position)];

    const newPosition = this.getRandomFreePosition(allPositions);
    this.teleportController.animateTeleport(enemyCube, newPosition);
  }

  private teleportPlayerCube(playerCube: CubeController, enemyCubes: CubeController[]): void {
    const allPositions = enemyCubes.map(cube => cube.position);
    const newPosition = this.getRandomFreePosition(allPositions);
    this.teleportController.animateTeleport(playerCube, newPosition);
  }

  private teleportBothCubes(
    playerCube: CubeController,
    enemyCube: CubeController,
    enemyCubes: CubeController[]
  ): void {
    const otherPositions = enemyCubes.filter(cube => cube !== enemyCube).map(cube => cube.position);

    const newPlayerPosition = this.getRandomFreePosition(otherPositions);
    const updatedPositions = [...otherPositions, newPlayerPosition];

    this.teleportController.animateTeleport(playerCube, newPlayerPosition);

    const newEnemyPosition = this.getRandomFreePosition(updatedPositions);
    this.teleportController.animateTeleport(enemyCube, newEnemyPosition);
  }

  private getRandomFreePosition(excludePositions: { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    const allPositions: { x: number; y: number }[] = [];

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (excludePositions.some(pos => pos.x === x && pos.y === y)) continue;
        allPositions.push({ x, y });
      }
    }

    if (allPositions.length === 0) {
      return { x: 0, y: 0 };
    }

    const randomIndex = Math.floor(Math.random() * allPositions.length);
    return allPositions[randomIndex];
  }
}
