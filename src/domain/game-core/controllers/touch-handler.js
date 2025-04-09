/**
 * Обработчик сенсорных событий для предотвращения масштабирования на мобильных устройствах
 */
export class TouchHandler {
  constructor() {
    // Привязываем методы к экземпляру класса, чтобы сохранить контекст this
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleSelectStart = this.handleSelectStart.bind(this);
    this.handleDoubleTap = this.handleDoubleTap.bind(this);
    
    // Переменные для отслеживания двойного тапа
    this.lastTap = 0;
    this.touchTimeout = null;
    
    this.initialize();
  }

  initialize() {
    // Предотвращаем масштабирование при двойном нажатии
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    
    // Предотвращаем масштабирование при жесте pinch-to-zoom
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    
    // Предотвращаем контекстное меню на долгое нажатие
    document.addEventListener('contextmenu', this.handleContextMenu);
    
    // Предотвращаем выделение текста
    document.addEventListener('selectstart', this.handleSelectStart);
    
    // Обрабатываем кнопки управления
    this.setupControlButtons();
    
    // Добавляем обработчик двойного тапа
    document.addEventListener('dblclick', this.handleDoubleTap);
  }

  handleTouchStart(e) {
    // Проверяем, является ли целевой элемент кнопкой или находится внутри кнопки
    const isButton = e.target.closest('.control-btn') || 
                     e.target.closest('#start-btn') || 
                     e.target.closest('#restart-btn') ||
                     e.target.closest('.camera-controls button');
    
    // Если это кнопка, не блокируем событие
    if (isButton) {
      return;
    }
    
    // Предотвращаем двойное нажатие для масштабирования
    if (e.touches.length > 1) {
      e.preventDefault();
      return;
    }
    
    // Обработка двойного тапа
    const currentTime = new Date().getTime();
    const tapLength = currentTime - this.lastTap;
    
    clearTimeout(this.touchTimeout);
    
    if (tapLength < 500 && tapLength > 0) {
      // Двойной тап обнаружен
      e.preventDefault();
    } else {
      // Одиночный тап
      this.touchTimeout = setTimeout(() => {
        this.lastTap = 0;
      }, 500);
    }
    
    this.lastTap = currentTime;
  }

  handleTouchMove(e) {
    // Проверяем, является ли целевой элемент кнопкой или находится внутри кнопки
    const isButton = e.target.closest('.control-btn') || 
                     e.target.closest('#start-btn') || 
                     e.target.closest('#restart-btn') ||
                     e.target.closest('.camera-controls button');
    
    // Если это кнопка, не блокируем событие
    if (isButton) {
      return;
    }
    
    // Предотвращаем жест pinch-to-zoom
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }

  handleDoubleTap(e) {
    // Предотвращаем действие по умолчанию при двойном тапе
    e.preventDefault();
    return false;
  }

  handleContextMenu(e) {
    // Предотвращаем контекстное меню на долгое нажатие
    e.preventDefault();
    return false;
  }

  handleSelectStart(e) {
    // Предотвращаем выделение текста
    e.preventDefault();
    return false;
  }

  setupControlButtons() {
    // Получаем все кнопки управления
    const controlButtons = document.querySelectorAll('.control-btn');
    
    // Добавляем обработчики событий для каждой кнопки
    controlButtons.forEach(button => {
      // Добавляем класс для визуального эффекта нажатия
      button.addEventListener('touchstart', () => {
        button.classList.add('pressed');
      });
      
      // Убираем визуальный эффект при отпускании
      button.addEventListener('touchend', () => {
        button.classList.remove('pressed');
      });
      
      // Убираем визуальный эффект, если палец ушел за пределы кнопки
      button.addEventListener('touchcancel', () => {
        button.classList.remove('pressed');
      });
    });
  }
}

// Создаем экземпляр обработчика при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new TouchHandler();
}); 