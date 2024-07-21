document.addEventListener('DOMContentLoaded', (event) => {

    // Particle background
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#D4AF37" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#D4AF37", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 6, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });

    // Animate sections on scroll
    const sections = document.querySelectorAll('section');
    const animateSection = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    };

    const sectionObserver = new IntersectionObserver(animateSection, {
        root: null,
        threshold: 0.1
    });

    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'opacity 0.5s, transform 0.5s';
        sectionObserver.observe(section);
    });

    // Typing effect for name
    const nameElement = document.getElementById('name');
    const nameText = nameElement.textContent;
    nameElement.textContent = '';
    let i = 0;

    function typeWriter() {
        if (i < nameText.length) {
            nameElement.textContent += nameText.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }

    typeWriter();

    // Skill hover effect
    const skills = document.querySelectorAll('.skill-list li');
    skills.forEach(skill => {
        skill.addEventListener('mouseover', () => {
            anime({
                targets: skill,
                scale: 1.1,
                duration: 300,
                easing: 'easeInOutQuad'
            });
        });
        skill.addEventListener('mouseout', () => {
            anime({
                targets: skill,
                scale: 1,
                duration: 300,
                easing: 'easeInOutQuad'
            });
        });
    });
    // Cryptocurrency price tracker
    function updateCryptoPrices() {
        const btcElement = document.getElementById('btc-price');
        const ethElement = document.getElementById('eth-price');

        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd')
            .then(response => response.json())
            .then(data => {
                btcElement.textContent = `BTC: $${data.bitcoin.usd.toLocaleString()}`;
                ethElement.textContent = `ETH: $${data.ethereum.usd.toLocaleString()}`;
            })
            .catch(error => {
                console.error('Error fetching crypto prices:', error);
                btcElement.textContent = 'BTC: Error loading price';
                ethElement.textContent = 'ETH: Error loading price';
            });
    }

    // Update crypto prices initially and then every 60 seconds
    updateCryptoPrices();
    setInterval(updateCryptoPrices, 60000);
});