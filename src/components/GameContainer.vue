<template>
  <div class="game-container">
    <div id="game-canvas"></div>
    <div class="ui-container">
      <div class="game-info">
        <div class="moves-counter">Ходы: {{ moves }}</div>
        <div class="collected-numbers">Собрано: {{ collectedNumbers }}/{{ totalTargetNumbers }}</div>
        <div class="next-number" v-if="nextNumber <= totalTargetNumbers">
          Следующая цель: {{ nextNumber }}
        </div>
        <div class="obstacle-info" v-if="obstacleInfo">
          Смена препятствий через: {{ obstacleInfo }} ходов
        </div>
      </div>
      <div class="mobile-controls">
        <div class="controls-pad">
          <button @click="$emit('move', 'up')" class="control-btn" title="Движение к вам (W или ↑)">↑</button>
          <div class="horizontal-controls">
            <button @click="$emit('move', 'left')" class="control-btn" title="Движение влево (A или ←)">←</button>
            <button @click="$emit('move', 'right')" class="control-btn" title="Движение вправо (D или →)">→</button>
          </div>
          <button @click="$emit('move', 'down')" class="control-btn" title="Движение от вас (S или ↓)">↓</button>
        </div>
      </div>
      <div class="camera-controls">
        <button @click="$emit('camera-rotate', 'left')" class="camera-btn"
          title="Повернуть камеру влево (Q)">&#8634;</button>
        <button @click="$emit('camera-rotate', 'right')" class="camera-btn"
          title="Повернуть камеру вправо (E)">&#8635;</button>
        <button @click="$emit('camera-height', 'up')" class="camera-btn" title="Поднять камеру (R)">&#8593;</button>
        <button @click="$emit('camera-height', 'down')" class="camera-btn" title="Опустить камеру (F)">&#8595;</button>
      </div>
    </div>
    <div v-if="notification.show" class="notification" :class="{ hiding: notification.hiding }">
      {{ notification.message }}
    </div>
  </div>
</template>

<script lang="ts">
import { onMounted, onUnmounted, ref, defineComponent } from 'vue'

interface NotificationState {
  show: boolean;
  message: string;
  hiding: boolean;
}

export default defineComponent({
  name: 'GameContainer',
  props: {
    moves: {
      type: Number,
      required: true
    },
    collectedNumbers: {
      type: Number,
      required: true
    },
    totalTargetNumbers: {
      type: Number,
      required: true
    },
    nextNumber: {
      type: Number,
      required: true
    },
    obstacleInfo: {
      type: Number,
      default: null
    }
  },
  emits: ['move', 'camera-rotate', 'camera-height', 'debug-toggle'],
  setup(props, { emit }) {
    const notification = ref<NotificationState>({
      show: false,
      message: '',
      hiding: false
    })

    const showNotification = (message: string, duration: number = 2000): void => {
      notification.value = {
        show: true,
        message,
        hiding: false
      }

      setTimeout(() => {
        notification.value.hiding = true
        setTimeout(() => {
          notification.value.show = false
          notification.value.hiding = false
        }, 300)
      }, duration)
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'd' && event.shiftKey) {
        emit('debug-toggle')
        return
      }

      switch (event.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          emit('move', 'up')
          break
        case 'arrowdown':
        case 's':
          emit('move', 'down')
          break
        case 'arrowleft':
        case 'a':
          emit('move', 'left')
          break
        case 'arrowright':
        case 'd':
          emit('move', 'right')
          break
        case 'q':
          emit('camera-rotate', 'left')
          break
        case 'e':
          emit('camera-rotate', 'right')
          break
        case 'r':
          emit('camera-height', 'up')
          break
        case 'f':
          emit('camera-height', 'down')
          break
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
    })

    return {
      notification,
      showNotification
    }
  }
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

#game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.game-info {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 10px;
  border-radius: 5px;
  font-size: 18px;
}

.next-number {
  margin-top: 10px;
  background-color: rgba(76, 175, 80, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;
}

.obstacle-info {
  margin-top: 10px;
  background-color: rgba(198, 40, 40, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;
}

.mobile-controls {
  position: absolute;
  bottom: 30px;
  right: 30px;
  pointer-events: auto;
}

.controls-pad {
  display: grid;
  grid-template-columns: repeat(3, 60px);
  grid-template-rows: repeat(3, 60px);
  gap: 5px;
}

.control-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.control-btn:active {
  background-color: rgba(200, 200, 200, 0.9);
}

.horizontal-controls {
  display: flex;
  gap: 5px;
}

.camera-controls {
  position: absolute;
  bottom: 30px;
  left: 30px;
  display: grid;
  grid-template-columns: repeat(2, 40px);
  gap: 5px;
  pointer-events: auto;
}

.camera-btn {
  width: 40px;
  height: 40px;
  font-size: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.camera-btn:active {
  background-color: rgba(200, 200, 200, 0.9);
}

.notification {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px 30px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 24px;
  z-index: 1000;
  text-align: center;
  animation: fadeIn 0.3s ease-out forwards;
}

.notification.hiding {
  animation: fadeOut 0.3s ease-in forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -70%);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%);
  }

  to {
    opacity: 0;
    transform: translate(-50%, -30%);
  }
}

@media (max-width: 768px) {
  .game-info {
    top: 10px;
    left: 10px;
    font-size: 16px;
  }

  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .controls-pad {
    grid-template-columns: repeat(3, 50px);
    grid-template-rows: repeat(3, 50px);
  }

  .camera-btn {
    width: 35px;
    height: 35px;
    font-size: 18px;
  }
}
</style>