// --- КОНСТАНТЫ И НАСТРОЙКИ ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;

// --- СОСТОЯНИЕ ИГРЫ ---
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let food = { x: 15, y: 15 };
let score = 0;
const WINNING_SCORE = 150;
let speed = 150;
let lastStepTime = 0;
let isPaused = true;
let isGameOver = false;

let timeLeft = 60;
const totalTime = 60;
let lastTimerUpdate = 0;

let particles = [];
let foodGlow = 0;
let snakeGlow = 0;

/** Создание частиц */
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x * GRID_SIZE + GRID_SIZE / 2,
            y: y * GRID_SIZE + GRID_SIZE / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color,
            size: Math.random() * 5 + 2
        });
    }
}

/** Обновление и отрисовка частиц */
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.03; p.size *= 0.95;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/** Генерация еды */
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };
    } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
}

/** Отрисовка */
function draw() {
    ctx.fillStyle = 'rgba(26, 26, 46, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
    }
    
    foodGlow = (foodGlow + 0.1) % (Math.PI * 2);
    const glowIntensity = Math.sin(foodGlow) * 10 + 15;
    ctx.shadowColor = '#ff4444'; ctx.shadowBlur = glowIntensity;
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE/2, food.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI*2);
    ctx.fill(); ctx.shadowBlur = 0;
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE/2 - 3, food.y * GRID_SIZE + GRID_SIZE/2 - 3, 3, 0, Math.PI*2);
    ctx.fill();
    
    snake.forEach((part, index) => {
        const hue = 120 + (index * 2) % 60;
        const lightness = 50 - (index * 0.5);
        ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
        
        if (index === 0) {
            snakeGlow = (snakeGlow + 0.2) % (Math.PI * 2);
            const headGlow = Math.sin(snakeGlow) * 5 + 15;
            ctx.shadowColor = '#00ff00'; ctx.shadowBlur = headGlow;
        }
        
        const radius = GRID_SIZE / 2 - 1;
        ctx.beginPath();
        ctx.arc(part.x * GRID_SIZE + GRID_SIZE/2, part.y * GRID_SIZE + GRID_SIZE/2, radius, 0, Math.PI*2);
        ctx.fill(); ctx.shadowBlur = 0;
        
        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeOffset = 5, eyeSize = 4;
            ctx.beginPath(); ctx.arc(part.x * GRID_SIZE + GRID_SIZE/2 - eyeOffset, part.y * GRID_SIZE + GRID_SIZE/2 - eyeOffset, eyeSize, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(part.x * GRID_SIZE + GRID_SIZE/2 + eyeOffset, part.y * GRID_SIZE + GRID_SIZE/2 - eyeOffset, eyeSize, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(part.x * GRID_SIZE + GRID_SIZE/2 - eyeOffset, part.y * GRID_SIZE + GRID_SIZE/2 - eyeOffset, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(part.x * GRID_SIZE + GRID_SIZE/2 + eyeOffset, part.y * GRID_SIZE + GRID_SIZE/2 - eyeOffset, 2, 0, Math.PI*2); ctx.fill();
        }
    });
    updateAndDrawParticles();
}

/** Обновление логики */
function update(timestamp) {
    if (timestamp - lastStepTime < speed) return;
    lastStepTime = timestamp;
    direction = { ...nextDirection };

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    snake.unshift(head);
    let ateFood = false;

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        createParticles(food.x, food.y, '#ff6666', 15);
        food = generateFood();
        ateFood = true;
        if (speed > 80) speed -= 2;
    } else {
        snake.pop();
    }

    if (ateFood && score >= WINNING_SCORE) { endGame(true); return; }
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        createParticles(head.x, head.y, '#ff0000', 20); endGame(false); return;
    }
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            createParticles(head.x, head.y, '#ff0000', 20); endGame(false); return;
        }
    }
}

/** Завершение игры */
function endGame(isWin) {
    pauseGame(); isGameOver = true;
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
    
    setTimeout(() => {
        if (isWin) {
            createConfetti();
            alert(`🎉 ПОБЕДА! 🎉\nВы набрали ${score} очков!\nВремя: ${formatTime(timeLeft)}`);
        } else {
            const reason = timeLeft <= 0 ? "⏰ Время вышло!" : "💥 Вы врезались!";
            alert(`${reason}\nСчёт: ${score}`);
        }
    }, 100);
}

function createConfetti() {
    const colors = ['#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff'];
    for (let i = 0; i < 100; i++) {
        setTimeout(() => createParticles(Math.random()*TILE_COUNT, Math.random()*TILE_COUNT, colors[Math.floor(Math.random()*6)], 3), i*50);
    }
}

/** Главный цикл */
function gameLoop(timestamp) {
    if (!isPaused && !isGameOver) {
        if (timestamp - lastTimerUpdate >= 1000) {
            timeLeft--; lastTimerUpdate = timestamp;
            const timerEl = document.getElementById('timer');
            timerEl.textContent = formatTime(timeLeft);
            timeLeft <= 10 ? timerEl.classList.add('warning') : timerEl.classList.remove('warning');
            if (timeLeft <= 0) { endGame(false); return; }
        }
        update(timestamp);
        draw();
        document.getElementById('points').textContent = score;
        document.getElementById('size').textContent = snake.length;
        document.getElementById('speed').textContent = speed;
    }
    requestAnimationFrame(gameLoop);
}

// --- УПРАВЛЕНИЕ ---
function startGame() {
    if (isPaused && !isGameOver) {
        isPaused = false;
        lastStepTime = performance.now();
        lastTimerUpdate = performance.now();
        if (direction.x === 0 && direction.y === 0) nextDirection = { x: 1, y: 0 };
        requestAnimationFrame(gameLoop);
    }
}

function pauseGame() { isPaused = true; }

function resetGame() {
    pauseGame(); isGameOver = false;
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 }; nextDirection = { x: 0, y: 0 };
    score = 0; speed = 150; food = generateFood(); timeLeft = totalTime; particles = [];
    document.getElementById('timer').textContent = formatTime(timeLeft);
    document.getElementById('timer').classList.remove('warning');
    document.getElementById('points').textContent = score;
    document.getElementById('size').textContent = snake.length;
    document.getElementById('speed').textContent = speed;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw();
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// --- СОБЫТИЯ (КЛАВИАТУРА + МОБИЛЬНЫЕ КНОПКИ) ---
function setDirection(x, y) {
    if (x !== 0 && nextDirection.x === -x) return;
    if (y !== 0 && nextDirection.y === -y) return;
    nextDirection = { x, y };
    if (isPaused && !isGameOver) startGame();
}

document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) e.preventDefault();
    if (k === 'arrowup' || k === 'w') setDirection(0, -1);
    else if (k === 'arrowdown' || k === 's') setDirection(0, 1);
    else if (k === 'arrowleft' || k === 'a') setDirection(-1, 0);
    else if (k === 'arrowright' || k === 'd') setDirection(1, 0);
});

// Привязка мобильных кнопок
document.addEventListener('DOMContentLoaded', () => {
    const bind = (id, action) => {
        const el = document.getElementById(id);
        if (!el) return;
        const handler = (e) => { e.preventDefault(); action(); };
        el.addEventListener('click', handler);
        el.addEventListener('touchstart', handler, { passive: false });
    };
    bind('btnUp', () => setDirection(0, -1));
    bind('btnDown', () => setDirection(0, 1));
    bind('btnLeft', () => setDirection(-1, 0));
    bind('btnRight', () => setDirection(1, 0));
    bind('btnStart', startGame);
    bind('btnPause', pauseGame);
    bind('btnReset', resetGame);
});

window.addEventListener('load', draw);