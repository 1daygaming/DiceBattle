import * as THREE from 'three';

interface Cell {
  mesh: THREE.Mesh;
  type: 'normal' | 'target' | 'obstacle';
  value: number | null;
  obstacleMesh?: THREE.Mesh;
}

interface Position {
  x: number;
  y: number;
  value?: number;
}

export class BoardController {
  width: number;
  height: number;
  cellSize: number;
  mesh: THREE.Group;
  cells: Cell[][];
  targetCells: Cell[];
  obstacleCells: Cell[];

  constructor(width = 5, height = 5, cellSize = 1) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.mesh = new THREE.Group();
    this.cells = [];
    this.targetCells = [];
    this.obstacleCells = [];
    this.createMesh();
    this.setupTargetCells();
    this.setupObstacleCells();
  }

  createMesh(): void {
    // Создаем группу для всех элементов поля
    this.mesh = new THREE.Group();

    // Создаем геометрию для ячейки поля
    const cellGeometry = new THREE.BoxGeometry(this.cellSize, this.cellSize * 0.1, this.cellSize);

    // Создаем материал для обычных ячеек
    const cellMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a6572,
      roughness: 0.7,
      metalness: 0.2,
    });

    // Создаем ячейки поля
    for (let y = 0; y < this.height; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.width; x++) {
        const cell = new THREE.Mesh(cellGeometry, cellMaterial.clone());

        // Позиционируем ячейку
        cell.position.set(
          x * this.cellSize,
          -this.cellSize * 0.05, // Половина высоты ячейки
          y * this.cellSize
        );

        // Добавляем тень
        cell.receiveShadow = true;

        // Добавляем ячейку в группу
        this.mesh.add(cell);

        // Сохраняем ссылку на ячейку
        this.cells[y][x] = {
          mesh: cell,
          type: 'normal',
          value: null,
        };
      }
    }

    // Центрируем поле
    this.mesh.position.set(
      -(this.width * this.cellSize) / 2 + this.cellSize / 2,
      0,
      -(this.height * this.cellSize) / 2 + this.cellSize / 2
    );
  }

  setupTargetCells(): void {
    // Создаем материал для целевых ячеек с более ярким цветом
    const targetMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a6572, // Более яркий цвет основы
      roughness: 0.5, // Уменьшаем шероховатость для более яркого вида
      metalness: 0.3, // Увеличиваем металличность для более яркого вида
      emissive: 0x4a6572, // Цвет свечения
      emissiveIntensity: 0.4, // Увеличиваем интенсивность свечения
    });

    // Создаем массив значений от 1 до 6
    const values = [1, 2, 3, 4, 5, 6];

    // Перемешиваем массив значений
    this.shuffleArray(values);

    // Создаем массив всех возможных позиций (исключая центр поля, где стартует кубик)
    const allPositions: Position[] = [];
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Исключаем центральную клетку (стартовую позицию)
        if (x !== centerX || y !== centerY) {
          allPositions.push({ x, y });
        }
      }
    }

    // Перемешиваем массив позиций
    this.shuffleArray(allPositions);

    // Выбираем первые 6 позиций (или меньше, если поле маленькое)
    const targetPositions: Position[] = [];
    const numTargets = Math.min(6, allPositions.length);

    for (let i = 0; i < numTargets; i++) {
      targetPositions.push({
        x: allPositions[i].x,
        y: allPositions[i].y,
        value: values[i],
      });
    }

    // Устанавливаем целевые ячейки
    for (const pos of targetPositions) {
      if (pos.value !== undefined) {
        const cell = this.cells[pos.y][pos.x];
        cell.type = 'target';
        cell.value = pos.value;
        cell.mesh.material = targetMaterial.clone();

        // Добавляем текстуру с цифрой
        const texture = this.createNumberTexture(pos.value);
        const material = cell.mesh.material as THREE.MeshStandardMaterial;
        material.map = texture;

        // Сохраняем ссылку на целевую ячейку
        this.targetCells.push(cell);
      }
    }

    // Инициализируем подсветку целевых ячеек (подсвечиваем первую цифру)
    this.updateTargetCellsHighlight(1);
  }

  setupObstacleCells(cubePosition: Position | null = null): void {
    // Создаем материал для препятствий
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0xc62828, // Красный цвет для препятствий
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0xb71c1c,
      emissiveIntensity: 0.2,
    });

    // Создаем геометрию для препятствий (выше обычных ячеек)
    const obstacleGeometry = new THREE.BoxGeometry(
      this.cellSize * 0.8,
      this.cellSize * 0.5,
      this.cellSize * 0.8
    );

    // Получаем стартовую позицию
    const startPos = this.getStartPosition();

    // Получаем позиции целевых ячеек
    const targetPositions: Position[] = [];
    for (const cell of this.targetCells) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.cells[y][x] === cell) {
            targetPositions.push({ x, y });
            break;
          }
        }
      }
    }

    // Создаем массив всех возможных позиций для препятствий
    const availablePositions: Position[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Исключаем стартовую позицию, целевые ячейки и текущую позицию кубика
        const isStartPos = x === startPos.x && y === startPos.y;
        const isTargetPos = targetPositions.some(pos => pos.x === x && pos.y === y);
        const isCubePos = cubePosition && x === cubePosition.x && y === cubePosition.y;

        if (!isStartPos && !isTargetPos && !isCubePos) {
          availablePositions.push({ x, y });
        }
      }
    }

    // Перемешиваем массив доступных позиций
    this.shuffleArray(availablePositions);

    // Выбираем первые 5 позиций (или меньше, если доступных позиций меньше)
    const numObstacles = Math.min(5, availablePositions.length);
    const obstaclePositions = availablePositions.slice(0, numObstacles);

    console.log('Позиции препятствий:', obstaclePositions);

    // Удаляем предыдущие препятствия
    for (const cell of this.obstacleCells) {
      if (cell.obstacleMesh) {
        this.mesh.remove(cell.obstacleMesh);
        cell.type = 'normal';
        cell.obstacleMesh = undefined;
      }
    }

    // Очищаем массив препятствий
    this.obstacleCells = [];

    // Создаем препятствия
    for (const pos of obstaclePositions) {
      // Создаем меш препятствия
      const obstacleMesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial.clone());

      // Получаем ячейку поля
      const cell = this.cells[pos.y][pos.x];

      // Позиционируем препятствие относительно ячейки
      const cellPosition = cell.mesh.position.clone();
      obstacleMesh.position.set(
        cellPosition.x,
        this.cellSize * 0.25, // Половина высоты препятствия
        cellPosition.z
      );

      // Добавляем тень
      obstacleMesh.castShadow = true;
      obstacleMesh.receiveShadow = true;

      // Добавляем препятствие в группу
      this.mesh.add(obstacleMesh);

      // Отмечаем ячейку как препятствие
      cell.type = 'obstacle';
      cell.obstacleMesh = obstacleMesh;

      // Сохраняем ссылку на препятствие
      this.obstacleCells.push(cell);

      console.log(
        `Препятствие создано на позиции (${pos.x}, ${pos.y}), мировые координаты: (${obstacleMesh.position.x}, ${obstacleMesh.position.y}, ${obstacleMesh.position.z})`
      );
    }
  }

  // Вспомогательный метод для перемешивания массива
  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  createNumberTexture(number: number): THREE.Texture {
    // Создаем канвас для отрисовки текстуры
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }

    // Заливаем прозрачным фоном
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Увеличиваем размер шрифта и добавляем обводку для лучшей видимости
    const fontSize = 80; // Увеличиваем размер шрифта с 64 до 80
    context.font = `bold ${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Добавляем черную обводку для лучшей видимости
    context.strokeStyle = '#000000';
    context.lineWidth = 6;
    context.strokeText(number.toString(), canvas.width / 2, canvas.height / 2);

    // Рисуем цифру ярко-желтым цветом для лучшей видимости
    context.fillStyle = '#FFEB3B'; // Ярко-желтый цвет
    context.fillText(number.toString(), canvas.width / 2, canvas.height / 2);

    // Создаем текстуру из канваса
    const texture = new THREE.CanvasTexture(canvas);

    return texture;
  }

  // Проверяем, является ли ячейка целевой и соответствует ли значение кубика
  checkTargetCell(x: number, y: number, cubeValue: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }

    const cell = this.cells[y][x];
    return cell.type === 'target' && cell.value === cubeValue;
  }

  // Получаем стартовую позицию (центр поля)
  getStartPosition(): Position {
    return {
      x: Math.floor(this.width / 2),
      y: Math.floor(this.height / 2),
    };
  }

  // Преобразуем координаты поля в мировые координаты
  gridToWorld(x: number, y: number): { x: number; z: number } {
    return {
      x: (x - Math.floor(this.width / 2)) * this.cellSize,
      z: (y - Math.floor(this.height / 2)) * this.cellSize,
    };
  }

  // Получаем размер поля
  getSize(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height,
    };
  }

  // Получаем количество целевых ячеек
  getTargetCellsCount(): number {
    return this.targetCells.length;
  }

  // Обновляем подсветку целевых ячеек
  updateTargetCellsHighlight(nextNumberToCollect: number): void {
    // Проходим по всем целевым ячейкам
    for (const cell of this.targetCells) {
      const material = cell.mesh.material as THREE.MeshStandardMaterial;

      // Если значение ячейки меньше nextNumberToCollect, значит она уже собрана
      if (cell.value && cell.value < nextNumberToCollect - 1) {
        // Подсвечиваем собранные ячейки ярко-зеленым цветом
        material.color.set(0x4caf50);
        material.emissive.set(0x4caf50);
        material.emissiveIntensity = 0.5;
      }
      // Если значение ячейки равно nextNumberToCollect, значит это текущая цель
      else if (cell.value === nextNumberToCollect - 1) {
        // Подсвечиваем текущую цель ярко-оранжевым цветом для лучшей видимости
        material.color.set(0xff9800);
        material.emissive.set(0xff9800);
        material.emissiveIntensity = 0.8; // Очень яркое свечение для текущей цели
      }
      // Иначе это будущие цели
      else {
        // Делаем будущие цели более заметными с голубым оттенком
        material.color.set(0x03a9f4);
        material.emissive.set(0x03a9f4);
        material.emissiveIntensity = 0.3;
      }
    }
  }

  // Добавляем метод для проверки, является ли ячейка препятствием
  isObstacle(x: number, y: number): boolean {
    // Проверяем, что координаты в пределах поля
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }

    // Проверяем тип ячейки
    const cell = this.cells[y][x];
    const isObstacle = cell.type === 'obstacle';

    // Выводим отладочную информацию
    if (isObstacle) {
      console.log(`Ячейка (${x}, ${y}) является препятствием`);
    }

    return isObstacle;
  }
}
