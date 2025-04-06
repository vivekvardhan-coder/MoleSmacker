// Game Constants
const GAME_DURATION = 30; // seconds
const HOLE_COUNT = 6;
const MIN_MOLE_SHOW_TIME = 1000; // milliseconds
const MAX_MOLE_SHOW_TIME = 2000; // milliseconds
const MIN_MOLE_WAIT_TIME = 500; // milliseconds
const MAX_MOLE_WAIT_TIME = 1500; // milliseconds

// DOM Elements - Landing Page
const landingPage = document.getElementById('landing-page');
const startIntroButton = document.getElementById('start-intro');

// DOM Elements - Game
const gameContainer = document.getElementById('game-container');
const board = document.getElementById('board');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const countdownElement = document.getElementById('countdown');
const countdownNumberElement = document.querySelector('.countdown-number');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.querySelector('.final-score');
const playAgainButton = document.getElementById('play-again');
const backToIntroButton = document.getElementById('back-to-intro');
const levelDisplay = document.getElementById('level');
const hammer = document.getElementById('hammer');

// Sound System
let soundsEnabled = false;
const sounds = {
  whack: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3'),
  moleAppear: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3'),
  gameStart: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-show-suspense-waiting-668.mp3'),
  gameOver: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'),
  countdown: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-show-countdown-bleeps-919.mp3'),
  levelUp: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3'),
  combo: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-extra-bonus-in-a-video-game-2045.mp3'),
  missedMole: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-lose-2027.mp3')
};

// Initialize sounds
function initSounds() {
  // Configure sounds
  sounds.background.volume = 0.3;
  sounds.background.loop = true;
  
  // Enable sounds after first user interaction
  document.addEventListener('click', enableSounds, { once: true });
  document.addEventListener('touchstart', enableSounds, { once: true });
}

function enableSounds() {
  soundsEnabled = true;
  // Play silent sound to unlock audio
  const silentSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...');
  silentSound.play().then(() => silentSound.remove());
}

// Play sound with safety checks
function playSound(sound) {
  if (!soundsEnabled) return;
  try {
    sound.currentTime = 0;
    sound.play().catch(e => console.log('Sound play failed:', e));
  } catch (e) {
    console.log('Sound error:', e);
  }
}

// Initialize sounds when DOM loads
document.addEventListener('DOMContentLoaded', initSounds);

// Game State
let score = 0;
let timer = GAME_DURATION;
let lastHole;
let timeUp = false;
let gameActive = false;
let gameInterval;
let level = 1;
let combo = 0;
let comboTimeout;
let speedMultiplier = 1;

// Initialize game board
function initBoard() {
  board.innerHTML = '';
  for (let i = 0; i < HOLE_COUNT; i++) {
    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.dataset.index = i;
    
    const mole = document.createElement('div');
    mole.className = 'mole';
    
    hole.appendChild(mole);
    board.appendChild(hole);
    
    hole.addEventListener('mousedown', whackMole);
    hole.addEventListener('touchstart', whackMole);
  }
}

// Get random time
function getRandomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min) / speedMultiplier;
}

// Get random hole
function getRandomHole() {
  const holes = document.querySelectorAll('.hole');
  const idx = Math.floor(Math.random() * holes.length);
  const hole = holes[idx];
  
  if (hole === lastHole) {
    return getRandomHole();
  }
  
  lastHole = hole;
  return hole;
}

// Make a mole appear
function showMole() {
  if (timeUp) return;
  
  const time = getRandomTime(MIN_MOLE_SHOW_TIME, MAX_MOLE_SHOW_TIME);
  const hole = getRandomHole();
  const mole = hole.querySelector('.mole');
  
  mole.classList.add('up');
  playSound(sounds.moleAppear);
  
  setTimeout(() => {
    mole.classList.remove('up');
    if (!timeUp && gameActive) {
      // Missed mole penalty
      if (!mole.classList.contains('whacked')) {
        combo = 0; // Reset combo
  playSound(sounds.missedMole);
        mole.classList.add('annoyed');
        setTimeout(() => mole.classList.remove('annoyed'), 500);
      }
      setTimeout(showMole, getRandomTime(MIN_MOLE_WAIT_TIME, MAX_MOLE_WAIT_TIME));
    }
    mole.classList.remove('whacked');
  }, time);
}

// Handle whacking moles
function whackMole(e) {
  if (!gameActive) return;
  
  // Prevent default behavior for touch events
  if (e.type === 'touchstart') {
    e.preventDefault();
  }
  
  const mole = this.querySelector('.mole');
  if (!mole.classList.contains('up') || mole.classList.contains('whacked')) return;
  
  // Get coordinates for effects
  const x = e.pageX || (e.touches && e.touches[0].pageX);
  const y = e.pageY || (e.touches && e.touches[0].pageY);
  
  // Generate particles
  createParticles(x, y);
  
  // Show hammer hit animation
  hammer.classList.add('hit');
  setTimeout(() => hammer.classList.remove('hit'), 100);
  
  mole.classList.add('whacked');
  playSound(sounds.whack);
  
  // Increase combo
  combo++;
  updateScore();
  
  // Show combo indicator
  if (combo > 1) {
    showComboIndicator(x, y);
  playSound(sounds.combo);
  }
  
  // Reset combo timeout
  clearTimeout(comboTimeout);
  comboTimeout = setTimeout(() => {
    combo = 0;
  }, 2000);
  
  // Check for level up
  checkLevelUp();
}

// Update score based on combo
function updateScore() {
  const points = Math.pow(2, Math.min(combo - 1, 3));
  score += points * level;
  scoreDisplay.textContent = score;
}

// Show combo indicator
function showComboIndicator(x, y) {
  const comboIndicator = document.createElement('div');
  comboIndicator.className = 'combo-indicator';
  comboIndicator.textContent = `${combo}x Combo!`;
  comboIndicator.style.left = `${x}px`;
  comboIndicator.style.top = `${y}px`;
  document.body.appendChild(comboIndicator);
  
  setTimeout(() => {
    comboIndicator.classList.add('active');
  }, 10);
  
  setTimeout(() => {
    comboIndicator.classList.remove('active');
    setTimeout(() => comboIndicator.remove(), 300);
  }, 1000);
}

// Check for level up
function checkLevelUp() {
  const newLevel = Math.floor(score / 200) + 1;
  if (newLevel > level) {
    level = newLevel;
    levelDisplay.textContent = `Level: ${level}`;
    speedMultiplier = 1 + (level * 0.1);
  playSound(sounds.levelUp);
    
    // Visual feedback for level up
    document.body.style.background = `linear-gradient(135deg, #2c3e50, #${Math.floor(Math.random()*16777215).toString(16)})`;
    gameContainer.style.background = document.body.style.background;
    
    board.style.animation = 'none';
    void board.offsetWidth; // Trigger reflow
    board.style.animation = 'flash 0.5s';
  }
}

// Create particles
function createParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    
    // Random direction
    const dx = (Math.random() - 0.5) * 100;
    const dy = (Math.random() - 0.5) * 100;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    
    document.body.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => particle.remove(), 800);
  }
}

// Start game
function startGame() {
  // Reset game state
  score = 0;
  timer = GAME_DURATION;
  timeUp = false;
  combo = 0;
  level = 1;
  speedMultiplier = 1;
  
  // Update displays
  scoreDisplay.textContent = score;
  timerDisplay.textContent = timer;
  levelDisplay.textContent = `Level: ${level}`;
  
  // Start countdown
  startButton.disabled = true;
  countdownElement.classList.add('active');
  
  let count = 3;
  countdownNumberElement.textContent = count;
  countdownNumberElement.classList.add('active');
  playSound(sounds.countdown);
  
  const countdownInterval = setInterval(() => {
    count--;
    
    if (count <= 0) {
      clearInterval(countdownInterval);
      countdownElement.classList.remove('active');
      countdownNumberElement.classList.remove('active');
      
      // Start actual game
      startActualGame();
    } else {
      countdownNumberElement.classList.remove('active');
      setTimeout(() => {
        countdownNumberElement.textContent = count;
        countdownNumberElement.classList.add('active');
        playSound(sounds.countdown);
      }, 10);
    }
  }, 1000);
}

// Start the actual gameplay after countdown
function startActualGame() {
  gameActive = true;
  playSound(sounds.gameStart);
  
  // Start moles appearing
  showMole();
  
  // Start timer
  gameInterval = setInterval(() => {
    timer--;
    timerDisplay.textContent = timer;
    
    if (timer <= 0) {
      endGame();
    }
  }, 1000);
}

// End game
function endGame() {
  clearInterval(gameInterval);
  timeUp = true;
  gameActive = false;
  playSound(sounds.gameOver);
  
  // Show game over screen
  finalScoreElement.textContent = score;
  gameOverElement.classList.add('active');
}

// Reset game
function resetGame() {
  gameOverElement.classList.remove('active');
  startButton.disabled = false;
  document.body.style.background = 'linear-gradient(135deg, #2c3e50, #4a6572)';
  gameContainer.style.background = document.body.style.background;
}

// Start intro (show game from landing page)
function startIntro() {
  landingPage.classList.add('fade-out');
  
  setTimeout(() => {
    landingPage.style.display = 'none';
    gameContainer.style.display = 'flex';
    gameContainer.classList.add('active');
  }, 500);
}

// Back to intro
function goBackToIntro() {
  gameContainer.classList.remove('fade-in');
  
  setTimeout(() => {
    gameContainer.style.display = 'none';
    landingPage.style.display = 'flex';
    
    setTimeout(() => {
      landingPage.classList.remove('fade-out');
    }, 50);
  }, 500);
}

// Mouse move handler for hammer
function handleMouseMove(e) {
  if (!gameActive) return;
  
  hammer.style.left = `${e.pageX}px`;
  hammer.style.top = `${e.pageY}px`;
  
  if (!hammer.classList.contains('active')) {
    hammer.classList.add('active');
  }
}

// Touch move handler for hammer on mobile
function handleTouchMove(e) {
  if (!gameActive) return;
  
  const touch = e.touches[0];
  hammer.style.left = `${touch.pageX}px`;
  hammer.style.top = `${touch.pageY}px`;
  
  if (!hammer.classList.contains('active')) {
    hammer.classList.add('active');
  }
}

// Initialize game
function init() {
  initBoard();
  
  // Event listeners
  startIntroButton.addEventListener('click', startIntro);
  startButton.addEventListener('click', startGame);
  playAgainButton.addEventListener('click', resetGame);
  backToIntroButton.addEventListener('click', goBackToIntro);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('mouseleave', () => {
    hammer.classList.remove('active');
  });
  
  // Prevent default behavior of touch events to avoid scrolling
  document.addEventListener('touchstart', e => {
    if (gameActive && e.target.closest('.hole')) e.preventDefault();
  }, { passive: false });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    // Adjust game layout if needed
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      board.className = 'game-board mobile';
    } else {
      board.className = 'game-board';
    }
  });
  
  // Initial setup
  document.body.style.background = 'linear-gradient(135deg, #2c3e50, #4a6572)';
  gameContainer.style.display = 'none';
  
  // Check if mobile and adjust layout
  if (window.innerWidth < 768) {
    board.className = 'game-board mobile';
  }
}

// Initialize on load
window.addEventListener('load', init);