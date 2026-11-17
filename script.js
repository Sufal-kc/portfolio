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
// 1. INITIALIZATION ON DOM READY
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
// 2. INFINITE CAROUSEL ENGINE & ARROWS
// ==========================================
// Width of one full set of original cards (incl. gaps), set per carousel.
const carouselPeriods = new Map();

function setupInfiniteCarousel(containerId) {
    const container = document.getElementById(containerId);
    if (!container || container.children.length === 0) return;

    const originalCards = Array.from(container.children);

    // Clone the cards to create a seamless loop. Clones are hidden from
    // assistive tech and the tab order so content is not announced twice.
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
// 3. MOBILE NAVIGATION
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
// 4. TYPEWRITER EFFECT
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
// 5. THEME TOGGLE (SWITCH)
// ==========================================
// The initial theme is applied by an inline script in <head> to avoid a
// flash of the wrong theme; here we only sync the switch and handle changes.
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) {
        themeToggle.checked = (theme === 'light');
        themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
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
// 6. MEDIUM ARTICLES FETCHER
// ==========================================
const MEDIUM_FALLBACK_IMAGE = './assets/img/medium/default_medium.webp';

// Shown if the RSS service is down or rate-limited. Update when you publish.
const FALLBACK_ARTICLES = [
    { title: 'Network Mapper (Nmap)', link: 'https://medium.com/@kcsufal1/network-mapper-nmap-77e8e56d0813' },
    { title: 'Cryptographic Armor: How Hashing, Salting, and Ciphers Actually Shield Your Data', link: 'https://medium.com/@kcsufal1/cryptographic-armor-how-hashing-salting-and-ciphers-actually-shield-your-data-42b8accd5528' },
    { title: 'The Multi-Factor Illusion', link: 'https://medium.com/@kcsufal1/the-multi-factor-illusion-ff018ed70953' },
    { title: 'Model Distillation?', link: 'https://medium.com/@kcsufal1/model-distillation-b64699d40b70' },
];

function isSafeUrl(url) {
    try {
        const u = new URL(url, window.location.href);
        return u.protocol === 'https:' || u.protocol === 'http:';
    } catch (e) {
        return false;
    }
}

// Builds a card with DOM APIs (no innerHTML) so feed content can't inject markup.
function buildArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';

    const link = document.createElement('a');
    link.className = 'article-link';
    link.href = isSafeUrl(article.link) ? article.link : 'https://medium.com/@kcsufal1';
    link.target = '_blank';
    link.rel = 'noopener';

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
    title.textContent = article.title;

    const readMore = document.createElement('span');
    readMore.className = 'read-more';
    readMore.textContent = 'Read Article →';

    content.append(title, readMore);
    link.append(imageWrapper, content);
    card.append(link);
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

function renderArticles(container, articles) {
    container.replaceChildren(...articles.map(buildArticleCard));
    setupInfiniteCarousel(container.id);
}

async function fetchMediumArticles() {
    const mediumUsername = 'kcsufal1';
    const rssFeedUrl = `https://medium.com/feed/@${mediumUsername}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;
    const container = document.getElementById('articles-scroll');

    if (!container) return;

    try {
        const response = await fetch(apiUrl);
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
            return { title: item.title, link: item.link, image };
        });

        renderArticles(container, articles);
    } catch (error) {
        console.error('Error fetching Medium articles, using fallback list:', error);
        renderArticles(container, FALLBACK_ARTICLES);
    }
}

// ==========================================
// 7. CONTACT FORM SUBMISSION (Web3Forms)
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

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }
        setFormStatus('', null);

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: new FormData(contactForm),
            });
            const data = await response.json();

            if (data.success) {
                setFormStatus('Message sent successfully!', 'success');
                contactForm.reset();
            } else {
                setFormStatus('Failed to send message. Please try again.', 'error');
            }
        } catch (error) {
            setFormStatus('Network error. Please try again later.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            }
        }
    });
}

// ==========================================
// 8. HONOR CARDS MODAL POPUP
// ==========================================
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalCaption = document.getElementById('modal-caption');
const modalClose = document.querySelector('.modal-close');
let lastFocusedElement = null;

function openModal(card) {
    const img = card.querySelector('img');
    const title = card.querySelector('h4')?.textContent || '';
    if (!img || !modal || !modalImg || !modalCaption) return;

    lastFocusedElement = card;
    modalImg.src = img.src;
    modalImg.alt = img.alt || title;
    modalCaption.textContent = title;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    modalClose?.focus();
}

function closeModal() {
    if (!modal || !modal.classList.contains('active')) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    lastFocusedElement?.focus();
}

document.querySelectorAll('.honor-card').forEach(card => {
    card.addEventListener('click', () => openModal(card));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(card);
        }
    });
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
        // The close button is the only focusable element: keep focus inside the dialog.
        e.preventDefault();
        modalClose?.focus();
    }
});
