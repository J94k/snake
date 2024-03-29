'use strict';

// ***************************************
// **********  Game field  ***************
// ***************************************

class GameField {
  constructor(params) {
    const { size } = params;

    this.size = size;
    this.areaSize = size ** 2;
    this.element = document.querySelector('.game-field');
    this.allBlocks = undefined;

    this.fill();
  }

  fill() {
    const gameField = document.querySelector('.game-field');

    gameField.setAttribute(
      'style',
      `
      grid-template-columns: repeat(${this.size}, 1fr);
      grid-template-rows: repeat(${this.size}, 1fr);
      `
    );

    for (let i = 1; i <= this.areaSize; i += 1) {
      const block = document.createElement('div');

      block.classList.add('block');
      this.element.appendChild(block);
    }

    this.allBlocks = this.element.children;
  }

  clean() {
    // at first we have to make a real array to be able to change the blocks
    [...this.allBlocks].map((block) => (block.className = 'block'));
  }

  getRandomPositionInfo() {
    // -1 because array's index starts from zero
    const randomPosition = Math.ceil(Math.random() * this.areaSize) - 1;
    const randomPositionClasses = [...this.allBlocks[randomPosition].classList];

    return {
      randomPosition,
      randomPositionClasses,
    };
  }

  generateNewStuff(params) {
    const { className } = params;
    let canNotAddStuff = true;

    while (canNotAddStuff) {
      const { randomPosition, randomPositionClasses } =
        this.getRandomPositionInfo();

      // add a new point only for empty blocks
      if (
        randomPositionClasses.length === 1 &&
        randomPositionClasses.includes('block')
      ) {
        canNotAddStuff = false;
        this.allBlocks[randomPosition].classList.add(className);
      }
    }
  }
}

// ***************************************
// *************  Snake  *****************
// ***************************************

class Snake {
  constructor(params) {
    const { life, field, speed } = params;
    // -1 because array's index starts from zero
    const startPosition = Math.ceil(field.areaSize / 2) - 1;

    this.sourceSpeed = speed; // ms
    this.speed = speed; // increase this indicator
    this.life = life;
    this.field = field;
    this.allBlocks = field.element.children;
    this.startPosition = startPosition;
    this.bodyItems = [startPosition];
    this.movement = 'up';
    this.score = 0;
    this.movingIntervalId = undefined;
    this.pause = false;

    this.allBlocks[startPosition].classList.add('snake-head');
    document.querySelector('.header__score b').textContent = this.score;
  }

  logCoordinates() {
    console.group('%c Coordinates', 'color: brown; font-size: 14px');
    console.log('movement: ', this.movement);
    console.log('head: ', this.bodyItems[0]);
    console.log('body items: ', this.bodyItems);
    console.groupEnd();
  }

  begin() {
    document.addEventListener('keydown', (event) => {
      const key = event.key;
      const prevMovement = this.movement;

      const onUp = key === 'w' || key === 'ц' || key === 'ArrowUp';
      const onDown = key === 's' || key === 'ы' || key === 'ArrowDown';
      const onLeft = key === 'a' || key === 'ф' || key === 'ArrowLeft';
      const onRight = key === 'd' || key === 'в' || key === 'ArrowRight';

      if (onUp || onDown || onLeft || onRight) {
        this.pointGeneration();
      }

      if (event.code === 'Space') {
        this.pauseToggle();
      }

      if (this.pause) {
        return;
      }

      this.setSnakeMovement({
        prevMovement,
        event,
        events: {
          onUp,
          onDown,
          onLeft,
          onRight,
        },
      });
    });
  }

  pointGeneration() {
    const pointBlock = [...this.allBlocks].find((block) =>
      [...block.classList].includes('point')
    );

    if (!pointBlock) {
      this.field.generateNewStuff({
        className: 'point',
      });
    }
  }

  setSnakeMovement(params) {
    const { event, events, prevMovement } = params;

    if (events.onUp) {
      this.movement = 'up';
      this.moveUp();
    }

    if (events.onDown) {
      this.movement = 'down';
      this.moveDown();
    }

    if (events.onLeft) {
      this.movement = 'left';
      this.moveLeft();
    }

    if (events.onRight) {
      this.movement = 'right';
      this.moveRight();
    }

    if (event.key === 'Escape') {
      this.lose();
    }

    this.startSnakeMovement({
      key: event.key,
      prevMovement,
    });
  }

  startSnakeMovement(params) {
    const { key, prevMovement } = params;
    if (
      [
        'w',
        's',
        'a',
        'd',
        'ц',
        'ы',
        'ф',
        'в',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(key)
    ) {
      if (!this.movingIntervalId || this.movement !== prevMovement) {
        clearInterval(this.movingIntervalId);

        this.movingIntervalId = setInterval(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key }));
        }, this.speed);
      }
    }
  }

  pauseToggle() {
    this.pause = !this.pause;
  }

  lose() {
    this.setScore(0);
    this.speed = this.sourceSpeed;

    clearInterval(this.movingIntervalId);

    this.field.clean();
    // save only one head block
    this.bodyItems = [this.startPosition];
    // move the head on start
    this.allBlocks[this.startPosition].classList.add('snake-head');
  }

  moveUp() {
    let currentHeadPosition = this.bodyItems[0] - this.field.size;
    const firstBlockInTheFirstRow = 0;

    if (currentHeadPosition === 0) {
      currentHeadPosition += this.field.areaSize - this.field.size;
    } else if (
      currentHeadPosition + this.field.size >= firstBlockInTheFirstRow &&
      currentHeadPosition + this.field.size <= this.field.size
    ) {
      currentHeadPosition += this.field.areaSize;
    }

    this.updateSnakePosition({
      prevHeadPosition: this.bodyItems[0],
      currentHeadPosition,
    });
    // this.logCoordinates('up');
  }

  moveDown() {
    let currentHeadPosition = this.bodyItems[0] + this.field.size;
    const firstBlockInTheLastRow = this.field.areaSize - this.field.size;

    if (
      currentHeadPosition - this.field.size >= firstBlockInTheLastRow &&
      currentHeadPosition - this.field.size <= this.field.areaSize
    ) {
      currentHeadPosition %= this.field.size;
    }

    this.updateSnakePosition({
      prevHeadPosition: this.bodyItems[0],
      currentHeadPosition,
    });
    // this.logCoordinates('down');
  }

  moveLeft() {
    let currentHeadPosition = this.bodyItems[0] - 1;
    // TODO: delete magic numbers
    if (
      (currentHeadPosition + 2) % this.field.size === 1 ||
      currentHeadPosition + 1 === 0
    ) {
      currentHeadPosition += this.field.size;
    }

    this.updateSnakePosition({
      prevHeadPosition: this.bodyItems[0],
      currentHeadPosition,
    });
    // this.logCoordinates('left');
  }

  moveRight() {
    let currentHeadPosition = this.bodyItems[0] + 1;

    if (!(currentHeadPosition % this.field.size)) {
      currentHeadPosition -= this.field.size;
    }

    this.updateSnakePosition({
      prevHeadPosition: this.bodyItems[0],
      currentHeadPosition,
    });
    // this.logCoordinates('right');
  }

  updateSnakePosition(params) {
    const { prevHeadPosition, currentHeadPosition } = params;

    const isLoss = this.checkGameLoss({
      prevHeadPosition,
      currentHeadPosition,
    });

    if (isLoss) return;

    this.moveSnake({
      prevHeadPosition,
      currentHeadPosition,
    });

    const currentBlockClasses = this.allBlocks[currentHeadPosition].classList;
    const gotPoint = [...currentBlockClasses].includes('point');

    if (gotPoint) {
      this.setScore(this.score + 1);
      this.increaseSnake({
        currentHeadPosition,
      });
      currentBlockClasses.remove('point');
      this.field.generateNewStuff({
        className: 'point',
      });
    }
  }

  checkGameLoss(params) {
    const { currentHeadPosition } = params;

    const headBlockClasses = [...this.allBlocks[currentHeadPosition].classList];
    const headInTheWrongPosition =
      headBlockClasses.includes('hole') ||
      // snake's head on the one of her body blocks
      this.bodyItems.slice(1).find((index) => currentHeadPosition === index);

    if (headInTheWrongPosition) {
      this.lose();

      return true;
    }

    return false;
  }

  moveSnake(params) {
    const { prevHeadPosition, currentHeadPosition } = params;

    // move the head forward
    this.allBlocks[prevHeadPosition].classList.remove('snake-head');
    this.allBlocks[currentHeadPosition].classList.add('snake-head');
    // update snake block indexes
    this.bodyItems.unshift(currentHeadPosition);
    this.bodyItems[1] = prevHeadPosition;

    const deletedBlockIndex = this.bodyItems[this.bodyItems.length - 1];

    this.bodyItems.length -= 1;

    this.allBlocks[deletedBlockIndex].classList.remove('snake');
    this.allBlocks[deletedBlockIndex].classList.remove('tail');

    // start from 1 because we've already moved the snake's head
    this.bodyItems.slice(1).map((bodyBlockIndex, index) => {
      if (index < this.bodyItems.length - 2) {
        this.allBlocks[bodyBlockIndex].classList.add('snake');
      } else {
        this.allBlocks[bodyBlockIndex].classList.add('tail');
      }
    });
  }

  setScore(newScore) {
    this.score = newScore;
    document.querySelector('.header__score b').textContent = this.score;

    if (this.score && !(this.score % 5)) {
      this.increaseSpeed();
      this.field.generateNewStuff({
        className: 'hole',
      });
    }
  }

  increaseSpeed() {
    this.speed -= 5;
  }

  increaseSnake(params) {
    const { currentHeadPosition } = params;

    this.bodyItems.push(currentHeadPosition);
  }
}

// ***************************************
// **********  Instances  ****************
// ***************************************

const gameField = new GameField({
  size: 21,
});

const snake = new Snake({
  field: gameField,
  life: 3,
  speed: 180,
});

snake.begin();

// ***************************************
// ************  Footer  *****************
// ***************************************

document.querySelector(
  'footer .copyright'
).textContent = `© ${new Date().getFullYear()} Creeping`;
