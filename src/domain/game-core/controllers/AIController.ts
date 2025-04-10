import { Direction, Position } from '../types';
import { CubeController } from './CubeController';
import { CameraController } from './CameraController';

export class AIController {
  private cameraController: CameraController;

  constructor(cameraController: CameraController) {
    this.cameraController = cameraController;
  }

  public getPossibleMoveDirections(
    enemyCube: CubeController,
    otherEnemyCubes: CubeController[]
  ): Direction[] {
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    
    return directions.filter(direction => {
      const transformedDirection = this.cameraController.transformDirectionByCamera(direction);
      
      if (!enemyCube.canRotate(
        transformedDirection,
        enemyCube.boardSize,
        enemyCube.cellSize,
        enemyCube.board
      )) {
        return false;
      }

      const newPosition = this.getNewPosition(enemyCube.position, direction);
      return !this.willCollideWithEnemies(newPosition, enemyCube, otherEnemyCubes);
    });
  }

  public getAiMoveDirection(
    enemyCube: CubeController,
    playerCube: CubeController,
    otherEnemyCubes: CubeController[]
  ): Direction | null {
    const possibleDirections = this.getPossibleMoveDirections(enemyCube, otherEnemyCubes);
    if (possibleDirections.length === 0) return null;

    if (this.isNearPlayer(enemyCube.position, playerCube.position)) {
      return this.handleNearbyPlayerBehavior(enemyCube, playerCube, possibleDirections);
    }

    return this.getRandomDirection(possibleDirections);
  }

  private willCollideWithEnemies(
    position: Position,
    currentCube: CubeController,
    otherCubes: CubeController[]
  ): boolean {
    return otherCubes
      .filter(cube => cube !== currentCube)
      .some(cube => cube.position.x === position.x && cube.position.y === position.y);
  }

  private isNearPlayer(enemyPos: Position, playerPos: Position, distance = 2): boolean {
    return (
      (Math.abs(playerPos.x - enemyPos.x) <= distance && playerPos.y === enemyPos.y) ||
      (Math.abs(playerPos.y - enemyPos.y) <= distance && playerPos.x === enemyPos.x)
    );
  }

  private handleNearbyPlayerBehavior(
    enemyCube: CubeController,
    playerCube: CubeController,
    possibleDirections: Direction[]
  ): Direction {
    const enemyTopValue = enemyCube.getTopValue();
    const playerTopValue = playerCube.getTopValue();

    if (enemyTopValue > playerTopValue) {
      return this.findAttackDirection(enemyCube.position, playerCube.position, possibleDirections);
    } else if (enemyTopValue < playerTopValue) {
      return this.findEscapeDirection(enemyCube.position, playerCube.position, possibleDirections);
    } else {
      return this.findSafeDirection(enemyCube.position, playerCube.position, possibleDirections);
    }
  }

  private findAttackDirection(
    enemyPos: Position,
    playerPos: Position,
    possibleDirections: Direction[]
  ): Direction {
    const attackDirection = possibleDirections.find(direction => {
      const newPos = this.getNewPosition(enemyPos, direction);
      return (
        (Math.abs(playerPos.x - newPos.x) === 1 && playerPos.y === newPos.y) ||
        (Math.abs(playerPos.y - newPos.y) === 1 && playerPos.x === newPos.x) ||
        (playerPos.x === newPos.x && playerPos.y === newPos.y)
      );
    });

    return attackDirection ?? this.getRandomDirection(possibleDirections);
  }

  private findEscapeDirection(
    enemyPos: Position,
    playerPos: Position,
    possibleDirections: Direction[]
  ): Direction {
    let bestDirection = possibleDirections[0];
    let maxDistance = this.calculateDistance(playerPos, enemyPos);

    for (const direction of possibleDirections) {
      const newPos = this.getNewPosition(enemyPos, direction);
      if (playerPos.x === newPos.x && playerPos.y === newPos.y) continue;

      const newDistance = this.calculateDistance(playerPos, newPos);
      if (newDistance > maxDistance) {
        maxDistance = newDistance;
        bestDirection = direction;
      }
    }

    return bestDirection;
  }

  private findSafeDirection(
    enemyPos: Position,
    playerPos: Position,
    possibleDirections: Direction[]
  ): Direction {
    const safeDirections = possibleDirections.filter(direction => {
      const newPos = this.getNewPosition(enemyPos, direction);
      return !(playerPos.x === newPos.x && playerPos.y === newPos.y);
    });

    return safeDirections.length > 0 
      ? this.getRandomDirection(safeDirections)
      : this.getRandomDirection(possibleDirections);
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  private getRandomDirection(directions: Direction[]): Direction {
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private getNewPosition(position: Position, direction: Direction): Position {
    const newPosition = { ...position };

    const directionMap: Record<Direction, () => void> = {
      up: () => newPosition.y += 1,
      down: () => newPosition.y -= 1,
      left: () => newPosition.x -= 1,
      right: () => newPosition.x += 1,
    };

    directionMap[direction]();
    return newPosition;
  }
}