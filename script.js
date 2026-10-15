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

function animateNumber(num) {
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
}

// ========== 滚动显现动画 ==========
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);

        // 卡片出现时启动其中的数字动画
        entry.target.querySelectorAll('.stat-value[data-target]').forEach(animateNumber);
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
}) : null;

// 对新出现的内容（首页或载入的子页面）启用渐显
function observeReveals(root) {
    root.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        if (revealObserver) {
            revealObserver.observe(el);
        } else {
            // 不支持 IntersectionObserver 时直接显示全部内容
            el.classList.add('visible');
        }
    });
}

// ========== 页面嵌套路由 ==========
// 子页面是 pages/ 下可独立访问的完整 HTML；在首页外壳中通过 #/名称 载入其 .page 内容
const homeView = document.getElementById('home-view');
const pageView = document.getElementById('page-view');
const shellBase = new URL('.', location.href);
const homeTitle = document.title;
const pageCache = new Map();
// 兼容旧版单页的锚点链接
const LEGACY_ANCHORS = { stats: 'stats', timeline: 'timeline', technology: 'technology', challenges: 'challenges', future: 'future' };
let routeToken = 0;

function pageUrl(name) {
    return new URL(`pages/${name}.html`, shellBase);
}

// 把指向首页或子页面的链接改写为 #/路由，其余链接保持不变
function toRouteHref(href, baseUrl) {
    let url;
    try {
        url = new URL(href, baseUrl);
    } catch (e) {
        return null;
    }
    if (url.origin !== shellBase.origin) return null;

    const base = shellBase.pathname;
    if (url.pathname === base || url.pathname === base + 'index.html') {
        return url.hash && !url.hash.startsWith('#/') ? url.hash : '#/';
    }
    if (!url.pathname.startsWith(base)) return null;
    const match = url.pathname.slice(base.length).match(/^pages\/([\w-]+)\.html$/);
    return match ? `#/${match[1]}` : null;
}

function rewriteLinks(root, baseUrl) {
    root.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (href.startsWith('#')) return;
        const routeHref = toRouteHref(href, baseUrl);
        if (routeHref) a.setAttribute('href', routeHref);
    });
}

function currentRoute() {
    const hash = location.hash;
    if (hash.startsWith('#/')) return decodeURIComponent(hash.slice(2)).replace(/\/$/, '');
    return '';
}

async function fetchPage(name) {
    if (pageCache.has(name)) return pageCache.get(name);

    const url = pageUrl(name);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const article = doc.querySelector('.page');
    if (!article) throw new Error('页面缺少 .page 内容');

    rewriteLinks(article, url);
    const page = { title: doc.title, node: article };
    pageCache.set(name, page);
    return page;
}

function setActiveNav(name) {
    document.querySelectorAll('#nav-links a').forEach(a => {
        if (a.getAttribute('href') === `#/${name}`) {
            a.setAttribute('aria-current', 'page');
        } else {
            a.removeAttribute('aria-current');
        }
    });
}

function showMessage(title, text) {
    const box = document.createElement('div');
    box.className = 'container page-message';
    const h1 = document.createElement('h1');
    h1.textContent = title;
    const p = document.createElement('p');
    p.textContent = text;
    const a = document.createElement('a');
    a.className = 'btn btn-ghost';
    a.href = '#/';
    a.textContent = '← 返回首页';
    box.append(h1, p, a);
    pageView.replaceChildren(box);
    return h1;
}

async function renderRoute(isInitial) {
    // 旧版锚点 #stats 等跳转到对应子页面
    const legacy = LEGACY_ANCHORS[location.hash.slice(1)];
    if (legacy) history.replaceState(null, '', `#/${legacy}`);

    const name = currentRoute();
    const token = ++routeToken;

    // 首页：显示首页视图；普通锚点（如 #topics）滚动到对应位置
    if (!name) {
        pageView.hidden = true;
        homeView.hidden = false;
        document.title = homeTitle;
        setActiveNav('');
        const anchor = location.hash.length > 1 && !location.hash.startsWith('#/')
            ? document.getElementById(location.hash.slice(1))
            : null;
        if (anchor) {
            anchor.scrollIntoView();
        } else if (!isInitial) {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
        return;
    }

    homeView.hidden = true;
    pageView.hidden = false;
    pageView.setAttribute('aria-busy', 'true');
    pageView.innerHTML = '<div class="container page-message"><p class="page-loading">正在载入…</p></div>';
    setActiveNav(name);
    window.scrollTo({ top: 0, behavior: 'instant' });

    let heading;
    try {
        if (!/^[\w-]+$/.test(name)) throw new Error('无效路由');
        const page = await fetchPage(name);
        if (token !== routeToken) return;

        pageView.replaceChildren(document.importNode(page.node, true));
        document.title = page.title;
        observeReveals(pageView);
        heading = pageView.querySelector('h1');
    } catch (err) {
        if (token !== routeToken) return;
        // 直接双击打开本地文件时浏览器禁止 fetch，退回到独立子页面
        if (location.protocol === 'file:' && /^[\w-]+$/.test(name)) {
            location.href = pageUrl(name).href;
            return;
        }
        document.title = `页面未找到 · ${homeTitle}`;
        heading = showMessage('页面未找到', '该页面不存在或暂时无法载入，请返回首页或稍后重试。');
    }

    pageView.removeAttribute('aria-busy');
    // 路由切换后把焦点移到标题，方便键盘与读屏用户
    if (heading && !isInitial) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
    }
}

function initRouter() {
    rewriteLinks(document, location.href);
    window.addEventListener('hashchange', () => renderRoute(false));
    renderRoute(true);
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
observeReveals(homeView);
initNav();
initRouter();
