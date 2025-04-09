import { Direction, Position } from '../types';
import { CubeController } from './CubeController';
import { CameraController } from './CameraController';

export class AIController {
  private cameraController: CameraController;

  constructor(cameraController: CameraController) {
    this.cameraController = cameraController;
  }

  public getPossibleMoveDirections(enemyCube: CubeController, otherEnemyCubes: CubeController[]): Direction[] {
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    const possibleDirections: Direction[] = [];
    
    const otherEnemyPositions = otherEnemyCubes
      .filter(cube => cube !== enemyCube)
      .map(cube => cube.position);
    
    for (const direction of directions) {
      const transformedDirection = this.cameraController.transformDirectionByCamera(direction);
      
      if (enemyCube.canRotate(transformedDirection, enemyCube.boardSize, enemyCube.cellSize, enemyCube.board)) {
        const newPosition = this.getNewPosition(enemyCube.position, direction);
        
        const willCollideWithEnemy = otherEnemyPositions.some(
          pos => pos.x === newPosition.x && pos.y === newPosition.y
        );
        
        if (!willCollideWithEnemy) {
          possibleDirections.push(direction);
        }
      }
    }
    
    return possibleDirections;
  }

  public getAiMoveDirection(enemyCube: CubeController, playerCube: CubeController, otherEnemyCubes: CubeController[]): Direction | null {
    const possibleDirections = this.getPossibleMoveDirections(enemyCube, otherEnemyCubes);
    
    if (possibleDirections.length === 0) {
      return null;
    }
    
    const playerPos = playerCube.position;
    const enemyPos = enemyCube.position;
    
    const enemyTopValue = enemyCube.getTopValue();
    const playerTopValue = playerCube.getTopValue();
    
    const isNearby = (
      (Math.abs(playerPos.x - enemyPos.x) <= 2 && playerPos.y === enemyPos.y) ||
      (Math.abs(playerPos.y - enemyPos.y) <= 2 && playerPos.x === enemyPos.x)
    );
    
    if (isNearby) {
      if (enemyTopValue > playerTopValue) {
        for (const direction of possibleDirections) {
          const newEnemyPos = this.getNewPosition(enemyPos, direction);
          
          const willBeAdjacent = (
            (Math.abs(playerPos.x - newEnemyPos.x) === 1 && playerPos.y === newEnemyPos.y) ||
            (Math.abs(playerPos.y - newEnemyPos.y) === 1 && playerPos.x === newEnemyPos.x)
          );
          
          const willBeSameCell = (playerPos.x === newEnemyPos.x && playerPos.y === newEnemyPos.y);
          
          if (willBeAdjacent || willBeSameCell) {
            return direction;
          }
        }
      } else if (enemyTopValue < playerTopValue) {
        for (const direction of possibleDirections) {
          const newEnemyPos = this.getNewPosition(enemyPos, direction);
          
          if (playerPos.x === newEnemyPos.x && playerPos.y === newEnemyPos.y) {
            continue;
          }
          
          const currentDistance = Math.abs(playerPos.x - enemyPos.x) + Math.abs(playerPos.y - enemyPos.y);
          const newDistance = Math.abs(playerPos.x - newEnemyPos.x) + Math.abs(playerPos.y - newEnemyPos.y);
          
          if (newDistance > currentDistance) {
            return direction;
          }
        }
      } else {
        const safeDirections = possibleDirections.filter(direction => {
          const newEnemyPos = this.getNewPosition(enemyPos, direction);
          return !(playerPos.x === newEnemyPos.x && playerPos.y === newEnemyPos.y);
        });
        
        if (safeDirections.length > 0) {
          const randomIndex = Math.floor(Math.random() * safeDirections.length);
          return safeDirections[randomIndex];
        }
      }
    }
    
    const randomIndex = Math.floor(Math.random() * possibleDirections.length);
    return possibleDirections[randomIndex];
  }

  private getNewPosition(position: Position, direction: Direction): Position {
    const newPosition = { ...position };

    switch (direction) {
      case 'up':
        newPosition.y += 1;
        break;
      case 'down':
        newPosition.y -= 1;
        break;
      case 'left':
        newPosition.x -= 1;
        break;
      case 'right':
        newPosition.x += 1;
        break;
    }

    return newPosition;
  }
} 