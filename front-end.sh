#!/bin/bash

# Talk Around Town Website Deployment Script
# This script sets up the necessary directories and files for the Talk Around Town website

# Set variables (modify these to match your setup)
PROJECT_DIR="."
HTML_FILE="index.html"

# Create necessary directories
echo "Creating directory structure..."
mkdir -p $PROJECT_DIR/public
mkdir -p $PROJECT_DIR/public/css
mkdir -p $PROJECT_DIR/public/js
mkdir -p $PROJECT_DIR/public/images

# Copy HTML file to public directory
echo "Copying HTML file to public directory..."
cat > $PROJECT_DIR/public/$HTML_FILE << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Talk Around Town - Empowering Family Engagement</title>
    <link rel="icon" href="/images/favicon.ico" type="image/x-icon">
    <!-- Bootstrap CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/css/styles.css" rel="stylesheet">
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg sticky-top">
        <div class="container">
            <a class="navbar-brand" href="#">Talk Around Town</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="#home">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#features">Features</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#how-it-works">How It Works</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#about">About</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#contact">Contact</a>
                    </li>
                    <li class="nav-item ms-lg-3">
                        <a class="btn btn-primary" href="#download">Download</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero" id="home">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6">
                    <h1>Supporting Parent-Child Communication in the Community</h1>
                    <p class="mb-4">Talk Around Town is a mobile application designed to provide real-time, location-specific communication strategies to help parents enhance language development with their young children while out in the community.</p>
                    <div class="d-flex flex-wrap">
                        <a href="#download" class="btn btn-light btn-lg me-3 mb-3">Download App</a>
                        <a href="#learn-more" class="btn btn-outline-light btn-lg mb-3">Learn More</a>
                    </div>
                </div>
                <div class="col-lg-6 text-center">
                    <img src="/images/app-mockup.png" alt="Talk Around Town App" class="mobile-mockup img-fluid">
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="section bg-light" id="features">
        <div class="container">
            <h2 class="text-center mb-5">Key Features</h2>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="feature-card bg-white">
                        <i class="fas fa-map-marker-alt feature-icon"></i>
                        <h3>Location-Specific Tips</h3>
                        <p>Receive customized communication strategies based on where you are with your child - whether at the grocery store, park, library, or other community settings.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card bg-white">
                        <i class="fas fa-comments feature-icon"></i>
                        <h3>Evidence-Based Strategies</h3>
                        <p>All tips are based on research-proven communication techniques that enhance children's language development and parent-child interaction.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card bg-white">
                        <i class="fas fa-chart-line feature-icon"></i>
                        <h3>Track Your Progress</h3>
                        <p>Monitor your usage and engagement with the app over time to see how you're increasing high-quality interactions with your child.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works Section -->
    <section class="section" id="how-it-works">
        <div class="container">
            <h2 class="text-center mb-5">How It Works</h2>
            <div class="row justify-content-center mb-5">
                <div class="col-lg-10">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="how-it-works-step">
                                <div class="step-number">1</div>
                                <h4>Select Your Locations</h4>
                                <p>Choose the community places you frequently visit with your child, such as parks, grocery stores, or bus stops.</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="how-it-works-step">
                                <div class="step-number">2</div>
                                <h4>Get Personalized Tips</h4>
                                <p>Receive real-time, context-specific communication strategies when you arrive at your selected locations.</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="how-it-works-step">
                                <div class="step-number">3</div>
                                <h4>Enhance Interactions</h4>
                                <p>Put the tips into practice to engage in meaningful conversations with your child while out in the community.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="section" id="about">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6 order-lg-2 mb-4 mb-lg-0">
                    <img src="/images/about.jpg" alt="About Talk Around Town" class="img-fluid rounded shadow">
                </div>
                <div class="col-lg-6 order-lg-1">
                    <h2 class="section-title">About Talk Around Town</h2>
                    <p>Talk Around Town is a mobile phone application that uses GPS functionality to provide parents with real-time, location-specific tips and strategies to help increase the quantity and quality of talk with their young children while visiting community settings.</p>
                    <p>Our application is built upon evidence-based strategies related to child language promotion and is designed to turn sometimes inconsistent parent-child interactions into a high-quality habit.</p>
                    <p>Research shows that frequent, rich language experiences are essential for all young children's development—particularly those living in poverty and those with delays or disabilities. Talk Around Town aims to bridge the gap by providing accessible, context-specific support to all families.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-4">
                    <h4 class="mb-4">Talk Around Town</h4>
                    <p>A mobile application designed to provide real-time, location-specific communication strategies to help parents enhance language development with their young children while out in the community.</p>
                </div>
                <div class="col-lg-2 col-md-6">
                    <h5 class="mb-4">Quick Links</h5>
                    <a href="#home" class="footer-link">Home</a>
                    <a href="#features" class="footer-link">Features</a>
                    <a href="#how-it-works" class="footer-link">How It Works</a>
                    <a href="#about" class="footer-link">About</a>
                    <a href="#contact" class="footer-link">Contact</a>
                </div>
                <div class="col-lg-4">
                    <h5 class="mb-4">Contact Us</h5>
                    <p>Juniper Gardens Children's Project<br>The University of Kansas<br>444 Minnesota Avenue, Suite 300<br>Kansas City, KS 66101</p>
                    <p>Email: info@talkaroundtown.org</p>
                    <p>Phone: (352) 392-3261</p>
                </div>
            </div>
            <div class="text-center copyright">
                <p>&copy; 2025 Talk Around Town. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS Bundle -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>
EOF

# Create CSS file
echo "Creating CSS file..."
cat > $PROJECT_DIR/public/css/styles.css << 'EOF'
:root {
    --primary-color: #4A90E2;
    --secondary-color: #34C759;
    --accent-color: #FF3B30;
    --light-color: #F8F9FA;
    --dark-color: #333333;
}

body {
    font-family: 'Poppins', sans-serif;
    color: var(--dark-color);
    overflow-x: hidden;
}

.navbar {
    background-color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar-brand {
    font-weight: 700;
    color: var(--primary-color);
}

.nav-link {
    color: var(--dark-color);
    font-weight: 500;
}

.nav-link:hover {
    color: var(--primary-color);
}

.btn-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.btn-primary:hover {
    background-color: #357ABD;
    border-color: #357ABD;
}

.hero {
    background: linear-gradient(135deg, #4A90E2, #357ABD);
    color: white;
    padding: 100px 0;
    position: relative;
    overflow: hidden;
}

.hero:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 100%;
    height: 70px;
    background-color: white;
    clip-path: polygon(0 100%, 100% 100%, 100% 0);
}

.hero h1 {
    font-weight: 700;
    font-size: 2.5rem;
    margin-bottom: 20px;
}

.hero p {
    font-size: 1.2rem;
    opacity: 0.9;
}

.section {
    padding: 80px 0;
}

.section-title {
    font-weight: 700;
    margin-bottom: 50px;
    position: relative;
    display: inline-block;
}

.section-title:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 50px;
    height: 3px;
    background-color: var(--primary-color);
}

.feature-card {
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    padding: 30px;
    height: 100%;
    transition: transform 0.3s;
}

.feature-card:hover {
    transform: translateY(-10px);
}

.feature-icon {
    font-size: 2.5rem;
    color: var(--primary-color);
    margin-bottom: 20px;
}

.how-it-works-step {
    text-align: center;
    margin-bottom: 40px;
}

.step-number {
    width: 50px;
    height: 50px;
    background-color: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-weight: 700;
    font-size: 1.2rem;
}

footer {
    background-color: var(--dark-color);
    color: white;
    padding: 50px 0 20px;
}

.footer-link {
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    margin-bottom: 10px;
    display: block;
    transition: color 0.3s;
}

.footer-link:hover {
    color: white;
}

.copyright {
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 20px;
    margin-top: 30px;
}

.mobile-mockup {
    max-width: 300px;
    margin: 0 auto;
}

@media (max-width: 768px) {
    .hero {
        padding: 70px 0;
    }
    
    .hero h1 {
        font-size: 2rem;
    }
    
    .section {
        padding: 60px 0;
    }
}
EOF

# Create JavaScript file
echo "Creating JavaScript file..."
cat > $PROJECT_DIR/public/js/main.js << 'EOF'
// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Navbar active state
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});
EOF

# Create placeholder for favicon
echo "Creating placeholder favicon..."
mkdir -p $PROJECT_DIR/public/images

# Get placeholder images
echo "Downloading placeholder images..."
wget -O $PROJECT_DIR/public/images/app-mockup.png https://via.placeholder.com/300x600.png?text=App+Mockup
wget -O $PROJECT_DIR/public/images/about.jpg https://via.placeholder.com/600x400.jpg?text=About+Us
wget -O $PROJECT_DIR/public/images/favicon.ico https://via.placeholder.com/16x16

# Set permissions
echo "Setting permissions..."
chmod -R 755 $PROJECT_DIR/public

# Restart the Node.js application (this is a placeholder - modify as needed)
echo "Restarting application..."
# Uncomment and modify the appropriate restart command for your setup:
# pm2 restart your-app-name
# systemctl restart your-service
# pkill -f node
# node $PROJECT_DIR/index.js

echo "Deployment completed successfully!"