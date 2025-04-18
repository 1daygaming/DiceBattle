import * as THREE from 'three';
import { Position } from '../types';
import { BoardController } from './BoardController';

interface FaceValues {
  top: number;
  bottom: number;
  left: number;
  right: number;
  front: number;
  back: number;
}

interface BoardSize {
  width: number;
  height: number;
}

export class CubeController {
  size: number;
  mesh: THREE.Mesh | null;
  position: Position;
  faceValues: FaceValues;
  rotationInProgress: boolean;
  rotationAxis: THREE.Vector3 | null;
  rotationAngle: number;
  targetRotation: number;
  rotationDirection: number;
  rotationSpeed: number;
  scene: THREE.Scene | null;
  pivot: THREE.Object3D | null;
  faceMaterials: Record<number, THREE.MeshStandardMaterial>;
  orientationHelpers?: THREE.Group;
  teleporting: boolean;
  boardSize: { width: number; height: number };
  cellSize: number;
  board: BoardController; // TODO: Replace with proper Board type

  constructor(
    size = 1,
    boardSize: { width: number; height: number },
    cellSize: number,
    board: BoardController
  ) {
    this.size = size;
    this.mesh = null;
    this.position = { x: 0, y: 0 };
    this.faceValues = {
      top: 1,
      bottom: 6,
      left: 3,
      right: 4,
      front: 2,
      back: 5,
    };
    this.rotationInProgress = false;
    this.rotationAxis = null;
    this.rotationAngle = 0;
    this.targetRotation = 0;
    this.rotationDirection = 1;
    this.rotationSpeed = Math.PI / 36; // Уменьшаем скорость вращения для более плавного движения
    this.scene = null; // Ссылка на сцену
    this.pivot = null; // Точка вращения
    this.teleporting = false;
    this.boardSize = boardSize;
    this.cellSize = cellSize;
    this.board = board;

    // Создаем и сохраняем материалы для каждого значения
    this.faceMaterials = {};
    for (let i = 1; i <= 6; i++) {
      this.faceMaterials[i] = this.createFaceMaterial(i);
    }

    this.createMesh();
  }

  createMesh(): void {
    // Создаем геометрию куба
    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);

    // Создаем материалы для каждой грани куба, используя предварительно созданные материалы
    const materials = [
      this.faceMaterials[this.faceValues.right], // правая грань
      this.faceMaterials[this.faceValues.left], // левая грань
      this.faceMaterials[this.faceValues.top], // верхняя грань
      this.faceMaterials[this.faceValues.bottom], // нижняя грань
      this.faceMaterials[this.faceValues.front], // передняя грань
      this.faceMaterials[this.faceValues.back], // задняя грань
    ];

    // Создаем меш с геометрией и материалами
    this.mesh = new THREE.Mesh(geometry, materials);

    // Устанавливаем начальную позицию куба
    this.mesh.position.set(0, this.size / 2, 0);

    // Добавляем тень
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Добавляем вспомогательные стрелки для визуализации ориентации куба
    //this.addOrientationHelpers();
  }

  createFaceMaterial(value: number): THREE.MeshStandardMaterial {
    // Создаем канвас для отрисовки текстуры
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }

    // Заливаем фон
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем границу
    context.strokeStyle = '#000000';
    context.lineWidth = 8;
    context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Размер точки
    const dotSize = 12;

    // Рисуем точки в зависимости от значения
    context.fillStyle = '#000000';

    const center = canvas.width / 2;
    const offset = 30; // Смещение от центра

    switch (value) {
      case 1:
        // Одна точка в центре
        this.drawDot(context, center, center, dotSize);
        break;
      case 2:
        // Две точки по диагонали
        this.drawDot(context, center - offset, center - offset, dotSize);
        this.drawDot(context, center + offset, center + offset, dotSize);
        break;
      case 3:
        // Три точки по диагонали
        this.drawDot(context, center - offset, center - offset, dotSize);
        this.drawDot(context, center, center, dotSize);
        this.drawDot(context, center + offset, center + offset, dotSize);
        break;
      case 4:
        // Четыре точки по углам
        this.drawDot(context, center - offset, center - offset, dotSize);
        this.drawDot(context, center - offset, center + offset, dotSize);
        this.drawDot(context, center + offset, center - offset, dotSize);
        this.drawDot(context, center + offset, center + offset, dotSize);
        break;
      case 5:
        // Пять точек (четыре по углам и одна в центре)
        this.drawDot(context, center - offset, center - offset, dotSize);
        this.drawDot(context, center - offset, center + offset, dotSize);
        this.drawDot(context, center, center, dotSize);
        this.drawDot(context, center + offset, center - offset, dotSize);
        this.drawDot(context, center + offset, center + offset, dotSize);
        break;
      case 6:
        // Шесть точек (по три с каждой стороны)
        this.drawDot(context, center - offset, center - offset, dotSize);
        this.drawDot(context, center - offset, center, dotSize);
        this.drawDot(context, center - offset, center + offset, dotSize);
        this.drawDot(context, center + offset, center - offset, dotSize);
        this.drawDot(context, center + offset, center, dotSize);
        this.drawDot(context, center + offset, center + offset, dotSize);
        break;
    }

    // Создаем текстуру из канваса
    const texture = new THREE.CanvasTexture(canvas);

    // Создаем материал с текстурой
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.2,
    });
  }

  // Вспомогательный метод для рисования точки
  drawDot(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
  }

  // Обновляем значения граней после вращения
  updateFaceValues(direction: string): void {
    const { top, bottom, left, right, front, back } = this.faceValues;

    switch (direction) {
      case 'up': // Вращение вперед (вокруг оси X)
        this.faceValues = {
          top: back,
          bottom: front,
          left: left,
          right: right,
          front: top,
          back: bottom,
        };
        break;
      case 'down': // Вращение назад (вокруг оси X)
        this.faceValues = {
          top: front,
          bottom: back,
          left: left,
          right: right,
          front: bottom,
          back: top,
        };
        break;
      case 'left': // Вращение влево (вокруг оси Z)
        this.faceValues = {
          top: right,
          bottom: left,
          left: top,
          right: bottom,
          front: front,
          back: back,
        };
        break;
      case 'right': // Вращение вправо (вокруг оси Z)
        this.faceValues = {
          top: left,
          bottom: right,
          left: bottom,
          right: top,
          front: front,
          back: back,
        };
        break;
    }

    // Выводим текущие значения граней для отладки
    console.log(`После вращения ${direction}:`, this.faceValues);
  }

  // Начать вращение куба в указанном направлении
  startRotation(direction: string, boardSize: BoardSize, cellSize: number, board: BoardController | null): boolean {
    if (this.rotationInProgress) return false;

    // Выводим текущие значения граней для отладки
    console.log(`Перед вращением ${direction}:`, { ...this.faceValues });

    // Проверяем, можно ли двигаться в указанном направлении
    const newPosition = { ...this.position };

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

    console.log(
      `Проверка движения ${direction}: текущая позиция (${this.position.x}, ${this.position.y}), новая позиция (${newPosition.x}, ${newPosition.y})`
    );

    // Проверяем, не выходит ли куб за границы поля
    if (
      newPosition.x < 0 ||
      newPosition.x >= boardSize.width ||
      newPosition.y < 0 ||
      newPosition.y >= boardSize.height
    ) {
      console.log(`Движение ${direction} невозможно: выход за границы поля`);
      return false;
    }

    // Проверяем, нет ли препятствия на новой позиции
    if (board && board.isObstacle(newPosition.x, newPosition.y)) {
      console.log(
        `Движение ${direction} невозможно: препятствие на позиции (${newPosition.x}, ${newPosition.y})`
      );
      return false;
    }

    this.rotationInProgress = true;
    this.rotationDirection = 1;
    this.rotationAngle = 0;
    this.targetRotation = Math.PI / 2;

    if (!this.scene || !this.mesh) {
      return false;
    }

    // Получаем текущую позицию в мировых координатах
    const worldX = this.position.x * this.size - (boardSize.width * cellSize) / 2 + cellSize / 2;
    const worldZ = this.position.y * this.size - (boardSize.height * cellSize) / 2 + cellSize / 2;
    const pivotUp = new THREE.Object3D();
    const pivotDown = new THREE.Object3D();
    const pivotLeft = new THREE.Object3D();
    const pivotRight = new THREE.Object3D();


    // Устанавливаем ось вращения и точку вращения
    switch (direction) {
      case 'up':
        // Ось вращения - по X (влево-вправо)
        this.rotationAxis = new THREE.Vector3(1, 0, 0);

        // Точка вращения - верхнее ребро текущей клетки
        // Устанавливаем точку вращения точно на ребро между клетками
        pivotUp.position.set(worldX, 0, worldZ + this.size / 2);
        this.scene.add(pivotUp);

        // Добавляем куб к точке вращения и позиционируем его относительно точки вращения
        // Важно: позиция куба относительно точки вращения должна быть такой,
        // чтобы при вращении он двигался по правильной траектории
        this.mesh.position.set(0, this.size / 2, -this.size / 2);
        pivotUp.add(this.mesh);

        // Сохраняем точку вращения
        this.pivot = pivotUp;
        break;

      case 'down':
        // Ось вращения - по X (влево-вправо)
        this.rotationAxis = new THREE.Vector3(1, 0, 0);

        // Точка вращения - нижнее ребро текущей клетки
        // Устанавливаем точку вращения точно на ребро между клетками
        pivotDown.position.set(worldX, 0, worldZ - this.size / 2);
        this.scene.add(pivotDown);

        // Добавляем куб к точке вращения и позиционируем его относительно точки вращения
        this.mesh.position.set(0, this.size / 2, this.size / 2);
        pivotDown.add(this.mesh);

        // Сохраняем точку вращения
        this.pivot = pivotDown;
        break;

      case 'left':
        // Ось вращения - по Z (вперед-назад)
        this.rotationAxis = new THREE.Vector3(0, 0, 1);

        // Точка вращения - левое ребро текущей клетки
        // Устанавливаем точку вращения точно на ребро между клетками
        pivotLeft.position.set(worldX - this.size / 2, 0, worldZ);
        this.scene.add(pivotLeft);

        // Добавляем куб к точке вращения и позиционируем его относительно точки вращения
        this.mesh.position.set(this.size / 2, this.size / 2, 0);
        pivotLeft.add(this.mesh);

        // Сохраняем точку вращения
        this.pivot = pivotLeft;
        break;

      case 'right':
        // Ось вращения - по Z (вперед-назад)
        this.rotationAxis = new THREE.Vector3(0, 0, 1);

        // Точка вращения - правое ребро текущей клетки
        // Устанавливаем точку вращения точно на ребро между клетками
        pivotRight.position.set(worldX + this.size / 2, 0, worldZ);
        this.scene.add(pivotRight);

        // Добавляем куб к точке вращения и позиционируем его относительно точки вращения
        this.mesh.position.set(-this.size / 2, this.size / 2, 0);
        pivotRight.add(this.mesh);

        // Сохраняем точку вращения
        this.pivot = pivotRight;
        break;
    }

    return true;
  }

  // Обновление вращения куба
  update(boardSize: BoardSize, cellSize: number): boolean | undefined {
    if (!this.rotationInProgress) return;

    // Продолжаем вращение
    this.rotationAngle += this.rotationSpeed;

    if (this.rotationAngle >= this.targetRotation) {
      // Завершаем вращение
      this.rotationAngle = this.targetRotation;
      this.rotationInProgress = false;

      // Определяем направление вращения
      let direction: string | undefined;
      if (this.rotationAxis && this.pivot) {
        if (this.rotationAxis.x === 1) {
          if (this.pivot.rotation.x > 0) direction = 'up';
          else direction = 'down';
        } else if (this.rotationAxis.z === 1) {
          if (this.pivot.rotation.z > 0) direction = 'left';
          else direction = 'right';
        }
      }

      if (!direction) {
        return false;
      }

      // Обновляем логические значения граней (для игровой логики), но не меняем материалы
      this.updateFaceValues(direction);

      // Обновляем позицию куба на поле
      switch (direction) {
        case 'up':
          this.position.y += 1;
          break;
        case 'down':
          this.position.y -= 1;
          break;
        case 'left':
          this.position.x -= 1;
          break;
        case 'right':
          this.position.x += 1;
          break;
      }

      // Возвращаем куб на сцену (удаляем из точки вращения)
      if (this.pivot && this.mesh && this.scene) {
        // Сохраняем мировую позицию и поворот куба
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        this.mesh.getWorldPosition(worldPosition);
        this.mesh.getWorldQuaternion(worldQuaternion);

        // Удаляем куб из точки вращения
        this.pivot.remove(this.mesh);

        // Добавляем куб обратно на сцену
        this.scene.add(this.mesh);

        // Устанавливаем мировую позицию и поворот
        this.mesh.position.copy(worldPosition);
        this.mesh.quaternion.copy(worldQuaternion);

        // Удаляем точку вращения со сцены
        this.scene.remove(this.pivot);
        this.pivot = null;
      }

      // Сбрасываем позицию меша с учетом центрирования поля
      if (this.mesh) {
        const worldX =
          this.position.x * this.size - (boardSize.width * cellSize) / 2 + cellSize / 2;
        const worldZ =
          this.position.y * this.size - (boardSize.height * cellSize) / 2 + cellSize / 2;

        this.mesh.position.set(worldX, this.size / 2, worldZ);
      }

      return true; // вращение завершено
    }

    // Применяем вращение к точке вращения
    if (this.pivot && this.mesh) {
      if (this.rotationAxis) {
        switch (true) {
          case this.rotationAxis.x === 1:
            if (this.mesh.position.z < 0) {
              // Вращение вверх
              this.pivot.rotation.x = this.rotationAngle;
            } else {
              // Вращение вниз
              this.pivot.rotation.x = -this.rotationAngle;
            }
            break;
          case this.rotationAxis.z === 1:
            if (this.mesh.position.x > 0) {
              // Вращение влево
              this.pivot.rotation.z = this.rotationAngle;
            } else {
              // Вращение вправо
              this.pivot.rotation.z = -this.rotationAngle;
            }
            break;
        }
      }
    }

    return false; // вращение продолжается
  }

  // Получаем значение нижней грани кубика
  getBottomValue(): number {
    return this.faceValues.bottom;
  }

  // Получаем значение верхней грани кубика
  getTopValue(): number {
    return this.faceValues.top;
  }

  // Сбросить куб в начальное положение
  reset(newPosition: Position): Position {
    this.position = { ...newPosition };
    this.rotationInProgress = false;
    this.faceValues = {
      top: 1,
      bottom: 6,
      left: 3,
      right: 4,
      front: 2,
      back: 5,
    };

    // Создаем новый меш с исходными материалами
    if (this.mesh && this.scene) {
      // Если куб находится в точке вращения, удаляем его оттуда
      if (this.pivot) {
        this.pivot.remove(this.mesh);
        this.scene.remove(this.pivot);
        this.pivot = null;
      } else {
        // Иначе удаляем его со сцены
        this.scene.remove(this.mesh);
      }

      // Создаем новый меш
      this.createMesh();

      // Добавляем его на сцену
      if (this.mesh) {
        this.scene.add(this.mesh);
      }
    }

    return this.position;
  }

  // Добавляем вспомогательные стрелки для визуализации ориентации куба
  addOrientationHelpers(): void {
    if (!this.mesh) return;

    // Создаем группу для вспомогательных объектов
    this.orientationHelpers = new THREE.Group();
    this.mesh.add(this.orientationHelpers);

    // Создаем стрелку для верхней грани (красная)
    const topArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      this.size * 0.7,
      0xff0000
    );
    this.orientationHelpers.add(topArrow);

    // Создаем стрелку для передней грани (зеленая)
    const frontArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      this.size * 0.7,
      0x00ff00
    );
    this.orientationHelpers.add(frontArrow);

    // Создаем стрелку для правой грани (синяя)
    const rightArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      this.size * 0.7,
      0x0000ff
    );
    this.orientationHelpers.add(rightArrow);
  }

  // Устанавливаем ссылку на сцену
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  // Метод для изменения цвета кубика
  setColor(color: number): void {
    // Создаем новые материалы для каждого значения с указанным цветом
    for (let i = 1; i <= 6; i++) {
      // Создаем канвас для отрисовки текстуры
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get 2D context from canvas');
      }

      // Заливаем фон цветом
      context.fillStyle = '#' + color.toString(16).padStart(6, '0');
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Рисуем границу
      context.strokeStyle = '#000000';
      context.lineWidth = 8;
      context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // Размер точки
      const dotSize = 12;

      // Рисуем точки в зависимости от значения
      context.fillStyle = '#ffffff'; // Белые точки для контраста

      const center = canvas.width / 2;
      const offset = 30; // Смещение от центра

      switch (i) {
        case 1:
          this.drawDot(context, center, center, dotSize);
          break;
        case 2:
          this.drawDot(context, center - offset, center - offset, dotSize);
          this.drawDot(context, center + offset, center + offset, dotSize);
          break;
        case 3:
          this.drawDot(context, center - offset, center - offset, dotSize);
          this.drawDot(context, center, center, dotSize);
          this.drawDot(context, center + offset, center + offset, dotSize);
          break;
        case 4:
          this.drawDot(context, center - offset, center - offset, dotSize);
          this.drawDot(context, center - offset, center + offset, dotSize);
          this.drawDot(context, center + offset, center - offset, dotSize);
          this.drawDot(context, center + offset, center + offset, dotSize);
          break;
        case 5:
          this.drawDot(context, center - offset, center - offset, dotSize);
          this.drawDot(context, center - offset, center + offset, dotSize);
          this.drawDot(context, center, center, dotSize);
          this.drawDot(context, center + offset, center - offset, dotSize);
          this.drawDot(context, center + offset, center + offset, dotSize);
          break;
        case 6:
          this.drawDot(context, center - offset, center - offset, dotSize);
          this.drawDot(context, center - offset, center, dotSize);
          this.drawDot(context, center - offset, center + offset, dotSize);
          this.drawDot(context, center + offset, center - offset, dotSize);
          this.drawDot(context, center + offset, center, dotSize);
          this.drawDot(context, center + offset, center + offset, dotSize);
          break;
      }

      // Создаем текстуру из канваса
      const texture = new THREE.CanvasTexture(canvas);

      // Обновляем материал
      this.faceMaterials[i] = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.5,
        metalness: 0.2,
      });
    }

    // Обновляем материалы меша
    if (this.mesh) {
      this.mesh.material = [
        this.faceMaterials[this.faceValues.right], // правая грань
        this.faceMaterials[this.faceValues.left], // левая грань
        this.faceMaterials[this.faceValues.top], // верхняя грань
        this.faceMaterials[this.faceValues.bottom], // нижняя грань
        this.faceMaterials[this.faceValues.front], // передняя грань
        this.faceMaterials[this.faceValues.back], // задняя грань
      ];
    }
  }

  // Проверяет, может ли кубик двигаться в указанном направлении без фактического перемещения
  canRotate(direction: string, boardSize: BoardSize, cellSize: number, board: BoardController | null): boolean {
    // Проверяем, можно ли двигаться в указанном направлении
    const newPosition = { ...this.position };

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

    // Проверяем, не выходит ли куб за границы поля
    if (
      newPosition.x < 0 ||
      newPosition.x >= boardSize.width ||
      newPosition.y < 0 ||
      newPosition.y >= boardSize.height
    ) {
      return false;
    }

    // Проверяем, нет ли препятствия на новой позиции
    if (board && board.isObstacle(newPosition.x, newPosition.y)) {
      return false;
    }

    return true;
  }
}
