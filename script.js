// ==========================================
// 1. INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Dynamic Year Update
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Start Typewriter Effect
    typeEffect();

    // Setup Infinite Carousel for Projects
    setupInfiniteCarousel('projects-scroll');

    // Fetch Medium Articles (triggers infinite carousel after rendering)
    fetchMediumArticles();
});

// ==========================================
// 2. INFINITE CAROUSEL ENGINE & ARROWS
// ==========================================
function setupInfiniteCarousel(containerId) {
    const container = document.getElementById(containerId);
    if (!container || container.children.length === 0) return;

    // Clone original items to create a seamless infinite loop
    const originalCards = Array.from(container.children);
    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        container.appendChild(clone);
    });

    let isJumping = false;
    container.addEventListener('scroll', () => {
        if (isJumping) return;

        const halfWidth = container.scrollWidth / 2;

        // Reset scroll position instantly when reaching half-way boundary
        if (container.scrollLeft >= halfWidth) {
            isJumping = true;
            container.style.scrollBehavior = 'auto';
            container.scrollLeft -= halfWidth;
            container.style.scrollBehavior = 'smooth';
            isJumping = false;
        } else if (container.scrollLeft <= 0) {
            isJumping = true;
            container.style.scrollBehavior = 'auto';
            container.scrollLeft += halfWidth;
            container.style.scrollBehavior = 'smooth';
            isJumping = false;
        }
    });
}

function scrollProjects(distance) {
    const container = document.getElementById('projects-scroll');
    if (container) {
        container.scrollBy({ left: distance, behavior: 'smooth' });
    }
}

function scrollArticles(distance) {
    const container = document.getElementById('articles-scroll');
    if (container) {
        container.scrollBy({ left: distance, behavior: 'smooth' });
    }
}

// ==========================================
// 3. NAVIGATION & SMOOTH SCROLLING
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

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
const titles = ["Electronics Engineer", "Vice President-SEIS", "AI Enthusiast"];
let titleIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typingSpeed = 100;
const deletingSpeed = 50;
const pauseDelay = 1500;

function typeEffect() {
    const typedTextElement = document.getElementById("typed-text");
    if (!typedTextElement) return;

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
// 5. THEME TOGGLE
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');

if (themeToggleBtn) {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateButtonText(currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        theme = (theme === 'dark') ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateButtonText(theme);
    });

    function updateButtonText(theme) {
        themeToggleBtn.textContent = (theme === 'dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}

// ==========================================
// 6. MEDIUM ARTICLES FETCHER
// ==========================================
async function fetchMediumArticles() {
    const mediumUsername = 'kcsufal1';
    const rssFeedUrl = `https://medium.com/feed/@${mediumUsername}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;
    const fallbackImage = "./assets/img/medium/default_medium.png";
    const container = document.getElementById('articles-scroll');

    if (!container) return;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            container.innerHTML = '';

            data.items.forEach(article => {
                let imgUrl = article.thumbnail;
                
                if (!imgUrl) {
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(article.content, 'text/html');
                    const imgElement = htmlDoc.querySelector('img');
                    imgUrl = imgElement ? imgElement.src : fallbackImage;
                }

                const card = document.createElement('div');
                card.className = 'article-card';
                card.innerHTML = `
                    <a href="${article.link}" target="_blank" rel="noopener" class="article-link">
                        <div class="image-wrapper">
                            <img src="${imgUrl}" 
                                 alt="Article cover" 
                                 onerror="this.onerror=null; this.src='${fallbackImage}';">
                            <span class="badge">Medium</span>
                        </div>
                        <div class="article-content">
                            <h4>${article.title}</h4>
                            <span class="read-more">Read Article &rarr;</span>
                        </div>
                    </a>
                `;

                container.appendChild(card);
            });

            // Activate infinite carousel after dynamic articles load
            setupInfiniteCarousel('articles-scroll');
        } else {
            container.innerHTML = '<p style="color: var(--text-muted);">No articles found.</p>';
        }
    } catch (error) {
        console.error('Error fetching Medium articles:', error);
        container.innerHTML = '<p style="color: var(--text-muted);">Failed to load articles.</p>';
    }
}

// ==========================================
// 7. CONTACT FORM SUBMISSION
// ==========================================
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('btn-submit');

if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }
        if (formStatus) formStatus.textContent = '';

        const formData = new FormData(contactForm);

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                if (formStatus) {
                    formStatus.style.color = '#4CAF50';
                    formStatus.textContent = 'Message sent successfully!';
                }
                contactForm.reset();
            } else {
                if (formStatus) {
                    formStatus.style.color = '#f44336';
                    formStatus.textContent = 'Failed to send message. Please try again.';
                }
            }
        } catch (error) {
            if (formStatus) {
                formStatus.style.color = '#f44336';
                formStatus.textContent = 'Network error. Please try again later.';
            }
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

document.querySelectorAll('.honor-card').forEach(card => {
    card.addEventListener('click', () => {
        const img = card.querySelector('img');
        const title = card.querySelector('h4')?.textContent || '';

        if (img && modal && modalImg && modalCaption) {
            modalImg.src = img.src;
            modalImg.alt = img.alt || title;
            modalCaption.textContent = title;
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        }
    });
});

function closeModal() {
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

if (modalClose) modalClose.addEventListener('click', closeModal);

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
        closeModal();
    }
});
// // Smooth Scrolling for navigation links
// document.querySelectorAll('a[href^="#"]').forEach(anchor => {
//     anchor.addEventListener('click', function (e) {
//         e.preventDefault();
//         document.querySelector(this.getAttribute('href')).scrollIntoView({
//             behavior: 'smooth'
//         });
//     });
// });


// //For dyanamically updating the year in the footer
// document.getElementById('year').textContent = new Date().getFullYear();

// const menuToggle = document.querySelector('.menu-toggle');
// const navMenu = document.querySelector('.nav-menu');

// if (menuToggle && navMenu) {
//     menuToggle.addEventListener('click', () => {
//         const isOpen = navMenu.classList.toggle('open');
//         menuToggle.setAttribute('aria-expanded', String(isOpen));
//     });

//     navMenu.querySelectorAll('a').forEach(link => {
//         link.addEventListener('click', () => {
//             navMenu.classList.remove('open');
//             menuToggle.setAttribute('aria-expanded', 'false');
//         });
//     });
// }

// // Typewriter effect for the Top section
// const titles = ["Electronics Engineer", "Vice President-SEIS", "AI Enthusiast"];
// let titleIndex = 0;
// let charIndex = 0;
// let isDeleting = false;

// const typedTextElement = document.getElementById("typed-text");
// const typingSpeed = 100;    // Delay per character when typing
// const deletingSpeed = 50;   // Delay per character when erasing
// const pauseDelay = 1500;    // Delay when a full title is typed out

// function typeEffect() {
//     const currentTitle = titles[titleIndex];

//     if (isDeleting) {
//         typedTextElement.textContent = currentTitle.substring(0, charIndex - 1);
//         charIndex--;
//     } else {
//         typedTextElement.textContent = currentTitle.substring(0, charIndex + 1);
//         charIndex++;
//     }

//     let currentSpeed = isDeleting ? deletingSpeed : typingSpeed;

//     if (!isDeleting && charIndex === currentTitle.length) {
//         currentSpeed = pauseDelay; // Pause at full word
//         isDeleting = true;
//     } else if (isDeleting && charIndex === 0) {
//         isDeleting = false;
//         titleIndex = (titleIndex + 1) % titles.length; // Move to next title
//         currentSpeed = 300; // Brief pause before typing next word
//     }

//     setTimeout(typeEffect, currentSpeed);
// }

// document.addEventListener("DOMContentLoaded", typeEffect);


// //For project left and right moement
// function scrollProjects(distance) {
//     const container = document.getElementById('projects-scroll');
//     if (container) {
//         container.scrollBy({
//             left: distance,
//             behavior: 'smooth'
//         });
//     }
// }

// //for theme toggle
// const themeToggleBtn = document.getElementById('theme-toggle');

// if (themeToggleBtn) {
//     // Check saved theme from localStorage, default to dark
//     const currentTheme = localStorage.getItem('theme') || 'dark';
//     document.documentElement.setAttribute('data-theme', currentTheme);
//     updateButtonText(currentTheme);

//     themeToggleBtn.addEventListener('click', () => {
//         let theme = document.documentElement.getAttribute('data-theme');
        
//         // Toggle theme
//         if (theme === 'dark') {
//             theme = 'light';
//         } else {
//             theme = 'dark';
//         }
        
//         // Apply theme and save preference
//         document.documentElement.setAttribute('data-theme', theme);
//         localStorage.setItem('theme', theme);
//         updateButtonText(theme);
//     });

//     function updateButtonText(theme) {
//         if (theme === 'dark') {
//             themeToggleBtn.textContent = '☀️ Light Mode';
//         } else {
//             themeToggleBtn.textContent = '🌙 Dark Mode';
//         }
//     }
// }

// //SMmoth scrolling for article
// function scrollArticles(distance) {
//     const container = document.getElementById('articles-scroll');
//     if (container) {
//         container.scrollBy({
//             left: distance,
//             behavior: 'smooth'
//         });
//     }
// }

// // // Function to fetch Medium RSS feed and build cards dynamically
// // async function fetchMediumArticles() {
// //     const mediumUsername = 'kcsufal1';
// //     const rssFeedUrl = `https://medium.com/feed/@${mediumUsername}`;
// //     const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;

// //     const container = document.getElementById('articles-scroll');

// //     try {
// //         const response = await fetch(apiUrl);
// //         const data = await response.json();

// //         if (data.status === 'ok' && data.items.length > 0) {
// //             container.innerHTML = ''; // Clear loading text

// //             data.items.forEach(article => {
// //                 // Extract image thumbnail from article HTML content
// //                 let imgUrl = article.thumbnail;
                
// //                 if (!imgUrl) {
// //                     const parser = new DOMParser();
// //                     const htmlDoc = parser.parseFromString(article.content, 'text/html');
// //                     const imgElement = htmlDoc.querySelector('img');
// //                     imgUrl = imgElement ? imgElement.src : 'https://via.placeholder.com/320x180?text=Medium+Article';
// //                 }

// //                 // Create Card HTML
// //                 const card = document.createElement('div');
// //                 card.className = 'article-card';

// //                 card.innerHTML = `
// //                     <a href="${article.link}" target="_blank" class="article-link">
// //                         <div class="image-wrapper">
// //                             <img src="${imgUrl}" alt="${article.title}">
// //                             <span class="badge">Medium</span>
// //                         </div>
// //                         <div class="article-content">
// //                             <h4>${article.title}</h4>
// //                             <span class="read-more">Read Article &rarr;</span>
// //                         </div>
// //                     </a>
// //                 `;

// //                 container.appendChild(card);
// //             });
// //         } else {
// //             container.innerHTML = '<p style="color: var(--text-muted);">No articles found.</p>';
// //         }
// //     } catch (error) {
// //         console.error('Error fetching Medium articles:', error);
// //         container.innerHTML = '<p style="color: var(--text-muted);">Failed to load articles.</p>';
// //     }
// // }

// // Function to fetch Medium RSS feed and build cards dynamically
// async function fetchMediumArticles() {
//     const mediumUsername = 'kcsufal1';
//     const rssFeedUrl = `https://medium.com/feed/@${mediumUsername}`;
//     const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;
    
//     // High-quality fallback image for articles without media
//     // const fallbackImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop';
//     const fallbackImage = "./assets/img/medium/default_medium.png"

//     const container = document.getElementById('articles-scroll');

//     try {
//         const response = await fetch(apiUrl);
//         const data = await response.json();

//         if (data.status === 'ok' && data.items.length > 0) {
//             container.innerHTML = ''; // Clear loading text

//             data.items.forEach(article => {
//                 // Extract image thumbnail from payload or article HTML content
//                 let imgUrl = article.thumbnail;
                
//                 if (!imgUrl) {
//                     const parser = new DOMParser();
//                     const htmlDoc = parser.parseFromString(article.content, 'text/html');
//                     const imgElement = htmlDoc.querySelector('img');
//                     imgUrl = imgElement ? imgElement.src : fallbackImage;
//                 }

//                 // Create Card HTML
//                 const card = document.createElement('div');
//                 card.className = 'article-card';

//                 card.innerHTML = `
//                     <a href="${article.link}" target="_blank" rel="noopener" class="article-link">
//                         <div class="image-wrapper">
//                             <img src="${imgUrl}" 
//                                  alt="Article cover" 
//                                  onerror="this.onerror=null; this.src='${fallbackImage}';">
//                             <span class="badge">Medium</span>
//                         </div>
//                         <div class="article-content">
//                             <h4>${article.title}</h4>
//                             <span class="read-more">Read Article &rarr;</span>
//                         </div>
//                     </a>
//                 `;

//                 container.appendChild(card);
//             });
//         } else {
//             container.innerHTML = '<p style="color: var(--text-muted);">No articles found.</p>';
//         }
//     } catch (error) {
//         console.error('Error fetching Medium articles:', error);
//         container.innerHTML = '<p style="color: var(--text-muted);">Failed to load articles.</p>';
//     }
// }

// // Load articles on DOM Ready
// document.addEventListener('DOMContentLoaded', fetchMediumArticles);

// //for sending message to me using web3form
// const contactForm = document.getElementById('contact-form');
// const formStatus = document.getElementById('form-status');
// const submitBtn = document.getElementById('btn-submit');

// contactForm.addEventListener('submit', async function (e) {
//     e.preventDefault();

//     submitBtn.disabled = true;
//     submitBtn.textContent = 'Sending...';
//     formStatus.textContent = '';

//     const formData = new FormData(contactForm);

//     try {
//         const response = await fetch('https://api.web3forms.com/submit', {
//             method: 'POST',
//             body: formData
//         });

//         const data = await response.json();

//         if (data.success) {
//             formStatus.style.color = '#4CAF50';
//             formStatus.textContent = 'Message sent successfully!';
//             contactForm.reset();
//         } else {
//             formStatus.style.color = '#f44336';
//             formStatus.textContent = 'Failed to send message. Please try again.';
//         }
//     } catch (error) {
//         formStatus.style.color = '#f44336';
//         formStatus.textContent = 'Network error. Please try again later.';
//     } finally {
//         submitBtn.disabled = false;
//         submitBtn.textContent = 'Submit';
//     }
// });
// // Honor Cards Image Popup Logic
// const modal = document.getElementById('image-modal');
// const modalImg = document.getElementById('modal-img');
// const modalCaption = document.getElementById('modal-caption');
// const modalClose = document.querySelector('.modal-close');

// document.querySelectorAll('.honor-card').forEach(card => {
//     card.addEventListener('click', () => {
//         const img = card.querySelector('img');
//         const title = card.querySelector('h4')?.textContent || '';

//         if (img) {
//             modalImg.src = img.src;
//             modalImg.alt = img.alt || title;
//             modalCaption.textContent = title;
//             modal.classList.add('active');
//             modal.setAttribute('aria-hidden', 'false');
//         }
//     });
// });

// function closeModal() {
//     if (modal) {
//         modal.classList.remove('active');
//         modal.setAttribute('aria-hidden', 'true');
//     }
// }

// if (modalClose) modalClose.addEventListener('click', closeModal);

// // Close modal when clicking on the dark backdrop
// if (modal) {
//     modal.addEventListener('click', (e) => {
//         if (e.target === modal) closeModal();
//     });
// }

// // Close modal when pressing Esc
// document.addEventListener('keydown', (e) => {
//     if (e.key === 'Escape' && modal?.classList.contains('active')) {
//         closeModal();
//     }
// });