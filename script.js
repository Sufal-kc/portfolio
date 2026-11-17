// ==========================================
// 0. SHARED HELPERS
// ==========================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
}

// ==========================================
// 1. PAGE PRELOADER
// ==========================================
// Shown until the page has loaded, for at least MIN_LOADER_MS so it doesn't
// just flicker. A fail-safe hides it even if `load` never fires.
const MIN_LOADER_MS = 800;
const MAX_LOADER_MS = 6000;

function hidePreloader() {
    const loader = document.getElementById('preloader');
    if (!loader || loader.classList.contains('hidden')) return;
    loader.classList.add('hidden');
    loader.setAttribute('aria-hidden', 'true');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    setTimeout(() => loader.remove(), 800); // in case transitionend doesn't fire
}

window.addEventListener('load', () => {
    const elapsed = performance.now();
    setTimeout(hidePreloader, Math.max(0, MIN_LOADER_MS - elapsed));
});
setTimeout(hidePreloader, MAX_LOADER_MS);

// ==========================================
// 2. INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    typeEffect();
    setupInfiniteCarousel('projects-scroll');
    fetchMediumArticles(); // sets up its own carousel once articles render

    document.querySelectorAll('.scroll-btn[data-carousel]').forEach(btn => {
        btn.addEventListener('click', () => {
            scrollCarousel(btn.dataset.carousel, Number(btn.dataset.dir));
        });
    });
});

// ==========================================
// 3. INFINITE CAROUSEL ENGINE & ARROWS
// ==========================================
// Width of one full set of original cards (incl. gaps), set per carousel.
const carouselPeriods = new Map();

function setupInfiniteCarousel(containerId) {
    const container = document.getElementById(containerId);
    if (!container || container.children.length === 0) return;

    const originalCards = Array.from(container.children);

    // Clone the cards to create a seamless loop. Clones are hidden from
    // assistive tech and the tab order so content is not announced twice.
    // (Clicks on clones still work: all card handlers use event delegation.)
    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a, button, [tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
        container.appendChild(clone);
    });

    const getPeriod = () => container.children[originalCards.length].offsetLeft - originalCards[0].offsetLeft;
    carouselPeriods.set(containerId, getPeriod);

    container.addEventListener('scroll', () => {
        const period = getPeriod();
        if (period <= 0) return;

        // Strict ">" so a jump to exactly `period` (visually identical to 0)
        // doesn't immediately bounce back and ping-pong.
        if (container.scrollLeft > period) {
            jumpScroll(container, container.scrollLeft - period);
        } else if (container.scrollLeft <= 0) {
            jumpScroll(container, container.scrollLeft + period);
        }
    }, { passive: true });
}

// Move instantly (no smooth animation) so the loop reset is invisible.
function jumpScroll(container, left) {
    container.style.scrollBehavior = 'auto';
    container.scrollLeft = left;
    container.style.scrollBehavior = '';
}

function scrollCarousel(containerId, direction) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const firstCard = container.firstElementChild;
    const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
    const step = firstCard ? firstCard.getBoundingClientRect().width + gap : 320;

    // At the very start there is nothing to the left yet: jump to the
    // matching position in the cloned set first so "previous" works.
    const getPeriod = carouselPeriods.get(containerId);
    if (direction < 0 && getPeriod && container.scrollLeft <= 1) {
        jumpScroll(container, getPeriod());
    }

    container.scrollBy({ left: step * direction, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

// ==========================================
// 4. MOBILE NAVIGATION
// ==========================================
// (Smooth scrolling to sections is handled by CSS `scroll-behavior`.)
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// ==========================================
// 5. TYPEWRITER EFFECT
// ==========================================
const titles = ['Electronics Engineer', 'Vice President-SEIS', 'AI Enthusiast'];
let titleIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typingSpeed = 100;
const deletingSpeed = 50;
const pauseDelay = 1500;

function typeEffect() {
    const typedTextElement = document.getElementById('typed-text');
    if (!typedTextElement) return;

    // Respect reduced-motion: show the titles statically instead of animating.
    if (prefersReducedMotion) {
        typedTextElement.textContent = titles.join(' · ');
        return;
    }

    const currentTitle = titles[titleIndex];

    if (isDeleting) {
        typedTextElement.textContent = currentTitle.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typedTextElement.textContent = currentTitle.substring(0, charIndex + 1);
        charIndex++;
    }

    let currentSpeed = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentTitle.length) {
        currentSpeed = pauseDelay;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        titleIndex = (titleIndex + 1) % titles.length;
        currentSpeed = 300;
    }

    setTimeout(typeEffect, currentSpeed);
}

// ==========================================
// 6. THEME TOGGLE (SWITCH)
// ==========================================
// The initial theme is applied by an inline script in <head> to avoid a
// flash of the wrong theme; here we only sync the switch and handle changes.
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.checked = (theme === 'light'); // role="switch": checked = light on
}

if (themeToggle) {
    applyTheme(safeStorageGet('theme') || 'dark');

    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'light' : 'dark';
        applyTheme(newTheme);
        safeStorageSet('theme', newTheme);
    });
}

// ==========================================
// 7. MEDIUM ARTICLES FETCHER
// ==========================================
const MEDIUM_PROFILE = 'https://medium.com/@kcsufal1';
const MEDIUM_FALLBACK_IMAGE = './assets/img/medium/default_medium.webp';

// Shown if the RSS service is down or unreachable. Update when you publish.
const FALLBACK_ARTICLES = [
    {
        title: 'Network Mapper (Nmap)',
        link: 'https://medium.com/@kcsufal1/network-mapper-nmap-77e8e56d0813',
        date: '2026-10-28',
        tags: ['nmap', 'networking', 'network-scanning', 'penetration-testing'],
        excerpt: 'Simply, Nmap is a network exploration tool that can be used to scan the ports (TCP/UDP) that the hosts are listening on. Nmap allows network admins to find which devices are running on their network, discover open ports and services, and detect vulnerabilities…',
    },
    {
        title: 'Cryptographic Armor: How Hashing, Salting, and Ciphers Actually Shield Your Data',
        link: 'https://medium.com/@kcsufal1/cryptographic-armor-how-hashing-salting-and-ciphers-actually-shield-your-data-42b8accd5528',
        date: '2026-06-06',
        tags: ['cryptography', 'cs50', 'privacy', 'cybersecurity'],
        excerpt: 'When you transmit data across the internet or save a password on a website, it doesn’t travel through a magical, secure void. It moves through public infrastructure where anyone can theoretically listen in…',
    },
    {
        title: 'The Multi-Factor Illusion',
        link: 'https://medium.com/@kcsufal1/the-multi-factor-illusion-ff018ed70953',
        date: '2026-06-03',
        tags: [],
        excerpt: 'We’ve all been told that enabling Multi-Factor Authentication (MFA) or Two-Factor Authentication (2FA) makes our digital lives unhackable. As security engineering has evolved, attackers have shifted their approach…',
    },
    {
        title: 'Password? Small guide from me for smart password :(',
        link: 'https://medium.com/@kcsufal1/password-small-guide-from-me-for-smart-password-436f8a612883',
        date: '2026-06-01',
        tags: [],
        excerpt: 'We use passwords and credentials every single day, yet the mechanics of how we are protected and how attackers bypass that protection are often misunderstood…',
    },
];

function isSafeUrl(url) {
    try {
        const u = new URL(url, window.location.href);
        return u.protocol === 'https:' || u.protocol === 'http:';
    } catch (e) {
        return false;
    }
}

function htmlToText(html, maxLength = 320) {
    const text = new DOMParser().parseFromString(html || '', 'text/html').body.textContent
        .replace(/\s+/g, ' ')
        .trim();
    if (text.length <= maxLength) return text;
    return text.slice(0, text.lastIndexOf(' ', maxLength)) + '…';
}

function formatDate(value) {
    const date = new Date(String(value).replace(' ', 'T'));
    return isNaN(date) ? '' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Builds a card with DOM APIs (no innerHTML) so feed content can't inject markup.
// Popup details are stored as data-* attributes so carousel clones carry them too.
function buildArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.dataset.link = isSafeUrl(article.link) ? article.link : MEDIUM_PROFILE;
    card.dataset.excerpt = article.excerpt || '';
    card.dataset.date = article.date ? formatDate(article.date) : '';
    card.dataset.tags = JSON.stringify(article.tags || []);

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'image-wrapper';

    const img = document.createElement('img');
    img.src = isSafeUrl(article.image) ? article.image : MEDIUM_FALLBACK_IMAGE;
    img.alt = '';
    img.loading = 'lazy';
    img.width = 300;
    img.height = 160;
    // (Load errors are handled by a delegated listener below so carousel clones are covered too.)

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'Medium';

    imageWrapper.append(img, badge);

    const content = document.createElement('div');
    content.className = 'article-content';

    const title = document.createElement('h4');
    const opener = document.createElement('button');
    opener.type = 'button';
    opener.className = 'card-open';
    opener.setAttribute('aria-haspopup', 'dialog');
    opener.textContent = article.title;
    title.append(opener);

    const readMore = document.createElement('span');
    readMore.className = 'read-more';
    readMore.textContent = card.dataset.date ? `${card.dataset.date} · View details →` : 'View details →';

    content.append(title, readMore);
    card.append(imageWrapper, content);
    return card;
}

// Delegated (capture-phase) image error handler: cloneNode() doesn't copy
// event listeners, so per-image handlers would miss the carousel clones.
document.addEventListener('error', (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.closest('.article-card') && !img.src.endsWith(MEDIUM_FALLBACK_IMAGE.slice(1))) {
        img.src = MEDIUM_FALLBACK_IMAGE;
    }
}, true);

function renderArticles(container, articles, note) {
    container.replaceChildren(...articles.map(buildArticleCard));
    container.setAttribute('aria-busy', 'false');
    setupInfiniteCarousel(container.id);

    const section = container.closest('section');
    section?.querySelector('.section-note')?.remove();
    if (note && section) {
        const p = document.createElement('p');
        p.className = 'section-note';
        p.setAttribute('role', 'status');
        p.textContent = note;
        section.querySelector('h2').after(p);
    }
}

async function fetchWithTimeout(url, ms = 8000, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function fetchMediumArticles() {
    const rssFeedUrl = `https://medium.com/feed/@kcsufal1`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;
    const container = document.getElementById('articles-scroll');

    if (!container) return;

    try {
        const response = await fetchWithTimeout(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
            throw new Error('Feed returned no articles');
        }

        const articles = data.items.map(item => {
            let image = item.thumbnail;
            if (!image && item.content) {
                const htmlDoc = new DOMParser().parseFromString(item.content, 'text/html');
                // Skip Medium's 1x1 tracking pixel (medium.com/_/stat?...), which browsers block.
                const realImg = [...htmlDoc.querySelectorAll('img')]
                    .find(el => !(el.getAttribute('src') || '').includes('/_/stat'));
                image = realImg?.getAttribute('src') || '';
            }
            return {
                title: item.title,
                link: item.link,
                image,
                date: item.pubDate,
                tags: (item.categories || []).slice(0, 4),
                excerpt: htmlToText(item.description || item.content),
            };
        });

        renderArticles(container, articles);
    } catch (error) {
        console.warn('Could not reach the Medium feed, showing saved articles instead:', error);
        renderArticles(container, FALLBACK_ARTICLES,
            navigator.onLine === false
                ? 'You appear to be offline: showing saved articles.'
                : 'Couldn’t reach Medium right now: showing saved articles.');
    }
}

// ==========================================
// 8. CONTACT FORM SUBMISSION (Web3Forms)
// ==========================================
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('btn-submit');

function setFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.remove('success', 'error');
    if (type) formStatus.classList.add(type);
}

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!navigator.onLine) {
            setFormStatus('You’re offline. Please reconnect and try again.', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.textContent = 'Sending...';
        }
        setFormStatus('', null);

        try {
            const response = await fetchWithTimeout('https://api.web3forms.com/submit', 15000, {
                method: 'POST',
                body: new FormData(contactForm),
            });
            if (response.status >= 500) throw new Error(`Server error ${response.status}`);
            const data = await response.json();

            if (data.success) {
                setFormStatus('Message sent successfully!', 'success');
                contactForm.reset();
            } else {
                setFormStatus('Failed to send message. Please try again.', 'error');
            }
        } catch (error) {
            setFormStatus(
                error.name === 'AbortError'
                    ? 'The server took too long to respond. Please try again.'
                    : 'Couldn’t reach the mail server. Please try again later.',
                'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = 'Submit';
            }
        }
    });
}

// ==========================================
// 9. DETAIL POPUP (Projects, Articles, Honors)
// ==========================================
const modal = document.getElementById('detail-modal');
const modalImg = document.getElementById('modal-img');
const modalMeta = document.getElementById('modal-meta');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalTags = document.getElementById('modal-tags');
const modalAction = document.getElementById('modal-action');
const modalClose = modal?.querySelector('.modal-close');
let lastFocusedElement = null;

function openDetail({ image, imageAlt = '', variant = '', meta = '', title = '', description = '', tags = [], actionHref = '', actionText = '' }, trigger) {
    if (!modal) return;

    // Card clones inside carousels are aria-hidden; return focus to the matching original instead.
    lastFocusedElement = trigger?.closest('[aria-hidden="true"]') ? null : trigger;

    modal.querySelector('.modal-content').dataset.variant = variant;
    modalImg.src = image || '';
    modalImg.alt = imageAlt;
    modalImg.hidden = !image;
    modalMeta.textContent = meta;
    modalMeta.hidden = !meta;
    modalTitle.textContent = title;
    modalDesc.textContent = description;

    modalTags.replaceChildren(...tags.map(tag => {
        const li = document.createElement('li');
        li.textContent = tag;
        return li;
    }));
    modalTags.hidden = tags.length === 0;

    if (actionHref && isSafeUrl(actionHref)) {
        modalAction.href = actionHref;
        modalAction.textContent = actionText;
        modalAction.hidden = false;
    } else {
        modalAction.hidden = true;
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalClose?.focus();
}

function closeModal() {
    if (!modal || !modal.classList.contains('active')) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastFocusedElement?.focus();
}

function openProject(card, trigger) {
    const link = card.querySelector('.project-info a');
    openDetail({
        variant: 'project',
        image: card.querySelector('img')?.src,
        imageAlt: card.querySelector('img')?.alt,
        meta: 'Project',
        title: card.querySelector('h4')?.textContent.trim(),
        description: card.querySelector('.project-info p')?.textContent.trim().replace(/\s+/g, ' '),
        tags: [...card.querySelectorAll('.tech-tags li')].map(li => li.textContent),
        actionHref: link?.href,
        actionText: 'View on GitHub →',
    }, trigger);
}

function openArticle(card, trigger) {
    let tags = [];
    try { tags = JSON.parse(card.dataset.tags || '[]'); } catch (e) { /* ignore */ }
    openDetail({
        variant: 'article',
        image: card.querySelector('img')?.src,
        meta: ['Medium article', card.dataset.date].filter(Boolean).join(' · '),
        title: card.querySelector('h4')?.textContent.trim(),
        description: card.dataset.excerpt || 'Read the full article on Medium.',
        tags,
        actionHref: card.dataset.link,
        actionText: 'Read on Medium →',
    }, trigger);
}

function openHonor(card) {
    const img = card.querySelector('img');
    openDetail({
        variant: 'honor',
        image: img?.src,
        imageAlt: img?.alt,
        meta: card.querySelector('p')?.textContent.trim(),
        title: card.querySelector('h4')?.textContent.trim(),
        description: card.dataset.description || '',
    }, card);
}

// Event delegation so cloned carousel cards (which lose listeners) still work.
document.addEventListener('click', (e) => {
    const opener = e.target.closest('.card-open');
    if (opener) {
        const project = opener.closest('.project-card');
        const article = opener.closest('.article-card');
        if (project) openProject(project, opener);
        else if (article) openArticle(article, opener);
        return;
    }

    const honor = e.target.closest('.honor-card');
    if (honor) openHonor(honor);
});

document.addEventListener('keydown', (e) => {
    const honor = e.target.closest?.('.honor-card');
    if (honor && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        openHonor(honor);
    }
});

if (modalClose) modalClose.addEventListener('click', closeModal);

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (!modal?.classList.contains('active')) return;

    if (e.key === 'Escape') {
        closeModal();
    } else if (e.key === 'Tab') {
        // Keep focus cycling inside the dialog.
        const focusables = [...modal.querySelectorAll('button, a[href]')].filter(el => !el.hidden);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        } else if (!modal.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
        }
    }
});

// ==========================================
// 10. CONNECTION STATUS & OFFLINE SUPPORT
// ==========================================
const netToast = document.getElementById('net-toast');
let toastTimer = null;

function showNetToast(message, state) {
    if (!netToast) return;
    clearTimeout(toastTimer);
    netToast.textContent = message;
    netToast.dataset.state = state;
    netToast.classList.add('visible');
    if (state === 'online') {
        toastTimer = setTimeout(() => netToast.classList.remove('visible'), 3000);
    }
}

window.addEventListener('offline', () => {
    showNetToast('You’re offline. Some content may not load until you reconnect.', 'offline');
});

window.addEventListener('online', () => {
    showNetToast('Back online!', 'online');
});

// Service worker: shows offline.html when the site can't be reached
// (no connection, or the server returns a 5xx error).
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.warn('Service worker registration failed:', err);
        });
    });
}
