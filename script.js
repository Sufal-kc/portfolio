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