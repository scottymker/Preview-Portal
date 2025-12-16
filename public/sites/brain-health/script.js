// Brain Health and Chiropractic - Enhanced Website JavaScript

document.addEventListener('DOMContentLoaded', function() {

    // ========================================
    // Mobile Menu Toggle
    // ========================================
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });

    // ========================================
    // Sticky Header with Background Change
    // ========================================
    const header = document.getElementById('header');
    const announcementBar = document.querySelector('.announcement-bar');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
            if (announcementBar) {
                announcementBar.style.transform = 'translateY(-100%)';
            }
        } else {
            header.classList.remove('scrolled');
            if (announcementBar) {
                announcementBar.style.transform = 'translateY(0)';
            }
        }
    });

    // ========================================
    // FAQ Accordion
    // ========================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', function() {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // ========================================
    // Smooth Scroll for Anchor Links
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const headerHeight = header.offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========================================
    // Animate Elements on Scroll
    // ========================================

    // Detect if we're inside an iframe
    const isInIframe = window.self !== window.top;

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-element {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .animate-element.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        .timeline-item:nth-child(1) { transition-delay: 0.1s; }
        .timeline-item:nth-child(2) { transition-delay: 0.2s; }
        .timeline-item:nth-child(3) { transition-delay: 0.3s; }
        .timeline-item:nth-child(4) { transition-delay: 0.4s; }
    `;
    document.head.appendChild(style);

    // Get all animatable elements
    const animatableElements = document.querySelectorAll('.problem-card, .condition-card, .diff-card, .timeline-item, .testimonial-card');

    if (isInIframe) {
        // In iframe: skip animations, show all elements immediately
        animatableElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    } else {
        // Not in iframe: use IntersectionObserver for scroll animations
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animatableElements.forEach(el => {
            el.classList.add('animate-element');
            observer.observe(el);
        });
    }

    // ========================================
    // Form Submission Handler
    // ========================================
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            // Here you would typically send to a server
            // For demo, we'll show a success message

            // Create success message
            const successMessage = document.createElement('div');
            successMessage.className = 'form-success';
            successMessage.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <h4>Thank You!</h4>
                <p>Your message has been sent. We'll get back to you within 48 hours.</p>
            `;
            successMessage.style.cssText = `
                background: #f0fff4;
                border: 1px solid #38a169;
                border-radius: 8px;
                padding: 2rem;
                text-align: center;
                color: #276749;
            `;
            successMessage.querySelector('i').style.cssText = `
                font-size: 3rem;
                color: #38a169;
                margin-bottom: 1rem;
                display: block;
            `;

            // Replace form with success message
            contactForm.parentNode.replaceChild(successMessage, contactForm);
        });
    }

    // ========================================
    // Testimonial Slider (Simple Auto-rotate)
    // ========================================
    const testimonialGrid = document.querySelector('.testimonial-grid');

    if (testimonialGrid) {
        const cards = testimonialGrid.querySelectorAll('.testimonial-card');
        let currentIndex = 0;

        // Only activate slider on mobile
        function checkMobileSlider() {
            if (window.innerWidth <= 768 && cards.length > 1) {
                cards.forEach((card, index) => {
                    card.style.display = index === currentIndex ? 'block' : 'none';
                });
            } else {
                cards.forEach(card => {
                    card.style.display = 'block';
                });
            }
        }

        // Auto-rotate on mobile
        setInterval(() => {
            if (window.innerWidth <= 768 && cards.length > 1) {
                currentIndex = (currentIndex + 1) % cards.length;
                checkMobileSlider();
            }
        }, 5000);

        window.addEventListener('resize', checkMobileSlider);
        checkMobileSlider();
    }

    // ========================================
    // Track CTA Clicks (Analytics Ready)
    // ========================================
    document.querySelectorAll('.btn-primary, .btn-nav, .floating-cta').forEach(btn => {
        btn.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            const buttonLocation = this.closest('section')?.id || 'header';

            // Track event (ready for Google Analytics or similar)
            console.log('CTA Click:', {
                buttonText,
                buttonLocation,
                timestamp: new Date().toISOString()
            });

            // If using Google Analytics:
            // gtag('event', 'cta_click', {
            //     'button_text': buttonText,
            //     'button_location': buttonLocation
            // });
        });
    });

    // ========================================
    // Phone Number Click Tracking
    // ========================================
    document.querySelectorAll('a[href^="tel:"]').forEach(phoneLink => {
        phoneLink.addEventListener('click', function() {
            console.log('Phone Click:', this.href);
            // Track phone call clicks for analytics
        });
    });

    // ========================================
    // Exit Intent Popup (Optional - Uncomment to enable)
    // ========================================
    /*
    let exitIntentShown = false;

    document.addEventListener('mouseout', function(e) {
        if (e.clientY < 0 && !exitIntentShown) {
            exitIntentShown = true;
            // Show popup offering free consultation
            showExitPopup();
        }
    });

    function showExitPopup() {
        const popup = document.createElement('div');
        popup.innerHTML = `
            <div class="exit-popup-overlay">
                <div class="exit-popup">
                    <button class="exit-popup-close">&times;</button>
                    <h3>Wait! Don't Leave Yet</h3>
                    <p>Schedule a FREE discovery call to see if we can help with your symptoms.</p>
                    <a href="#consultation" class="btn btn-primary">Schedule Free Call</a>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        popup.querySelector('.exit-popup-close').addEventListener('click', () => {
            popup.remove();
        });

        popup.querySelector('.exit-popup-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                popup.remove();
            }
        });
    }
    */

    // ========================================
    // Lazy Load Images
    // ========================================
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // ========================================
    // Add Active State to Navigation
    // ========================================
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Add active link styles
    const navStyle = document.createElement('style');
    navStyle.textContent = `
        .nav-links a.active {
            color: var(--primary-color);
            font-weight: 600;
        }
        .header.scrolled {
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .announcement-bar {
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(navStyle);

    console.log('Brain Health & Chiropractic website loaded successfully!');
});
