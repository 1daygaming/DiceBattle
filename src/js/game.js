import * as THREE from 'three';
import { Board } from './board.js';
import { Cube } from './cube.js';

export class Game {
  constructor(boardSize, cellSize) {
    // Настройки игры
    this.boardSize = boardSize || { width: 10, height: 10 };
    this.cellSize = cellSize || 1;
    
    // Состояние игры
    this.active = false;
    this.collectedNumbers = new Set();
    this.moveCount = 0; // Счетчик ходов
    this.nextObstacleChange = this.getRandomObstacleChangeInterval(); // Интервал до следующего изменения препятствий
    
    // Компоненты Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = [];
    
    // Игровые объекты
    this.board = null;
    this.cube = null;
    this.enemyCubes = []; // Массив вражеских кубиков
    this.cubePositionHelper = null;
    
    // Эффекты
    this.teleportEffects = [];
    
    // Счетчики побед/поражений
    this.playerWins = 0;
    this.enemyWins = 0;
    
    // Настройки ИИ
    this.aiEnabled = true; // Включен ли ИИ
    this.lastMoveDirection = null; // Последнее направление движения
    
    // Вспомогательные объекты для отладки
    this.debugHelpers = {
      enabled: true, // Включаем отладочные элементы по умолчанию
      axesHelper: null,
      gridHelper: null
    };
    
    // Ссылка на UI
    this.ui = null;
    
    // Настройки камеры
    this.cameraAngle = 45; // начальный угол камеры (в градусах)
    this.targetCameraAngle = 45; // целевой угол для анимации
    this.cameraAnimating = false; // флаг анимации камеры
  }

  init() {
    // Инициализация Three.js
    this.initThree();
    
    // Создание игровых объектов
    this.createGameObjects();
    
    // Настройка камеры
    this.setupCamera();
    
    // Добавление освещения
    this.setupLights();
    
    // Добавление объектов на сцену
    this.addObjectsToScene();
    
    // Настройка рендерера
    this.setupRenderer();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Удаляем отладочный элемент, если он существует и режим отладки выключен
    if (!this.debugHelpers.enabled) {
      const debugInfoElement = document.getElementById('debug-info');
      if (debugInfoElement) {
        debugInfoElement.remove();
      }
    }
    
    // Обновляем отладочную информацию, если режим отладки включен
    this.updateDebugInfo();
  }

  initThree() {
    // Создаем сцену
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // Создаем перспективную камеру
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  }

  createGameObjects() {
    // Создаем игровое поле
    this.board = new Board(this.boardSize.width, this.boardSize.height, this.cellSize);
    
    // Создаем кубик игрока
    this.cube = new Cube(this.cellSize);
    
    // Создаем вражеские кубики (3 штуки)
    for (let i = 0; i < 3; i++) {
      const enemyCube = new Cube(this.cellSize);
      enemyCube.setColor(0xff0000); // Красный цвет для всех вражеских кубиков
      this.enemyCubes.push(enemyCube);
    }
    
    // Создаем вспомогательный объект для визуализации позиции кубика
    const cubePositionGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const cubePositionMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.cubePositionHelper = new THREE.Mesh(cubePositionGeometry, cubePositionMaterial);
    this.cubePositionHelper.position.y = 0.2;
  }

  setupCamera() {
    // Позиционируем камеру для перспективного вида
    const boardWidth = this.boardSize.width * this.cellSize;
    const boardHeight = this.boardSize.height * this.cellSize;
    const maxDimension = Math.max(boardWidth, boardHeight);
    
    // Настраиваем поле зрения (FOV) для перспективной камеры
    // Увеличиваем FOV для более широкого обзора
    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();
    
    // Увеличиваем расстояние камеры, чтобы поле всегда помещалось в поле зрения
    this.cameraDistance = maxDimension * 2.5;
    this.cameraHeight = maxDimension * 1.5; // Увеличиваем высоту камеры
    
    // Устанавливаем начальную позицию камеры
    this.updateCameraPosition();
  }
  
  // Обновляем позицию камеры в зависимости от текущего угла
  updateCameraPosition() {
    // Преобразуем угол из градусов в радианы
    const angleRad = (this.cameraAngle * Math.PI) / 180;
    
    // Вычисляем позицию камеры на основе угла и расстояния
    const x = Math.sin(angleRad) * this.cameraDistance;
    const z = Math.cos(angleRad) * this.cameraDistance;
    
    // Устанавливаем позицию камеры
    this.camera.position.set(x, this.cameraHeight, z);
    
    // Направляем камеру на центр сцены, но немного вниз для лучшего обзора
    this.camera.lookAt(0, -2, 0);
    
    // Обновляем матрицу проекции камеры
    this.camera.updateProjectionMatrix();
  }
  
  // Анимируем вращение камеры
  animateCameraRotation() {
    if (!this.cameraAnimating) return;
    
    // Вычисляем кратчайший путь к целевому углу
    let angleDiff = this.targetCameraAngle - this.cameraAngle;
    
    // Нормализуем разницу углов в диапазоне [-180, 180]
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    
    // Используем фиксированную скорость вращения
    const rotationSpeed = 5;
    
    // Если мы достаточно близко к целевому углу, завершаем анимацию
    if (Math.abs(angleDiff) < rotationSpeed) {
      this.cameraAngle = this.targetCameraAngle;
      this.cameraAnimating = false;
      this.updateCameraPosition();
      return;
    }
    
    // Иначе делаем шаг в направлении целевого угла
    const step = Math.sign(angleDiff) * rotationSpeed;
    this.cameraAngle += step;
    
    // Нормализуем угол в диапазоне [0, 360]
    this.cameraAngle = (this.cameraAngle + 360) % 360;
    
    // Обновляем позицию камеры
    this.updateCameraPosition();
  }
  
  // Поворачиваем камеру влево на 90 градусов
  rotateCameraLeft() {
    this.targetCameraAngle = (this.cameraAngle + 90) % 360;
    this.cameraAnimating = true;
  }
  
  // Поворачиваем камеру вправо на 90 градусов
  rotateCameraRight() {
    this.targetCameraAngle = (this.cameraAngle - 90 + 360) % 360;
    this.cameraAnimating = true;
  }

  setupLights() {
    // Добавляем окружающий свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
    
    // Добавляем направленный свет (как солнце)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    
    // Настройка теней
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    
    const shadowSize = this.boardSize.width * this.cellSize * 0.8;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
  }

  addObjectsToScene() {
    // Добавляем игровое поле
    this.scene.add(this.board.mesh);
    
    // Устанавливаем ссылку на сцену для кубика игрока
    this.cube.setScene(this.scene);
    
    // Добавляем кубик игрока
    this.scene.add(this.cube.mesh);
    
    // Устанавливаем ссылку на сцену для вражеских кубиков и добавляем их
    for (const enemyCube of this.enemyCubes) {
      enemyCube.setScene(this.scene);
      this.scene.add(enemyCube.mesh);
    }
    
    // Добавляем вспомогательный объект для визуализации позиции кубика
    //this.scene.add(this.cubePositionHelper);
    
    // Добавляем вспомогательные объекты для отладки
    if (this.debugHelpers.enabled) {
      // Добавляем вспомогательные оси координат
      //this.debugHelpers.axesHelper = new THREE.AxesHelper(this.boardSize.width * this.cellSize);
      //this.scene.add(this.debugHelpers.axesHelper);
      
      // Добавляем вспомогательную сетку
      const gridSize = this.boardSize.width * this.cellSize * 2;
      const gridDivisions = this.boardSize.width * 2;
      this.debugHelpers.gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
      this.scene.add(this.debugHelpers.gridHelper);
    }
  }

  setupRenderer() {
    // Создаем рендерер
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Добавляем рендерер на страницу
    const container = document.getElementById('game-canvas');

    console.log('container', container)
    container.appendChild(this.renderer.domElement);
  }

  onWindowResize() {
    // Получаем новое соотношение сторон
    const aspect = window.innerWidth / window.innerHeight;
    
    // Обновляем параметры перспективной камеры
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    
    // Обновляем размер рендерера
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    // Сбрасываем состояние игры
    this.reset();
    
    // Активируем игру
    this.active = true;
  }

  reset() {
    // Сбрасываем собранные цифры
    this.collectedNumbers.clear();
    
    // Сбрасываем счетчик ходов и интервал изменения препятствий
    this.moveCount = 0;
    this.nextObstacleChange = this.getRandomObstacleChangeInterval();
    
    // Сбрасываем позицию кубика игрока
    const startPosition = this.board.getStartPosition();
    this.cube.reset(startPosition);
    
    // Обновляем позицию меша кубика в соответствии с координатной системой поля
    const worldX = startPosition.x * this.cellSize - (this.boardSize.width * this.cellSize) / 2 + this.cellSize / 2;
    const worldZ = startPosition.y * this.cellSize - (this.boardSize.height * this.cellSize) / 2 + this.cellSize / 2;
    
    this.cube.mesh.position.set(
      worldX,
      this.cellSize / 2,
      worldZ
    );
    
    // Сбрасываем вращение кубика игрока
    this.cube.mesh.rotation.set(0, 0, 0);
    
    // Размещаем вражеские кубики в случайных свободных ячейках
    let occupiedPositions = [startPosition];
    
    for (const enemyCube of this.enemyCubes) {
      // Получаем случайную свободную позицию, отличную от занятых позиций
      const enemyPosition = this.getRandomFreePosition(occupiedPositions);
      
      // Сбрасываем кубик
      enemyCube.reset(enemyPosition);
      
      // Добавляем позицию в список занятых
      occupiedPositions.push(enemyPosition);
      
      // Обновляем позицию меша вражеского кубика
      const enemyWorldX = enemyPosition.x * this.cellSize - (this.boardSize.width * this.cellSize) / 2 + this.cellSize / 2;
      const enemyWorldZ = enemyPosition.y * this.cellSize - (this.boardSize.height * this.cellSize) / 2 + this.cellSize / 2;
      
      enemyCube.mesh.position.set(
        enemyWorldX,
        this.cellSize / 2,
        enemyWorldZ
      );
      
      // Сбрасываем вращение вражеского кубика
      enemyCube.mesh.rotation.set(0, 0, 0);
    }
    
    // Обновляем позицию вспомогательного объекта
    this.cubePositionHelper.position.x = worldX;
    this.cubePositionHelper.position.z = worldZ;
    
    // Сбрасываем подсветку целевых ячеек
    this.board.updateTargetCellsHighlight(1);
    
    // Сбрасываем счет
    this.playerWins = 0;
    this.enemyWins = 0;
    
    // Обновляем UI
    if (this.ui) {
      this.ui.updateScore(this.playerWins, this.enemyWins);
    }
  }

  animate() {
    // Запускаем цикл анимации
    requestAnimationFrame(() => this.animate());
    
    // Анимируем вращение камеры
    if (this.cameraAnimating) {
      this.animateCameraRotation();
    }
    
    // Обновляем эффекты телепортации
    this.updateTeleportEffects();
    
    // Обновляем состояние кубиков
    if (this.active) {
      const playerRotationCompleted = this.cube.update(this.boardSize, this.cellSize);
      
      // Обновляем вражеские кубики
      const enemyRotationsCompleted = this.enemyCubes.map(enemyCube => 
        enemyCube.update(this.boardSize, this.cellSize)
      );
      
      // Если вращение завершено и кубики не телепортируются, проверяем столкновения
      const allEnemyCubesReady = enemyRotationsCompleted.every(completed => completed !== false) && 
                                this.enemyCubes.every(enemyCube => !enemyCube.teleporting);
      
      if (playerRotationCompleted && !this.cube.teleporting && allEnemyCubesReady) {
        this.checkTargetCell();
        
        // Проверяем столкновение кубиков
        if (!this.cube.rotationInProgress && this.enemyCubes.every(enemyCube => !enemyCube.rotationInProgress)) {
          this.checkCubesCollision();
        }
      }
      
      // Обновляем позицию вспомогательного объекта
      const worldX = this.cube.position.x * this.cellSize - (this.boardSize.width * this.cellSize) / 2 + this.cellSize / 2;
      const worldZ = this.cube.position.y * this.cellSize - (this.boardSize.height * this.cellSize) / 2 + this.cellSize / 2;
      this.cubePositionHelper.position.x = worldX;
      this.cubePositionHelper.position.z = worldZ;
    }
    
    // Обновляем отладочную информацию
    this.updateDebugInfo();
    
    // Рендерим сцену
    this.renderer.render(this.scene, this.camera);
  }

  // Преобразуем направление движения с учетом угла камеры
  transformDirectionByCamera(direction) {
    // Определяем, в каком квадранте находится камера
    // Нормализуем угол камеры к диапазону [0, 360)
    const normalizedAngle = (this.cameraAngle % 360 + 360) % 360;
    
    // Определяем сектор (каждые 90 градусов)
    const sector = Math.floor((normalizedAngle + 45) / 90) % 4;
    
    // Преобразуем направление в зависимости от сектора
    switch (sector) {
      case 0: // Примерно 0 градусов (камера смотрит с севера)
        return direction; // Направления не меняются
      case 1: // Примерно 90 градусов (камера смотрит с востока)
        // Поворот на 90 градусов по часовой стрелке
        switch (direction) {
          case 'up': return 'right';
          case 'right': return 'down';
          case 'down': return 'left';
          case 'left': return 'up';
          default: return direction;
        }
      case 2: // Примерно 180 градусов (камера смотрит с юга)
        // Поворот на 180 градусов
        switch (direction) {
          case 'up': return 'down';
          case 'right': return 'left';
          case 'down': return 'up';
          case 'left': return 'right';
          default: return direction;
        }
      case 3: // Примерно 270 градусов (камера смотрит с запада)
        // Поворот на 90 градусов против часовой стрелки
        switch (direction) {
          case 'up': return 'left';
          case 'right': return 'up';
          case 'down': return 'right';
          case 'left': return 'down';
          default: return direction;
        }
      default:
        return direction;
    }
  }

  moveCube(direction) {
    // Если игра не активна или кубики уже вращаются или телепортируются, игнорируем
    if (!this.active || 
        this.cube.rotationInProgress || 
        this.enemyCubes.some(enemyCube => enemyCube.rotationInProgress) ||
        this.cube.teleporting ||
        this.enemyCubes.some(enemyCube => enemyCube.teleporting)) return false;
    
    // Преобразуем направление с учетом угла камеры
    const transformedDirection = this.transformDirectionByCamera(direction);
    
    // Проверяем, может ли игрок сделать ход
    const canPlayerMove = this.cube.canRotate(transformedDirection, this.board.getSize(), this.cellSize, this.board);
    
    if (!canPlayerMove) {
      return false; // Если игрок не может двигаться, ход не выполняется
    }
    
    // Начинаем вращение кубика игрока
    this.cube.startRotation(transformedDirection, this.board.getSize(), this.cellSize, this.board);
    
    // Определяем направления для вражеских кубиков и начинаем их вращение
    // Сначала собираем все запланированные ходы вражеских кубиков
    const enemyMoves = [];
    
    for (const enemyCube of this.enemyCubes) {
      // Определяем направление для вражеского кубика
      const enemyDirection = this.getAiMoveDirection(enemyCube);
      
      if (enemyDirection) {
        // Преобразуем направление для врага с учетом угла камеры
        const transformedEnemyDirection = this.transformDirectionByCamera(enemyDirection);
        
        // Проверяем, может ли враг сделать ход
        const canEnemyMove = enemyCube.canRotate(transformedEnemyDirection, this.board.getSize(), this.cellSize, this.board);
        
        // Если враг может двигаться, добавляем ход в список запланированных
        if (canEnemyMove) {
          enemyMoves.push({
            cube: enemyCube,
            direction: transformedEnemyDirection,
            newPosition: this.getNewPosition(enemyCube.position, enemyDirection)
          });
        }
      }
    }
    
    // Проверяем, не приведут ли запланированные ходы к столкновению вражеских кубиков
    const validEnemyMoves = this.filterValidEnemyMoves(enemyMoves);
    
    // Выполняем валидные ходы вражеских кубиков
    for (const move of validEnemyMoves) {
      move.cube.startRotation(move.direction, this.board.getSize(), this.cellSize, this.board);
    }
    
    // Увеличиваем счетчик ходов
    this.moveCount++;
    
    // Сохраняем последнее направление движения
    this.lastMoveDirection = direction;
    
    // Проверяем, нужно ли обновить препятствия
    if (this.moveCount >= this.nextObstacleChange) {
      this.updateObstacles();
    }
    
    return true;
  }
  
  // Получаем новую позицию после хода в указанном направлении
  getNewPosition(position, direction) {
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
  
  // Фильтруем ходы вражеских кубиков, чтобы избежать столкновений
  filterValidEnemyMoves(enemyMoves) {
    // Если нет ходов, возвращаем пустой массив
    if (enemyMoves.length === 0) {
      return [];
    }
    
    // Создаем карту новых позиций
    const positionMap = new Map();
    
    // Добавляем текущие позиции кубиков в карту
    for (const enemyCube of this.enemyCubes) {
      const posKey = `${enemyCube.position.x},${enemyCube.position.y}`;
      positionMap.set(posKey, enemyCube);
    }
    
    // Фильтруем ходы, чтобы избежать столкновений
    const validMoves = [];
    
    for (const move of enemyMoves) {
      const newPosKey = `${move.newPosition.x},${move.newPosition.y}`;
      
      // Проверяем, не занята ли новая позиция другим кубиком
      if (!positionMap.has(newPosKey)) {
        // Добавляем ход в список валидных
        validMoves.push(move);
        
        // Обновляем карту позиций
        const oldPosKey = `${move.cube.position.x},${move.cube.position.y}`;
        positionMap.delete(oldPosKey);
        positionMap.set(newPosKey, move.cube);
      }
    }
    
    return validMoves;
  }

  checkTargetCell() {
    // Получаем текущую позицию кубика
    const { x, y } = this.cube.position;
    
    // Получаем значение нижней грани кубика
    const bottomValue = this.cube.getBottomValue();
    
    // Определяем следующую цифру, которую нужно собрать
    const nextNumberToCollect = this.collectedNumbers.size + 1;
    
    // Проверяем, находится ли кубик на целевой ячейке с соответствующим значением
    // и является ли это значение следующим в последовательности
    if (this.board.checkTargetCell(x, y, bottomValue) && bottomValue === nextNumberToCollect) {
      // Добавляем собранное значение
      this.collectedNumbers.add(bottomValue);
      
      // Обновляем подсветку целевых ячеек
      this.board.updateTargetCellsHighlight(nextNumberToCollect + 1);
      
      // Уведомляем UI о изменении количества собранных цифр
      if (this.onCollectedNumbersChanged) {
        this.onCollectedNumbersChanged(this.collectedNumbers.size);
      }
      
      // Если собраны все цифры, завершаем игру
      if (this.collectedNumbers.size === this.board.getTargetCellsCount()) {
        this.active = false;
        
        // Уведомляем о завершении игры
        if (this.onGameCompleted) {
          this.onGameCompleted();
        }
      }
    }
  }

  // Устанавливаем обработчик изменения количества собранных цифр
  setCollectedNumbersChangedHandler(handler) {
    this.onCollectedNumbersChanged = handler;
  }

  // Устанавливаем обработчик завершения игры
  setGameCompletedHandler(handler) {
    this.onGameCompleted = handler;
  }

  // Проверяем, активна ли игра
  isActive() {
    return this.active;
  }

  // Проверяем, вращается ли кубик
  isCubeRotating() {
    return this.cube.rotationInProgress;
  }

  // Обновляем отладочную информацию
  updateDebugInfo() {
    return;
    // Если отладка отключена, ничего не делаем
    if (!this.debugHelpers.enabled) return;
    
    // Создаем или обновляем элемент для отображения отладочной информации
    let debugInfoElement = document.getElementById('debug-info');
    if (!debugInfoElement) {
      debugInfoElement = document.createElement('div');
      debugInfoElement.id = 'debug-info';
      debugInfoElement.style.position = 'absolute';
      debugInfoElement.style.top = '10px';
      debugInfoElement.style.left = '10px';
      debugInfoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugInfoElement.style.color = 'white';
      debugInfoElement.style.padding = '10px';
      debugInfoElement.style.fontFamily = 'monospace';
      debugInfoElement.style.fontSize = '12px';
      debugInfoElement.style.zIndex = '1000';
      debugInfoElement.style.display = 'block';
      document.body.appendChild(debugInfoElement);
    }
    
    // Обновляем содержимое
    const { top, bottom, left, right, front, back } = this.cube.faceValues;
    debugInfoElement.innerHTML = `
      <div>Позиция: x=${this.cube.position.x}, y=${this.cube.position.y}</div>
      <div>Грани:</div>
      <div>- Верх: ${top}</div>
      <div>- Низ: ${bottom}</div>
      <div>- Лево: ${left}</div>
      <div>- Право: ${right}</div>
      <div>- Перед: ${front}</div>
      <div>- Зад: ${back}</div>
    `;
  }

  // Включить/выключить вспомогательные объекты для отладки
  toggleDebugHelpers() {
    this.debugHelpers.enabled = !this.debugHelpers.enabled;
    
    if (this.debugHelpers.enabled) {
      // Включаем вспомогательные объекты
      if (this.debugHelpers.axesHelper) {
        this.scene.add(this.debugHelpers.axesHelper);
      }
      if (this.debugHelpers.gridHelper) {
        this.scene.add(this.debugHelpers.gridHelper);
      }
      this.scene.add(this.cubePositionHelper);
      //this.cube.orientationHelpers.visible = true;
      
      // Обновляем отладочную информацию
      this.updateDebugInfo();
      const debugInfoElement = document.getElementById('debug-info');
      if (debugInfoElement) {
        debugInfoElement.style.display = 'block';
      }
    } else {
      // Выключаем вспомогательные объекты
      if (this.debugHelpers.axesHelper) {
        this.scene.remove(this.debugHelpers.axesHelper);
      }
      if (this.debugHelpers.gridHelper) {
        this.scene.remove(this.debugHelpers.gridHelper);
      }
      this.scene.remove(this.cubePositionHelper);
      //this.cube.orientationHelpers.visible = false;
      
      // Скрываем отладочную информацию
      const debugInfoElement = document.getElementById('debug-info');
      if (debugInfoElement) {
        debugInfoElement.style.display = 'none';
      }
    }
  }

  // Получаем случайный интервал для изменения препятствий (15-20 ходов)
  getRandomObstacleChangeInterval() {
    return Math.floor(Math.random() * 6) + 15; // от 15 до 20
  }

  // Устанавливаем ссылку на UI
  setUI(ui) {
    this.ui = ui;
  }

  // Обновляем препятствия
  updateObstacles() {
    console.log("Обновляем препятствия!");
    
    // Сохраняем текущую позицию кубика
    const cubePosition = { ...this.cube.position };
    
    // Обновляем препятствия на доске, передавая текущую позицию кубика
    this.board.setupObstacleCells(cubePosition);
    
    // Сбрасываем счетчик до следующего изменения препятствий
    this.nextObstacleChange = this.getRandomObstacleChangeInterval();
    // Сбрасываем счетчик ходов для отсчета до следующего изменения
    this.moveCount = 0;
    
    console.log(`Следующее изменение препятствий через ${this.nextObstacleChange} ходов`);
    
    // Убираем показ уведомления
  }
  
  // Увеличить высоту камеры
  increaseCameraHeight() {
    const maxDimension = Math.max(this.boardSize.width, this.boardSize.height) * this.cellSize;
    const newHeight = Math.min(this.cameraHeight + maxDimension * 0.15, maxDimension * 3);
    this.cameraHeight = newHeight;
    this.updateCameraPosition();
  }
  
  // Уменьшить высоту камеры
  decreaseCameraHeight() {
    const maxDimension = Math.max(this.boardSize.width, this.boardSize.height) * this.cellSize;
    const newHeight = Math.max(this.cameraHeight - maxDimension * 0.15, maxDimension * 0.8);
    this.cameraHeight = newHeight;
    this.updateCameraPosition();
  }

  // Получаем случайную свободную позицию, отличную от указанных
  getRandomFreePosition(excludePositions) {
    const allPositions = [];
    
    // Собираем все свободные позиции
    for (let y = 0; y < this.boardSize.height; y++) {
      for (let x = 0; x < this.boardSize.width; x++) {
        // Пропускаем позиции, которые нужно исключить
        if (excludePositions.some(pos => pos.x === x && pos.y === y)) continue;
        
        // Пропускаем препятствия
        if (this.board.isObstacle(x, y)) continue;
        
        allPositions.push({ x, y });
      }
    }
    
    // Если нет свободных позиций, возвращаем позицию по умолчанию
    if (allPositions.length === 0) {
      return { x: 0, y: 0 };
    }
    
    // Выбираем случайную позицию
    const randomIndex = Math.floor(Math.random() * allPositions.length);
    return allPositions[randomIndex];
  }

  // Проверяем столкновение кубиков
  checkCubesCollision() {
    // Получаем позицию кубика игрока
    const playerPos = this.cube.position;
    
    // Проверяем столкновение с каждым вражеским кубиком
    for (const enemyCube of this.enemyCubes) {
      // Получаем позицию вражеского кубика
      const enemyPos = enemyCube.position;
      
      // Проверяем, находятся ли кубики на одной клетке
      const isSameCell = (playerPos.x === enemyPos.x && playerPos.y === enemyPos.y);
      
      // Проверяем, находятся ли кубики на соседних клетках
      const isAdjacent = (
        // По горизонтали
        (Math.abs(playerPos.x - enemyPos.x) === 1 && playerPos.y === enemyPos.y) ||
        // По вертикали
        (Math.abs(playerPos.y - enemyPos.y) === 1 && playerPos.x === enemyPos.x)
      );
      
      if (isSameCell || isAdjacent) {
        console.log("Кубики столкнулись! Начинаем битву!");
        
        // Получаем значения верхних граней
        const playerTopValue = this.cube.getTopValue();
        const enemyTopValue = enemyCube.getTopValue();
        
        // Выводим подробную отладочную информацию
        console.log("Значения граней игрока:", this.cube.faceValues);
        console.log("Значения граней врага:", enemyCube.faceValues);
        console.log(`Значение игрока: ${playerTopValue}, значение врага: ${enemyTopValue}`);
        
        // Определяем победителя
        if (playerTopValue > enemyTopValue) {
          // Игрок победил
          console.log("Игрок победил!");
          this.playerWins++;
          
          // Телепортируем вражеский кубик
          this.teleportEnemyCube(enemyCube);
        } else if (enemyTopValue > playerTopValue) {
          // Враг победил
          console.log("Враг победил!");
          this.enemyWins++;
          
          // Телепортируем кубик игрока
          this.teleportPlayerCube();
        } else {
          // Ничья
          console.log("Ничья!");
          
          // При ничье на одной клетке телепортируем оба кубика
          if (isSameCell) {
            this.teleportBothCubes(enemyCube);
          }
        }
        
        // После обработки столкновения с одним кубиком прерываем цикл
        break;
      }
    }
  }
  
  // Телепортируем вражеский кубик в случайную свободную ячейку
  teleportEnemyCube(enemyCube) {
    // Собираем все текущие позиции кубиков
    const allPositions = [
      this.cube.position, 
      ...this.enemyCubes.map(cube => cube.position)
    ];
    
    // Получаем случайную свободную позицию, отличную от всех текущих позиций
    const newPosition = this.getRandomFreePosition(allPositions);
    
    // Запускаем анимацию телепортации
    this.animateTeleport(enemyCube, newPosition);
  }
  
  // Телепортируем кубик игрока в случайную свободную ячейку
  teleportPlayerCube() {
    // Собираем все текущие позиции кубиков
    const allPositions = this.enemyCubes.map(cube => cube.position);
    
    // Получаем случайную свободную позицию, отличную от всех текущих позиций
    const newPosition = this.getRandomFreePosition(allPositions);
    
    // Запускаем анимацию телепортации
    this.animateTeleport(this.cube, newPosition);
  }

  // Телепортируем оба кубика в случае ничьей на одной клетке
  teleportBothCubes(enemyCube) {
    // Собираем все текущие позиции кубиков, кроме игрока и текущего врага
    const otherPositions = this.enemyCubes
      .filter(cube => cube !== enemyCube)
      .map(cube => cube.position);
    
    // Телепортируем кубик игрока
    const newPlayerPosition = this.getRandomFreePosition(otherPositions);
    
    // Добавляем новую позицию игрока в список занятых позиций
    const updatedPositions = [...otherPositions, newPlayerPosition];
    
    // Запускаем анимацию телепортации для игрока
    this.animateTeleport(this.cube, newPlayerPosition);
    
    // Телепортируем вражеский кубик
    const newEnemyPosition = this.getRandomFreePosition(updatedPositions);
    
    // Запускаем анимацию телепортации для врага
    this.animateTeleport(enemyCube, newEnemyPosition);
  }
  
  // Анимация телепортации кубика
  animateTeleport(cube, newPosition) {
    // Флаг, указывающий, что идет анимация телепортации
    cube.teleporting = true;
    
    // Текущая позиция кубика в мировых координатах
    const currentWorldX = cube.mesh.position.x;
    const currentWorldZ = cube.mesh.position.z;
    
    // Целевая позиция в мировых координатах
    const targetWorldX = newPosition.x * this.cellSize - (this.boardSize.width * this.cellSize) / 2 + this.cellSize / 2;
    const targetWorldZ = newPosition.y * this.cellSize - (this.boardSize.height * this.cellSize) / 2 + this.cellSize / 2;
    
    // Высота, на которую поднимется кубик
    const teleportHeight = 10;
    
    // Длительность анимации (в кадрах)
    const animationDuration = 60; // примерно 1 секунда при 60 FPS
    
    // Текущий кадр анимации
    let frame = 0;
    
    // Сохраняем начальное вращение кубика
    const initialRotation = {
      x: cube.mesh.rotation.x,
      y: cube.mesh.rotation.y,
      z: cube.mesh.rotation.z
    };
    
    // Создаем эффект телепортации в начальной позиции
    this.createTeleportEffect(currentWorldX, this.cellSize / 2, currentWorldZ, 0x00ffff);
    
    // Функция для обновления анимации
    const updateTeleportAnimation = () => {
      // Если анимация завершена, останавливаем её
      if (frame >= animationDuration) {
        // Сбрасываем состояние кубика, сохраняя новую позицию
        const oldPosition = cube.position;
        cube.reset(newPosition);
        
        // Устанавливаем точную конечную позицию
        cube.mesh.position.set(
          targetWorldX,
          this.cellSize / 2,
          targetWorldZ
        );
        
        // Сбрасываем флаг телепортации
        cube.teleporting = false;
        
        // Создаем эффект телепортации в конечной позиции
        this.createTeleportEffect(targetWorldX, this.cellSize / 2, targetWorldZ, 0x00ffff);
        
        return;
      }
      
      // Вычисляем прогресс анимации (от 0 до 1)
      const progress = frame / animationDuration;
      
      // Первая половина анимации - подъем
      if (progress < 0.5) {
        // Нормализуем прогресс для первой половины (от 0 до 1)
        const upProgress = progress * 2;
        
        // Используем синусоидальную функцию для плавного подъема
        const heightFactor = Math.sin(upProgress * Math.PI / 2);
        
        // Вычисляем текущую высоту
        const currentHeight = this.cellSize / 2 + teleportHeight * heightFactor;
        
        // Обновляем позицию кубика (только по Y)
        cube.mesh.position.y = currentHeight;
        
        // Вращаем кубик вокруг всех осей
        cube.mesh.rotation.x = initialRotation.x + upProgress * Math.PI * 2;
        cube.mesh.rotation.y = initialRotation.y + upProgress * Math.PI * 4;
        cube.mesh.rotation.z = initialRotation.z + upProgress * Math.PI * 2;
      } 
      // Вторая половина анимации - перемещение и падение
      else {
        // Нормализуем прогресс для второй половины (от 0 до 1)
        const downProgress = (progress - 0.5) * 2;
        
        // Используем косинусоидальную функцию для плавного падения
        const heightFactor = Math.cos(downProgress * Math.PI / 2);
        
        // Вычисляем текущую высоту
        const currentHeight = this.cellSize / 2 + teleportHeight * heightFactor;
        
        // Интерполируем X и Z координаты
        const currentX = currentWorldX + (targetWorldX - currentWorldX) * downProgress;
        const currentZ = currentWorldZ + (targetWorldZ - currentWorldZ) * downProgress;
        
        // Обновляем позицию кубика
        cube.mesh.position.set(
          currentX,
          currentHeight,
          currentZ
        );
        
        // Продолжаем вращение кубика, но замедляем его к концу анимации
        const rotationSlowdown = 1 - downProgress;
        cube.mesh.rotation.x = initialRotation.x + (1 + downProgress) * Math.PI * 2;
        cube.mesh.rotation.y = initialRotation.y + (1 + downProgress) * Math.PI * 4;
        cube.mesh.rotation.z = initialRotation.z + (1 + downProgress) * Math.PI * 2;
      }
      
      // Увеличиваем счетчик кадров
      frame++;
      
      // Запрашиваем следующий кадр анимации
      requestAnimationFrame(updateTeleportAnimation);
    };
    
    // Запускаем анимацию
    updateTeleportAnimation();
  }
  
  // Создаем визуальный эффект телепортации
  createTeleportEffect(x, y, z, color) {
    // Количество частиц
    const particleCount = 50;
    
    // Создаем геометрию для частиц
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const sizes = new Float32Array(particleCount);
    
    // Инициализируем частицы
    for (let i = 0; i < particleCount; i++) {
      // Случайное положение вокруг центра
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;
      
      positions[i * 3] = x + Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z + Math.sin(angle) * radius;
      
      // Случайная скорость
      velocities.push({
        x: (Math.random() - 0.5) * 0.2,
        y: Math.random() * 0.2 + 0.1,
        z: (Math.random() - 0.5) * 0.2
      });
      
      // Случайный размер
      sizes[i] = Math.random() * 0.2 + 0.1;
    }
    
    // Устанавливаем атрибуты геометрии
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Создаем материал для частиц
    const particleMaterial = new THREE.PointsMaterial({
      color: color,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    // Создаем систему частиц
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    
    // Добавляем систему частиц на сцену
    this.scene.add(particles);
    
    // Сохраняем информацию об эффекте
    const effect = {
      particles,
      positions,
      velocities,
      lifetime: 0,
      maxLifetime: 60 // 1 секунда при 60 FPS
    };
    
    // Добавляем эффект в список активных эффектов
    this.teleportEffects.push(effect);
  }
  
  // Обновляем эффекты телепортации
  updateTeleportEffects() {
    // Обновляем каждый эффект
    for (let i = this.teleportEffects.length - 1; i >= 0; i--) {
      const effect = this.teleportEffects[i];
      
      // Увеличиваем время жизни эффекта
      effect.lifetime++;
      
      // Если эффект истек, удаляем его
      if (effect.lifetime >= effect.maxLifetime) {
        this.scene.remove(effect.particles);
        this.teleportEffects.splice(i, 1);
        continue;
      }
      
      // Вычисляем коэффициент затухания
      const fadeOutFactor = 1 - effect.lifetime / effect.maxLifetime;
      
      // Обновляем позиции частиц
      const positions = effect.particles.geometry.attributes.position.array;
      
      for (let j = 0; j < positions.length / 3; j++) {
        // Обновляем позицию частицы
        positions[j * 3] += effect.velocities[j].x;
        positions[j * 3 + 1] += effect.velocities[j].y;
        positions[j * 3 + 2] += effect.velocities[j].z;
        
        // Применяем гравитацию
        effect.velocities[j].y -= 0.01;
      }
      
      // Обновляем прозрачность
      effect.particles.material.opacity = fadeOutFactor * 0.8;
      
      // Обновляем буфер позиций
      effect.particles.geometry.attributes.position.needsUpdate = true;
    }
  }

  // Планируем следующий ход ИИ
  scheduleAiMove() {
    // Этот метод больше не нужен, так как ИИ ходит синхронно с игроком
  }
  
  // Получаем все возможные направления движения для вражеского кубика
  getPossibleMoveDirections(enemyCube) {
    const directions = ['up', 'down', 'left', 'right'];
    const possibleDirections = [];
    
    // Получаем позиции всех других вражеских кубиков
    const otherEnemyPositions = this.enemyCubes
      .filter(cube => cube !== enemyCube)
      .map(cube => cube.position);
    
    for (const direction of directions) {
      // Преобразуем направление с учетом угла камеры
      const transformedDirection = this.transformDirectionByCamera(direction);
      
      // Проверяем, может ли вражеский кубик двигаться в этом направлении
      const canEnemyMove = enemyCube.canRotate(transformedDirection, this.board.getSize(), this.cellSize, this.board);
      
      if (canEnemyMove) {
        // Проверяем, не приведет ли этот ход к столкновению с другим вражеским кубиком
        const newPosition = { ...enemyCube.position };
        
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
        
        // Проверяем, не совпадает ли новая позиция с позицией другого вражеского кубика
        const willCollideWithEnemy = otherEnemyPositions.some(
          pos => pos.x === newPosition.x && pos.y === newPosition.y
        );
        
        // Добавляем направление только если оно не приведет к столкновению с другим вражеским кубиком
        if (!willCollideWithEnemy) {
          possibleDirections.push(direction);
        }
      }
    }
    
    return possibleDirections;
  }
  
  // Выбираем направление движения для ИИ
  getAiMoveDirection(enemyCube) {
    // Получаем все возможные направления движения
    const possibleDirections = this.getPossibleMoveDirections(enemyCube);
    
    // Если нет возможных направлений, возвращаем null
    if (possibleDirections.length === 0) {
      return null;
    }
    
    // Получаем позиции кубиков
    const playerPos = this.cube.position;
    const enemyPos = enemyCube.position;
    
    // Получаем значения верхних граней
    const enemyTopValue = enemyCube.getTopValue();
    const playerTopValue = this.cube.getTopValue();
    
    // Проверяем, находятся ли кубики рядом
    const isNearby = (
      // По горизонтали
      (Math.abs(playerPos.x - enemyPos.x) <= 2 && playerPos.y === enemyPos.y) ||
      // По вертикали
      (Math.abs(playerPos.y - enemyPos.y) <= 2 && playerPos.x === enemyPos.x)
    );
    
    // Если кубики рядом, пытаемся атаковать игрока или убежать
    if (isNearby) {
      // Если значение врага больше, пытаемся атаковать
      if (enemyTopValue > playerTopValue) {
        // Пытаемся найти направление, которое приведет к столкновению
        for (const direction of possibleDirections) {
          const newEnemyPos = { ...enemyPos };
          
          switch (direction) {
            case 'up':
              newEnemyPos.y += 1;
              break;
            case 'down':
              newEnemyPos.y -= 1;
              break;
            case 'left':
              newEnemyPos.x -= 1;
              break;
            case 'right':
              newEnemyPos.x += 1;
              break;
          }
          
          // Проверяем, приведет ли это к соседству с игроком или попаданию на ту же клетку
          const willBeAdjacent = (
            // По горизонтали
            (Math.abs(playerPos.x - newEnemyPos.x) === 1 && playerPos.y === newEnemyPos.y) ||
            // По вертикали
            (Math.abs(playerPos.y - newEnemyPos.y) === 1 && playerPos.x === newEnemyPos.x)
          );
          
          const willBeSameCell = (playerPos.x === newEnemyPos.x && playerPos.y === newEnemyPos.y);
          
          if (willBeAdjacent || willBeSameCell) {
            return direction;
          }
        }
      }
      // Если значение врага меньше, пытаемся убежать
      else if (enemyTopValue < playerTopValue) {
        // Пытаемся найти направление, которое уведет от игрока
        for (const direction of possibleDirections) {
          const newEnemyPos = { ...enemyPos };
          
          switch (direction) {
            case 'up':
              newEnemyPos.y += 1;
              break;
            case 'down':
              newEnemyPos.y -= 1;
              break;
            case 'left':
              newEnemyPos.x -= 1;
              break;
            case 'right':
              newEnemyPos.x += 1;
              break;
          }
          
          // Проверяем, не приведет ли это к попаданию на ту же клетку
          const willBeSameCell = (playerPos.x === newEnemyPos.x && playerPos.y === newEnemyPos.y);
          
          // Если это приведет к попаданию на ту же клетку, пропускаем это направление
          if (willBeSameCell) {
            continue;
          }
          
          // Проверяем, увеличит ли это расстояние до игрока
          const currentDistance = Math.abs(playerPos.x - enemyPos.x) + Math.abs(playerPos.y - enemyPos.y);
          const newDistance = Math.abs(playerPos.x - newEnemyPos.x) + Math.abs(playerPos.y - newEnemyPos.y);
          
          if (newDistance > currentDistance) {
            return direction;
          }
        }
      }
      // Если значения равны, выбираем случайное направление, но избегаем попадания на ту же клетку
      else {
        const safeDirections = possibleDirections.filter(direction => {
          const newEnemyPos = { ...enemyPos };
          
          switch (direction) {
            case 'up':
              newEnemyPos.y += 1;
              break;
            case 'down':
              newEnemyPos.y -= 1;
              break;
            case 'left':
              newEnemyPos.x -= 1;
              break;
            case 'right':
              newEnemyPos.x += 1;
              break;
          }
          
          // Проверяем, не приведет ли это к попаданию на ту же клетку
          return !(playerPos.x === newEnemyPos.x && playerPos.y === newEnemyPos.y);
        });
        
        if (safeDirections.length > 0) {
          const randomIndex = Math.floor(Math.random() * safeDirections.length);
          return safeDirections[randomIndex];
        }
      }
    }
    
    // Если нет особой стратегии или все стратегии не сработали, выбираем случайное направление
    const randomIndex = Math.floor(Math.random() * possibleDirections.length);
    return possibleDirections[randomIndex];
  }
}