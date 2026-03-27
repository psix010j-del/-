// --- КОНСТАНТЫ И НАСТРОЙКИ ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;

// --- СОСТОЯНИЕ ИГРЫ ---
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 }; // Буфер для следующего направления
let food = { x: 15, y: 15 };
let score = 0;
const WINNING_SCORE = 150;
let speed = 150;
let lastStepTime = 0;
let isPaused = true;
let isGameOver = false;

// --- ПЕРЕМЕННЫЕ ДЛЯ ТАЙМЕРА ---
let timeLeft = 60;
const totalTime = 60;
let lastTimerUpdate = 0;

// --- ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ---
let particles = [];
let foodGlow = 0;
let snakeGlow = 0;

/**
 * Создание частиц
 */
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x * GRID_SIZE + GRID_SIZE / 2,
            y: y * GRID_SIZE + GRID_SIZE / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: color,
            size: Math.random() * 5 + 2
        });
    }
}

/**
 * Обновление и отрисовка частиц
 */
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        p.size *= 0.95;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/**
 * Генерация еды в случайной клетке
 */
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

/**
 * Отрисовка игры с эффектами
 */
function draw() {
    // Очистка с эффектом шлейфа
    ctx.fillStyle = 'rgba(26, 26, 46, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка сетки (едва заметная)
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }
    
    // Еда с эффектом свечения
    foodGlow = (foodGlow + 0.1) % (Math.PI * 2);
    const glowIntensity = Math.sin(foodGlow) * 10 + 15;
    
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = glowIntensity;
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Внутренний блик на еде
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2 - 3,
        food.y * GRID_SIZE + GRID_SIZE / 2 - 3,
        3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Змейка с градиентом и свечением
    snake.forEach((part, index) => {
        // Градиент от головы к хвосту
        const hue = 120 + (index * 2) % 60;
        const lightness = 50 - (index * 0.5);
        ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
        
        // Свечение для головы
        if (index === 0) {
            snakeGlow = (snakeGlow + 0.2) % (Math.PI * 2);
            const headGlow = Math.sin(snakeGlow) * 5 + 15;
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = headGlow;
        }
        
        // Скругленные сегменты
        const radius = GRID_SIZE / 2 - 1;
        ctx.beginPath();
        ctx.arc(
            part.x * GRID_SIZE + GRID_SIZE / 2,
            part.y * GRID_SIZE + GRID_SIZE / 2,
            radius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Глаза у головы
        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeOffset = 5;
            const eyeSize = 4;
            
            // Левый глаз
            ctx.beginPath();
            ctx.arc(
                part.x * GRID_SIZE + GRID_SIZE / 2 - eyeOffset,
                part.y * GRID_SIZE + GRID_SIZE / 2 - eyeOffset,
                eyeSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Правый глаз
            ctx.beginPath();
            ctx.arc(
                part.x * GRID_SIZE + GRID_SIZE / 2 + eyeOffset,
                part.y * GRID_SIZE + GRID_SIZE / 2 - eyeOffset,
                eyeSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Зрачки
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(
                part.x * GRID_SIZE + GRID_SIZE / 2 - eyeOffset,
                part.y * GRID_SIZE + GRID_SIZE / 2 - eyeOffset,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(
                part.x * GRID_SIZE + GRID_SIZE / 2 + eyeOffset,
                part.y * GRID_SIZE + GRID_SIZE / 2 - eyeOffset,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });
    
    // Отрисовка частиц
    updateAndDrawParticles();
}

/**
 * Обновление логики (движение, столкновения)
 */
function update(timestamp) {
    if (timestamp - lastStepTime < speed) return;
    lastStepTime = timestamp;

    // Применяем направление из буфера (мгновенный отклик)
    direction = { ...nextDirection };

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    snake.unshift(head);

    let ateFood = false;

    // Поедание еды
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        createParticles(food.x, food.y, '#ff6666', 15);
        food = generateFood();
        ateFood = true;
        
        // Эффект увеличения скорости
        if (speed > 80) {
            speed -= 2;
        }
    } else {
        snake.pop();
    }

    // Проверка победы
    if (ateFood && score >= WINNING_SCORE) {
        endGame(true);
        return;
    }

    // Столкновения со стенами и телом
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        createParticles(head.x, head.y, '#ff0000', 20);
        endGame(false);
        return;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            createParticles(head.x, head.y, '#ff0000', 20);
            endGame(false);
            return;
        }
    }
}

/**
 * Завершение игры
 */
function endGame(isWin) {
    pauseGame();
    isGameOver = true;
    
    // Эффект тряски экрана
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
    
    setTimeout(() => {
        if (isWin) {
            createConfetti();
            alert(`🎉 ПОБЕДА! 🎉\nВы набрали ${score} очков и достигли цели!\nВаше время: ${formatTime(timeLeft)}`);
        } else {
            const reason = timeLeft <= 0 ? "⏰ Время вышло!" : "💥 Вы врезались!";
            alert(`${reason}\nВаш итоговый счёт: ${score}`);
        }
    }, 100);
}

/**
 * Создание конфетти при победе
 */
function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            createParticles(
                Math.random() * TILE_COUNT,
                Math.random() * TILE_COUNT,
                colors[Math.floor(Math.random() * colors.length)],
                3
            );
        }, i * 50);
    }
}

/**
 * Главный цикл рендеринга
 */
function gameLoop(timestamp) {
    if (!isPaused && !isGameOver) {
        // Обработка таймера
        if (timestamp - lastTimerUpdate >= 1000) {
            timeLeft--;
            lastTimerUpdate = timestamp;
            document.getElementById('timer').textContent = formatTime(timeLeft);
            
            // Предупреждение о малом времени
            const timerElement = document.getElementById('timer');
            if (timeLeft <= 10) {
                timerElement.classList.add('warning');
            } else {
                timerElement.classList.remove('warning');
            }
            
            if (timeLeft <= 0) {
                endGame(false);
                return;
            }
        }

        update(timestamp);
        draw();

        document.getElementById('points').textContent = score;
        document.getElementById('size').textContent = snake.length;
        document.getElementById('speed').textContent = speed;
    }
    
    requestAnimationFrame(gameLoop);
}

// --- УПРАВЛЕНИЕ ИГРОВЫМ ЦИКЛОМ ---
function startGame() {
    if (isPaused && !isGameOver) {
        isPaused = false;
        lastStepTime = 0;
        lastTimerUpdate = performance.now();
        
        // Начальное направление (вправо по умолчанию)
        if (direction.x === 0 && direction.y === 0) {
            nextDirection = { x: 1, y: 0 };
        }
        
        requestAnimationFrame(gameLoop);
    }
}

function pauseGame() {
    isPaused = true;
}

/**
 * Полный сброс игры
 */
function resetGame() {
    pauseGame();
    isGameOver = false;
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    nextDirection = { x: 0, y: 0 };
    score = 0;
    speed = 150;
    food = generateFood();
    timeLeft = totalTime;
    particles = [];
    
    document.getElementById('timer').textContent = formatTime(timeLeft);
    document.getElementById('timer').classList.remove('warning');
    document.getElementById('points').textContent = score;
    document.getElementById('size').textContent = snake.length;
    document.getElementById('speed').textContent = speed;
    
    // Полная очистка канваса
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw();
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// --- ОБРАБОТКА СОБЫТИЙ (МГНОВЕННЫЙ ОТКЛИК) ---
document.addEventListener('keydown', e => {
    const keyPressed = e.key.toLowerCase();
    
    // Предотвращаем прокрутку страницы стрелками
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    // Мгновенное изменение направления (без задержки)
    if ((keyPressed === 'arrowup' || keyPressed === 'w') && direction.y !== 1) {
        nextDirection = { x: 0, y: -1 };
    } else if ((keyPressed === 'arrowdown' || keyPressed === 's') && direction.y !== -1) {
        nextDirection = { x: 0, y: 1 };
    } else if ((keyPressed === 'arrowleft' || keyPressed === 'a') && direction.x !== 1) {
        nextDirection = { x: -1, y: 0 };
    } else if ((keyPressed === 'arrowright' || keyPressed === 'd') && direction.x !== -1) {
        nextDirection = { x: 1, y: 0 };
    }
});

// Инициализация при загрузке
window.addEventListener('load', () => {
    draw();
});