        import React, { useEffect, useState } from 'react';
        import './App.css';
        import { initParticles } from './particles';

        function App() {
          const [name, setName] = useState('');
          const [btcPrice, setBtcPrice] = useState('Loading...');
          const [ethPrice, setEthPrice] = useState('Loading...');
          const [menuOpen, setMenuOpen] = useState(false);

          // Scroll to section when clicking on a nav link
          const scrollToSection = (sectionId) => {
            const section = document.getElementById(sectionId);
            const header = document.querySelector('header');
            if (section && header) {
              const headerHeight = header.offsetHeight;
              const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
              window.scrollTo({
                top: sectionTop - headerHeight,
                behavior: 'smooth'
              });
            }
          };

          // Initialize particles.js and fetch cryptocurrency prices
          useEffect(() => {

            // Initialize particles.js
            initParticles();

            // Typing effect for name
            const fullName = 'Brandon Arbuthnot';
            let i = 0;
            const typeWriter = () => {
              if (i < fullName.length) {
                setName(fullName.slice(0, i + 1));
                i++;
                setTimeout(typeWriter, 150);
              }
            };
            typeWriter();

            // Cryptocurrency price tracker
            const updateCryptoPrices = () => {
              fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd')
                .then(response => response.json())
                .then(data => {
                  setBtcPrice(`BTC: $${data.bitcoin.usd.toLocaleString()}`);
                  setEthPrice(`ETH: $${data.ethereum.usd.toLocaleString()}`);
                })
                .catch(error => {
                  console.error('Error fetching crypto prices:', error);
                  setBtcPrice('BTC: Error loading price');
                  setEthPrice('ETH: Error loading price');
                });
            };

            updateCryptoPrices();
            const interval = setInterval(updateCryptoPrices, 60000);

            return () => clearInterval(interval);
          }, []);

          // Toggle mobile menu
          const toggleMenu = () => {
            setMenuOpen(!menuOpen);
          };

          return (
            <div className="App">
              <div id="particles-js" className="particles"></div>
              <header>
              <nav>
            <button className="menu-toggle" onClick={toggleMenu}>
              ☰
            </button>
            <ul className={menuOpen ? 'open' : ''}>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); toggleMenu(); }}>About</a></li>
              <li><a href="#experience" onClick={(e) => { e.preventDefault(); scrollToSection('experience'); toggleMenu(); }}>Experience</a></li>
              <li><a href="#education" onClick={(e) => { e.preventDefault(); scrollToSection('education'); toggleMenu(); }}>Education</a></li>
              <li><a href="#skills" onClick={(e) => { e.preventDefault(); scrollToSection('skills'); toggleMenu(); }}>Skills</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); toggleMenu(); }}>Contact</a></li>
            </ul>
          </nav>
          </header>
              <main>
              <section id="hero">
                <h1 id="name">{name}</h1>
                <p>DevOps Engineer</p>
              </section>
                <section id="about">
                  <h2>About Me</h2>
                  <p>Blockchain believer, with a rapidly accelerating interest in AI. 4 years of experience engineering critical infrastructure for applications with millions of users</p>
                </section>
                <section id="experience">
                  <h2>Professional Experience</h2>
                  <div className="job">
                    <h3>Software Engineer - DevOps</h3>
                    <p>Cognizant Technology Solutions (contract via Keybank)</p>
                    <p>Jan 2020 - Feb 2024</p>
                    <ul>
                      <li>Owned and engineered 200+ deployments via CI/CD pipelines (Git, XLR, Jenkins)</li>
                      <li>Increased deployment velocity by ~750% (12+ hours -> 1.5 hours)</li>
                      <li>Improved release stability to 95% (eliminate errors in prod deployment)</li>
                      <li>Employed regular trunk-based flow strategies and release schedule</li>
                    </ul>
                  </div>
                  <div className="job">
                    <h3>Lead Developer | Python</h3>
                    <p>Pokémon Revolution Online (Non-Profit)</p>
                    <p>January 2015 - July 2019 | Remote</p>
                    <ul>
                      <li>Created quest storylines and integrated with previously existing content</li>
                      <li>Delivered spontaneous hunt events, scripted interactions, dynamic objectives</li>
                      <li>Integrated and improved mechanics of the battle API</li>
                      <li>Developed 'Mega Stone' mechanics and plot</li>
                      <li>Converted the core MMO codebase from Xanascript to Python</li>
                    </ul>
                  </div>
                </section>
                <section id="education">
                  <h2>Education</h2>
                  <h3>B.S. Computer Science & Engineering</h3>
                  <p>Ohio State University</p>
                  <p>August 2015 - December 2019 | Columbus, OH</p>
                </section>
                <section id="skills">
                  <h2>Skills</h2>
                  <ul className="skill-list">
                    {['Docker', 'ELK Stack', 'Git', 'Jenkins', 'Linux', 'Mainframe', 'Python', 'Solidity', 'SQL', 'XL Release', 'YAML'].map((skill, index) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </section>
                <section id="contact">
                  <h2>Contact</h2>
                  <p>Email: Brandon.Arbuthnot@protonmail.com</p>
                  <p>Phone: (330) 703-8650</p>
                </section>
              </main>
              <div id="crypto-tracker">
                <span id="btc-price">{btcPrice}</span>
                <span id="eth-price">{ethPrice}</span>
              </div>
              <footer>
                <p>© 2024 Brandon Arbuthnot. All rights reserved.</p>
              </footer>
            </div>
          );
        }

        export default App;