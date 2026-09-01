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