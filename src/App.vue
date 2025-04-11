<template>
  <div id="app">
    <game-container
      :moves="movesCounter"
      :collected-numbers="collectedNumbers"
      :total-target-numbers="totalTargetNumbers"
      :next-number="nextNumber"
      :obstacle-info="obstacleInfo || 0"
      @move="handleMove"
      @camera-rotate="handleCameraRotation"
      @camera-height="handleCameraHeight"
      @debug-toggle="toggleDebugHelpers" />
    <div v-if="!gameStarted" id="game-start" class="game-screen">
      <h1>Stacker</h1>
      <p>Перекатывайте кубик и собирайте цифры от 1 до 6 в правильном порядке!</p>
      <button @click="startGame">Начать игру</button>
    </div>
    <div v-if="gameEnded" id="game-end" class="game-screen">
      <h1>Победа!</h1>
      <p>Вы собрали все цифры за <span>{{ movesCounter }}</span> ходов!</p>

      
      <button @click="restartGame">Играть снова</button>
    </div>
  </div>
</template>



<script lang="ts">
import { ref, onMounted, defineComponent } from 'vue'
import GameContainer from './components/GameContainer.vue'
import { Direction } from './domain/game-core/types'
import { Game } from './domain/game-core/game'
import { UiController } from './domain/game-core/controllers/UiController'

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
    const moveQueue = ref<Direction[]>([])
    let game: Game | null = null


    onMounted(() => {
      if (game) return
      console.log('call mount')
      game = new Game();

      new UiController(game);

      game.setCollectedNumbersChangedHandler((count: number) => {
        collectedNumbers.value = count;
        nextNumber.value = count + 1;
      });

      game.setGameCompletedHandler(() => {
        gameEnded.value = true;
      });

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

      game.init();

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

    const handleMove = (direction: Direction): void => {
      if (game && game.state.active) {
        if (game.isCubeRotating()) {
          if (game.isMovePossible(direction)) {
            moveQueue.value.push(direction)
          }
        } else {
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
        game.cameraController?.rotateLeft()
      } else if (direction === 'right') {
        game.cameraController?.rotateRight()
      }
    }

    const handleCameraHeight = (direction: string): void => {
      if (!game) return;

      if (direction === 'up') {
        game.cameraController?.increaseHeight()
      } else if (direction === 'down') {
        game.cameraController?.decreaseHeight()
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