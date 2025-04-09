import { Game } from "./game";

export class UI {
  game: Game;
  movesCounter: number = 0;
  collectedNumbers: number = 0;
  totalTargetNumbers: number = 6;
  movesCounterElement: HTMLElement | null = null;
  collectedNumbersElement: HTMLElement | null = null;
  nextNumberElement: HTMLElement | null = null;
  gameStartScreen: HTMLElement | null = null;
  gameEndScreen: HTMLElement | null = null;
  totalMovesElement: HTMLElement | null = null;
  startButton: HTMLElement | null = null;
  restartButton: HTMLElement | null = null;
  upButton: HTMLElement | null = null;
  leftButton: HTMLElement | null = null;
  rightButton: HTMLElement | null = null;
  downButton: HTMLElement | null = null;
  obstacleInfoElement!: HTMLElement;
  notificationElement!: HTMLElement;

  constructor(game: Game) {
    this.game = game;

    // Элементы UI
    this.nextNumberElement = document.getElementById('next-number');
    this.gameStartScreen = document.getElementById('game-start');
    this.gameEndScreen = document.getElementById('game-end');
    this.totalMovesElement = document.getElementById('total-moves');
    
    this.upButton = document.getElementById('up-btn');
    this.leftButton = document.getElementById('left-btn');
    this.rightButton = document.getElementById('right-btn');
    this.downButton = document.getElementById('down-btn');
    
    // Обновляем подсказки для кнопок управления кубиком
    if (this.upButton) this.upButton.title = 'Движение к вам (W или ↑)';
    if (this.leftButton) this.leftButton.title = 'Движение влево (A или ←)';
    if (this.rightButton) this.rightButton.title = 'Движение вправо (D или →)';
    if (this.downButton) this.downButton.title = 'Движение от вас (S или ↓)';
    
    // Создаем кнопки для вращения камеры
    this.createCameraControls();
    
    // Создаем элемент для отображения следующей цифры, если его нет
    if (!this.nextNumberElement) {
      this.nextNumberElement = document.createElement('div');
      this.nextNumberElement.id = 'next-number';
      this.nextNumberElement.style.position = 'absolute';
      this.nextNumberElement.style.top = '50px';
      this.nextNumberElement.style.right = '20px';
      this.nextNumberElement.style.backgroundColor = 'rgba(76, 175, 80, 0.8)';
      this.nextNumberElement.style.color = 'white';
      this.nextNumberElement.style.padding = '10px 20px';
      this.nextNumberElement.style.borderRadius = '5px';
      this.nextNumberElement.style.fontWeight = 'bold';
      this.nextNumberElement.style.fontSize = '18px';
      document.body.appendChild(this.nextNumberElement);
    }
    
    // Создаем элемент для отображения информации о смене препятствий
    this.obstacleInfoElement = document.createElement('div');
    this.obstacleInfoElement.id = 'obstacle-info';
    this.obstacleInfoElement.style.position = 'absolute';
    this.obstacleInfoElement.style.top = '90px';
    this.obstacleInfoElement.style.right = '20px';
    this.obstacleInfoElement.style.backgroundColor = 'rgba(198, 40, 40, 0.8)';
    this.obstacleInfoElement.style.color = 'white';
    this.obstacleInfoElement.style.padding = '10px 20px';
    this.obstacleInfoElement.style.borderRadius = '5px';
    this.obstacleInfoElement.style.fontWeight = 'bold';
    this.obstacleInfoElement.style.fontSize = '16px';
    document.body.appendChild(this.obstacleInfoElement);
    
    // Создаем элемент для уведомлений
    this.notificationElement = document.createElement('div');
    this.notificationElement.id = 'notification';
    this.notificationElement.style.position = 'absolute';
    this.notificationElement.style.top = '50%';
    this.notificationElement.style.left = '50%';
    this.notificationElement.style.transform = 'translate(-50%, -50%)';
    this.notificationElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.notificationElement.style.color = 'white';
    this.notificationElement.style.padding = '20px 30px';
    this.notificationElement.style.borderRadius = '10px';
    this.notificationElement.style.fontWeight = 'bold';
    this.notificationElement.style.fontSize = '24px';
    this.notificationElement.style.zIndex = '1000';
    this.notificationElement.style.display = 'none';
    this.notificationElement.style.textAlign = 'center';
    document.body.appendChild(this.notificationElement);
  }

  init() {
    // Инициализация обработчиков событий
    this.setupEventListeners();
    
    // Показываем стартовый экран
   // this.showStartScreen();

    // Обновляем счетчики
  //  this.updateCounters();
  }

  setupEventListeners() {
    // Обработчики для кнопок управления камерой
    const rotateLeftButton = document.getElementById('rotateLeft');
    if (rotateLeftButton) {
      rotateLeftButton.addEventListener('click', () => {
        this.game.cameraController?.rotateLeft();
      });
    }
    
    const rotateRightButton = document.getElementById('rotateRight');
    if (rotateRightButton) {
      rotateRightButton.addEventListener('click', () => {
        this.game.cameraController?.rotateRight();
      });
    }
    
    // Обработчики для кнопок изменения высоты камеры
    const cameraUpButton = document.getElementById('cameraUp');
    if (cameraUpButton) {
      cameraUpButton.addEventListener('click', () => {
        this.game.cameraController?.increaseHeight();
      });
    }
    
    const cameraDownButton = document.getElementById('cameraDown');
    if (cameraDownButton) {
      cameraDownButton.addEventListener('click', () => {
        this.game.cameraController?.decreaseHeight();
      });
    }
  }

  updateCounters() {
    // Обновляем информацию о смене препятствий
    if (this.game.state.active) {
      const movesLeft = 0
      this.obstacleInfoElement.textContent = `Смена препятствий через: ${movesLeft} ходов`;
      this.obstacleInfoElement.style.display = 'block';
    } else {
      this.obstacleInfoElement.style.display = 'none';
    }
  }

  updateCollectedNumbers(count: number) {
    this.updateCounters();
    
    // Если собраны все цифры, показываем экран победы
    //this.collectedNumbers === this.totalTargetNumbers
    //  this.showEndScreen();
  }

  showStartScreen() {
    // Показываем стартовый экран без правил
    if (this.gameStartScreen && this.gameEndScreen) {
      this.gameStartScreen.classList.remove('hidden');
      this.gameEndScreen.classList.add('hidden');
    }
    
    // Скрываем индикатор следующей цифры на стартовом экране
    if (this.nextNumberElement) {
      this.nextNumberElement.style.display = 'none';
    }
    
    // Скрываем информацию о смене препятствий на стартовом экране
    this.obstacleInfoElement.style.display = 'none';
  }

  hideStartScreen() {
    if (this.gameStartScreen) {
      this.gameStartScreen.classList.add('hidden');
    }
    
    // Показываем индикатор следующей цифры при начале игры
    this.updateCounters();
  }

  showEndScreen() {
    if (this.totalMovesElement && this.gameEndScreen) {
      this.totalMovesElement.textContent = '0'; //this.movesCounter.toString();
      this.gameEndScreen.classList.remove('hidden');
    }
    
    // Скрываем индикатор следующей цифры на экране победы
    if (this.nextNumberElement) {
      this.nextNumberElement.style.display = 'none';
    }
    
    // Скрываем информацию о смене препятствий на экране победы
    this.obstacleInfoElement.style.display = 'none';
  }

  hideEndScreen() {
    if (this.gameEndScreen) {
      this.gameEndScreen.classList.add('hidden');
    }
  }

  reset() {
    this.updateCounters();
  }

  // Показываем уведомление
  showNotification(message: string, duration = 2000) {
    this.notificationElement.textContent = message;
    this.notificationElement.classList.remove('hiding');
    this.notificationElement.style.display = 'block';
    
    // Скрываем уведомление через указанное время
    setTimeout(() => {
      this.notificationElement.classList.add('hiding');
      
      // Полностью скрываем элемент после завершения анимации
      setTimeout(() => {
        this.notificationElement.style.display = 'none';
        this.notificationElement.classList.remove('hiding');
      }, 300); // Длительность анимации fadeOut
    }, duration);
  }

  // Создаем кнопки для вращения камеры
  createCameraControls() {
    // Создаем контейнер для кнопок управления камерой
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'cameraControls';
    buttonsContainer.className = 'camera-controls';
    
    // Кнопки вращения камеры
    const rotateLeftButton = document.createElement('button');
    rotateLeftButton.id = 'rotateLeft';
    rotateLeftButton.title = 'Повернуть камеру влево (Q)';
    rotateLeftButton.innerHTML = '&#8634;'; // Символ вращения влево
    
    const rotateRightButton = document.createElement('button');
    rotateRightButton.id = 'rotateRight';
    rotateRightButton.title = 'Повернуть камеру вправо (E)';
    rotateRightButton.innerHTML = '&#8635;'; // Символ вращения вправо
    
    // Кнопки изменения высоты камеры
    const cameraUpButton = document.createElement('button');
    cameraUpButton.id = 'cameraUp';
    cameraUpButton.title = 'Поднять камеру (R)';
    cameraUpButton.innerHTML = '&#8593;'; // Стрелка вверх
    
    const cameraDownButton = document.createElement('button');
    cameraDownButton.id = 'cameraDown';
    cameraDownButton.title = 'Опустить камеру (F)';
    cameraDownButton.innerHTML = '&#8595;'; // Стрелка вниз
    
    // Добавляем кнопки в контейнер
    buttonsContainer.appendChild(rotateLeftButton);
    buttonsContainer.appendChild(rotateRightButton);
    buttonsContainer.appendChild(cameraUpButton);
    buttonsContainer.appendChild(cameraDownButton);
    
    // Добавляем контейнер в DOM
    document.body.appendChild(buttonsContainer);
  }

  // Обновляем счет битв (пустой метод, чтобы не было ошибок)
  updateScore() {
    // Ничего не делаем, счетчик скрыт
  }
}
