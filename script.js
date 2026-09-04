// Smooth Scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Function to handle horizontal scrolling for custom carousels
function scrollContainer(containerId, scrollOffset) {
    const container = document.getElementById(containerId);
    if(container) {
        container.scrollBy({
            left: scrollOffset,
            behavior: 'smooth'
        });
    }
}

//For dyanamically updating the year in the footer
document.getElementById('year').textContent = new Date().getFullYear();

// Typewriter effect for the Top section
const titles = ["Electronics Engineer", "Vice President-SEIS", "AI Enthusiast"];
let titleIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typedTextElement = document.getElementById("typed-text");
const typingSpeed = 100;    // Delay per character when typing
const deletingSpeed = 50;   // Delay per character when erasing
const pauseDelay = 1500;    // Delay when a full title is typed out

function typeEffect() {
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
        currentSpeed = pauseDelay; // Pause at full word
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        titleIndex = (titleIndex + 1) % titles.length; // Move to next title
        currentSpeed = 300; // Brief pause before typing next word
    }

    setTimeout(typeEffect, currentSpeed);
}

document.addEventListener("DOMContentLoaded", typeEffect);


//For project left and right moement
function scrollProjects(distance) {
    const container = document.getElementById('projects-scroll');
    if (container) {
        container.scrollBy({
            left: distance,
            behavior: 'smooth'
        });
    }
}

//for theme toggle
const themeToggleBtn = document.getElementById('theme-toggle');

// Check saved theme from localStorage, default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
updateButtonText(currentTheme);

themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    
    // Toggle theme
    if (theme === 'dark') {
        theme = 'light';
    } else {
        theme = 'dark';
    }
    
    // Apply theme and save preference
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateButtonText(theme);
});

function updateButtonText(theme) {
    if (theme === 'dark') {
        themeToggleBtn.textContent = '☀️ Light Mode';
    } else {
        themeToggleBtn.textContent = '🌙 Dark Mode';
    }
}

//SMmoth scrolling for article
function scrollArticles(distance) {
    const container = document.getElementById('articles-scroll');
    if (container) {
        container.scrollBy({
            left: distance,
            behavior: 'smooth'
        });
    }
}

// Function to fetch Medium RSS feed and build cards dynamically
async function fetchMediumArticles() {
    const mediumUsername = 'kcsufal1';
    const rssFeedUrl = `https://medium.com/feed/@${mediumUsername}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;

    const container = document.getElementById('articles-scroll');

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            container.innerHTML = ''; // Clear loading text

            data.items.forEach(article => {
                // Extract image thumbnail from article HTML content
                let imgUrl = article.thumbnail;
                
                if (!imgUrl) {
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(article.content, 'text/html');
                    const imgElement = htmlDoc.querySelector('img');
                    imgUrl = imgElement ? imgElement.src : 'https://via.placeholder.com/320x180?text=Medium+Article';
                }

                // Create Card HTML
                const card = document.createElement('div');
                card.className = 'article-card';

                card.innerHTML = `
                    <a href="${article.link}" target="_blank" class="article-link">
                        <div class="image-wrapper">
                            <img src="${imgUrl}" alt="${article.title}">
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
        } else {
            container.innerHTML = '<p style="color: var(--text-muted);">No articles found.</p>';
        }
    } catch (error) {
        console.error('Error fetching Medium articles:', error);
        container.innerHTML = '<p style="color: var(--text-muted);">Failed to load articles.</p>';
    }
}

// Function to handle left/right button scrolling
function scrollArticles(distance) {
    const container = document.getElementById('articles-scroll');
    if (container) {
        container.scrollBy({
            left: distance,
            behavior: 'smooth'
        });
    }
}

// Load articles on DOM Ready
document.addEventListener('DOMContentLoaded', fetchMediumArticles);