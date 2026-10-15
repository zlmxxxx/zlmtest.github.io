// ========== 通用 ==========
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const colorScheme = window.matchMedia('(prefers-color-scheme: light)');

function onMediaChange(query, handler) {
    // 旧版 Safari 只支持 addListener
    if (query.addEventListener) {
        query.addEventListener('change', handler);
    } else if (query.addListener) {
        query.addListener(handler);
    }
}

// ========== 粒子背景效果 ==========
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
const MAX_PARTICLES = 150;
const LINK_DISTANCE = 120;
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE;
let particles = [];
let viewWidth = 0;
let viewHeight = 0;
let animationId = null;
// 粒子颜色取自 CSS 变量，随深浅色主题切换
let particleRgb = '165, 180, 252';

function readThemeColors() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--particle-rgb').trim();
    if (value) particleRgb = value;
}

function resizeCanvas() {
    // 按设备像素比放大画布，避免高分屏上发虚
    const dpr = window.devicePixelRatio || 1;
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;
    canvas.width = Math.round(viewWidth * dpr);
    canvas.height = Math.round(viewHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

class Particle {
    constructor() {
        this.x = Math.random() * viewWidth;
        this.y = Math.random() * viewHeight;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.4 + 0.15;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > viewWidth) this.speedX *= -1;
        if (this.y < 0 || this.y > viewHeight) this.speedY *= -1;
    }

    draw() {
        ctx.fillStyle = `rgba(${particleRgb}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    // 连线计算是 O(n²)，限制粒子上限以免大屏卡顿
    const particleCount = Math.min(MAX_PARTICLES, Math.floor((viewWidth * viewHeight) / 18000));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distanceSq = dx * dx + dy * dy;

            // 先用距离平方筛选，只对需要连线的粒子开方
            if (distanceSq < LINK_DISTANCE_SQ) {
                const opacity = 1 - Math.sqrt(distanceSq) / LINK_DISTANCE;
                ctx.strokeStyle = `rgba(${particleRgb}, ${opacity * 0.18})`;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function drawParticles(move) {
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    particles.forEach(p => {
        if (move) p.update();
        p.draw();
    });

    connectParticles();
}

function animateParticles() {
    drawParticles(true);
    animationId = requestAnimationFrame(animateParticles);
}

function startParticles() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // 减少动态效果时只绘制一帧静态背景
    if (reducedMotion.matches) {
        drawParticles(false);
    } else {
        animateParticles();
    }
}

// ========== 数字滚动动画 ==========
function formatNumber(value, decimals) {
    // 千分位分隔，例如 5817 → 5,817
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-value');

    numbers.forEach(num => {
        const raw = num.dataset.target;
        const target = parseFloat(raw);
        // 小数位数跟随 data-target 的写法，避免 80 显示成 80.0
        const decimals = (raw.split('.')[1] || '').length;

        if (reducedMotion.matches) {
            num.textContent = formatNumber(target, decimals);
            return;
        }

        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(Math.max(elapsed / duration, 0), 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = target * easeOut;

            num.textContent = formatNumber(decimals > 0 ? current : Math.floor(current), decimals);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        num.textContent = formatNumber(0, decimals);
        requestAnimationFrame(update);
    });
}

// ========== 滚动显现动画 ==========
function handleScrollAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    const statsSection = document.getElementById('stats');

    function startStats() {
        if (!statsSection.dataset.animated) {
            statsSection.dataset.animated = 'true';
            animateNumbers();
        }
    }

    // 不支持 IntersectionObserver 时直接显示全部内容
    if (!('IntersectionObserver' in window)) {
        revealElements.forEach(el => el.classList.add('visible'));
        startStats();
        return;
    }

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);

                // 数字统计区触发数字动画
                if (entry.target.classList.contains('stat-card')) {
                    startStats();
                }
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        observer.observe(el);
    });
}

// ========== 导航栏 ==========
function initNav() {
    const nav = document.querySelector('nav');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.getElementById('nav-links');

    function setMenuOpen(open) {
        links.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    }

    toggle.addEventListener('click', () => {
        setMenuOpen(!links.classList.contains('open'));
    });

    links.addEventListener('click', (e) => {
        if (e.target.closest('a')) setMenuOpen(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && links.classList.contains('open')) {
            setMenuOpen(false);
            toggle.focus();
        }
    });

    // 导航栏滚动效果
    function updateNavBackground() {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    }

    window.addEventListener('scroll', updateNavBackground, { passive: true });
    updateNavBackground();
}

// ========== 初始化 ==========
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resizeCanvas();
        initParticles();
        // 动画模式下下一帧会重绘；静态模式需要手动重绘
        if (reducedMotion.matches) drawParticles(false);
    }, 200);
});

onMediaChange(reducedMotion, startParticles);
onMediaChange(colorScheme, () => {
    readThemeColors();
    if (reducedMotion.matches) drawParticles(false);
});

document.getElementById('year').textContent = new Date().getFullYear();

readThemeColors();
resizeCanvas();
initParticles();
startParticles();
handleScrollAnimations();
initNav();
