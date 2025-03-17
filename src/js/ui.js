export class UI {
  constructor(game) {
    this.game = game;
    this.movesCounter = 0;
    this.collectedNumbers = 0;
    this.totalTargetNumbers = 6;
    
    // Элементы UI
    this.movesCounterElement = document.getElementById('moves-counter');
    this.collectedNumbersElement = document.getElementById('collected-numbers');
    this.nextNumberElement = document.getElementById('next-number');
    this.gameStartScreen = document.getElementById('game-start');
    this.gameEndScreen = document.getElementById('game-end');
    this.totalMovesElement = document.getElementById('total-moves');
    
    // Кнопки
    this.startButton = document.getElementById('start-btn');
    this.restartButton = document.getElementById('restart-btn');
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
    this.showStartScreen();
    
    // Обновляем счетчики
    this.updateCounters();
  }

  setupEventListeners() {
    // Обработчики для кнопок управления
    this.upButton.addEventListener('click', () => this.handleMove('down'));
    this.leftButton.addEventListener('click', () => this.handleMove('left'));
    this.rightButton.addEventListener('click', () => this.handleMove('right'));
    this.downButton.addEventListener('click', () => this.handleMove('up'));
    
    // Обработчики для клавиатуры
    document.addEventListener('keydown', (event) => {
      if (this.game.isActive()) {
        switch (event.key.toLowerCase()) {
          case 'arrowup':
          case 'w':
            this.handleMove('down');
            break;
          case 'arrowdown':
          case 's':
            this.handleMove('up');
            break;
          case 'arrowleft':
          case 'a':
            this.handleMove('left');
            break;
          case 'arrowright':
          case 'd':
            this.handleMove('right');
            break;
          case 'q':
            this.handleCameraRotation('left');
            break;
          case 'e':
            this.handleCameraRotation('right');
            break;
          case 'D': // Shift+D для переключения режима отладки
            if (event.shiftKey) {
              this.game.toggleDebugHelpers();
            }
            break;
          case 'r':
            this.game.increaseCameraHeight();
            break;
          case 'f':
            this.game.decreaseCameraHeight();
            break;
        }
      }
    });
    
    // Обработчики для кнопок старта/рестарта
    this.startButton.addEventListener('click', () => {
      this.hideStartScreen();
      this.game.start();
    });
    
    this.restartButton.addEventListener('click', () => {
      this.hideEndScreen();
      this.reset();
      this.game.start();
    });
    
    // Обработчики для кнопок управления камерой
    document.getElementById('rotateLeft').addEventListener('click', () => {
      this.game.rotateCameraLeft();
    });
    
    document.getElementById('rotateRight').addEventListener('click', () => {
      this.game.rotateCameraRight();
    });
    
    // Обработчики для кнопок изменения высоты камеры
    document.getElementById('cameraUp').addEventListener('click', () => {
      this.game.increaseCameraHeight();
    });
    
    document.getElementById('cameraDown').addEventListener('click', () => {
      this.game.decreaseCameraHeight();
    });
  }

  handleMove(direction) {
    // Если игра не активна, игнорируем нажатия
    if (!this.game.isActive()) return;
    
    // Если кубик уже вращается, игнорируем нажатия
    if (this.game.isCubeRotating()) return;
    
    // Пытаемся сделать ход
    const moved = this.game.moveCube(direction);
    
    // Если ход успешен, увеличиваем счетчик ходов
    if (moved) {
      this.movesCounter++;
      this.updateCounters();
    }
  }

  handleCameraRotation(direction) {
    if (direction === 'left') {
      this.game.rotateCameraLeft();
    } else if (direction === 'right') {
      this.game.rotateCameraRight();
    }
  }

  updateCounters() {
    // Обновляем счетчик ходов
    this.movesCounterElement.textContent = `Ходы: ${this.movesCounter}`;
    
    // Обновляем счетчик собранных цифр
    this.collectedNumbersElement.textContent = `Собрано: ${this.collectedNumbers}/${this.totalTargetNumbers}`;
    
    // Обновляем информацию о следующей цифре
    const nextNumber = this.collectedNumbers + 1;
    if (nextNumber <= this.totalTargetNumbers) {
      this.nextNumberElement.textContent = `Следующая цель: ${nextNumber}`;
      this.nextNumberElement.style.display = 'block';
    } else {
      this.nextNumberElement.style.display = 'none';
    }
    
    // Обновляем информацию о смене препятствий
    if (this.game.isActive()) {
      const movesLeft = this.game.nextObstacleChange - this.game.moveCount;
      this.obstacleInfoElement.textContent = `Смена препятствий через: ${movesLeft} ходов`;
      this.obstacleInfoElement.style.display = 'block';
    } else {
      this.obstacleInfoElement.style.display = 'none';
    }
  }

  updateCollectedNumbers(count) {
    this.collectedNumbers = count;
    this.updateCounters();
    
    // Если собраны все цифры, показываем экран победы
    if (this.collectedNumbers === this.totalTargetNumbers) {
      this.showEndScreen();
    }
  }

  showStartScreen() {
    // Показываем стартовый экран без правил
    this.gameStartScreen.classList.remove('hidden');
    this.gameEndScreen.classList.add('hidden');
    
    // Скрываем индикатор следующей цифры на стартовом экране
    if (this.nextNumberElement) {
      this.nextNumberElement.style.display = 'none';
    }
    
    // Скрываем информацию о смене препятствий на стартовом экране
    this.obstacleInfoElement.style.display = 'none';
  }

  hideStartScreen() {
    this.gameStartScreen.classList.add('hidden');
    
    // Показываем индикатор следующей цифры при начале игры
    this.updateCounters();
  }

  showEndScreen() {
    this.totalMovesElement.textContent = this.movesCounter;
    this.gameEndScreen.classList.remove('hidden');
    
    // Скрываем индикатор следующей цифры на экране победы
    if (this.nextNumberElement) {
      this.nextNumberElement.style.display = 'none';
    }
    
    // Скрываем информацию о смене препятствий на экране победы
    this.obstacleInfoElement.style.display = 'none';
  }

  hideEndScreen() {
    this.gameEndScreen.classList.add('hidden');
  }

  reset() {
    this.movesCounter = 0;
    this.collectedNumbers = 0;
    this.updateCounters();
  }

  // Показываем уведомление
  showNotification(message, duration = 2000) {
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
