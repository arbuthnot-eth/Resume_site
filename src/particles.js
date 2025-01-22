export function initParticles() {
    if (window.particlesJS) {
      window.particlesJS('particles-js', {
        particles: {
          number: { value: 60, density: { enable: true, value_area: 800 } },
          color: { value: ["#9945FF", "#14F195", "#00C2FF"] },
          shape: { type: "circle" },
          opacity: {
            value: 0.9,
            random: true,
            anim: {
              enable: true,
              speed: 1,
              opacity_min: 0.4,
              sync: false
            }
          },
          size: { 
            value: 5,
            random: true,
            anim: {
              enable: true,
              speed: 4,
              size_min: 2,
              sync: false
            }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#9945FF",
            opacity: 0.6,
            width: 2,
            shadow: {
              enable: true,
              color: "#14F195",
              blur: 5
            }
          },
          move: {
            enable: true,
            speed: 4,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
              enable: true,
              rotateX: 600,
              rotateY: 1200
            }
          }
        },
        interactivity: {
          detect_on: "canvas",
          events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
          modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
      });
    } else {
      console.error('Particles.js is not loaded');
    }
  }