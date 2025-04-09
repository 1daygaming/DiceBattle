import { Game } from './game';

export interface UI {
  game: Game;
  movesCounter: number;
  collectedNumbers: number;
  totalTargetNumbers: number;
  movesCounterElement: HTMLElement | null;
  collectedNumbersElement: HTMLElement | null;
  nextNumberElement: HTMLElement | null;
  gameStartScreen: HTMLElement | null;
  gameEndScreen: HTMLElement | null;
  totalMovesElement: HTMLElement | null;
  startButton: HTMLElement | null;
  restartButton: HTMLElement | null;
  upButton: HTMLElement | null;
  leftButton: HTMLElement | null;
  rightButton: HTMLElement | null;
  downButton: HTMLElement | null;
  obstacleInfoElement: HTMLElement;
  notificationElement: HTMLElement;

  init(): void;
  setupEventListeners(): void;
  handleMove(direction: string): void;
  handleCameraRotation(direction: string): void;
  updateCounters(): void;
  updateCollectedNumbers(count: number): void;
  showStartScreen(): void;
  hideStartScreen(): void;
  showEndScreen(): void;
  hideEndScreen(): void;
  reset(): void;
  showNotification(message: string, duration?: number): void;
  createCameraControls(): void;
  updateScore(playerWins?: number, enemyWins?: number): void;
  updateObstacleInfo(movesLeft: number): void;
} 