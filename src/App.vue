<template>
  <div id="app">
    <game-container :moves="movesCounter" :collected-numbers="collectedNumbers"
      :total-target-numbers="totalTargetNumbers" :next-number="nextNumber" :obstacle-info="obstacleInfo"
      @move="handleMove" @camera-rotate="handleCameraRotation" @camera-height="handleCameraHeight"
      @debug-toggle="toggleDebugHelpers" />
    <div id="game-start" class="game-screen" v-if="!gameStarted">
      <h1>Stacker</h1>
      <p>Перекатывайте кубик и собирайте цифры от 1 до 6 в правильном порядке!</p>
      <button @click="startGame">Начать игру</button>
    </div>
    <div id="game-end" class="game-screen" v-if="gameEnded">
      <h1>Победа!</h1>
      <p>Вы собрали все цифры за <span>{{ movesCounter }}</span> ходов!</p>
      <button @click="restartGame">Играть снова</button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from 'vue'
import GameContainer from './components/GameContainer.vue'
import { Game } from './js/game'
import { UI } from "./js/ui";
import type { Game as GameType } from './types/game'

export default defineComponent({
  name: 'App',
  components: {
    GameContainer
  },
  setup() {
    const gameStarted = ref<boolean>(false)
    const gameEnded = ref<boolean>(false)
    const movesCounter = ref<number>(0)
    const collectedNumbers = ref<number>(0)
    const totalTargetNumbers = ref<number>(6)
    const nextNumber = ref<number>(1)
    const obstacleInfo = ref<number | null>(null)
    const moveQueue = ref<string[]>([])
    let game: Game | null = null


    onMounted(() => {
      if (game) return
      console.log('call mount')
      game = new Game() as GameType;

      // Создаем экземпляр UI
      const ui = new UI(game);

      // Устанавливаем ссылку на UI в игре
      game.setUI(ui);

      // Устанавливаем обработчик изменения количества собранных цифр
      game.setCollectedNumbersChangedHandler((count: number) => {
        collectedNumbers.value = count;
        nextNumber.value = count + 1;
      });

      // Устанавливаем обработчик завершения игры
      game.setGameCompletedHandler(() => {
        gameEnded.value = true;
      });

      // Устанавливаем обработчик для проверки очереди ходов
      game.setRotationCompletedHandler(() => {
        if (moveQueue.value.length > 0) {
          const nextDirection = moveQueue.value.shift()
          if (nextDirection && game) {
            const moved = game.moveCube(nextDirection)
            if (moved) {
              movesCounter.value++
            }
          }
        }
      });

      // Инициализируем игру
      game.init();

      // Запускаем игровой цикл
      game.animate();
    })

    const startGame = (): void => {
      gameStarted.value = true
      if (game) {
        game.start()
      }
    }

    const restartGame = (): void => {
      gameEnded.value = false
      movesCounter.value = 0
      collectedNumbers.value = 0
      nextNumber.value = 1
      moveQueue.value = []
      if (game) {
        game.reset()
        game.start()
      }
    }

    const handleMove = (direction: string): void => {
      if (game && game.isActive()) {
        if (game.isCubeRotating()) {
          // If cube is rotating or teleporting, add move to queue
          moveQueue.value.push(direction)
        } else {
          // If cube is not rotating, execute the move immediately
          const moved = game.moveCube(direction)
          if (moved) {
            movesCounter.value++
          }
        }
      }
    }

    const handleCameraRotation = (direction: string): void => {
      if (!game) return;

      if (direction === 'left') {
        game.rotateCameraLeft()
      } else if (direction === 'right') {
        game.rotateCameraRight()
      }
    }

    const handleCameraHeight = (direction: string): void => {
      if (!game) return;

      if (direction === 'up') {
        game.increaseCameraHeight()
      } else if (direction === 'down') {
        game.decreaseCameraHeight()
      }
    }

    const toggleDebugHelpers = (): void => {
      if (game) {
        game.toggleDebugHelpers()
      }
    }

    return {
      gameStarted,
      gameEnded,
      movesCounter,
      collectedNumbers,
      totalTargetNumbers,
      nextNumber,
      obstacleInfo,
      moveQueue,
      startGame,
      restartGame,
      handleMove,
      handleCameraRotation,
      handleCameraHeight,
      toggleDebugHelpers
    }
  }
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  position: relative;
}

.game-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 3;
  text-align: center;
  padding: 20px;
}

.game-screen h1 {
  font-size: 48px;
  margin-bottom: 20px;
}

.game-screen p {
  font-size: 24px;
  margin-bottom: 30px;
}

.game-screen button {
  padding: 15px 30px;
  font-size: 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.game-screen button:hover {
  background: #45a049;
}

@media (max-width: 768px) {
  .game-screen h1 {
    font-size: 36px;
  }

  .game-screen p {
    font-size: 18px;
    max-width: 90%;
  }
}
</style>