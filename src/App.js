        import React, { useEffect, useState } from 'react';
        import './App.css';
        import { initParticles } from './particles';
import ChatPage from './components/ChatPage';
        import { ethers } from 'ethers';

        function App() {
          const [name, setName] = useState('');
          const [btcPrice, setBtcPrice] = useState('Loading...');
          const [ethPrice, setEthPrice] = useState('Loading...');
          const [solPrice, setSolPrice] = useState('Loading...');
          const [menuOpen, setMenuOpen] = useState(false);
          const [walletAddress, setWalletAddress] = useState('');
          const [ensName, setEnsName] = useState('');
          const [isConnected, setIsConnected] = useState(false);
          const [showChat, setShowChat] = useState(false);

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
            const updateCryptoPrices = async () => {
              try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd', {
                  headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setBtcPrice(`BTC: $${data.bitcoin.usd.toLocaleString()}`);
                setEthPrice(`ETH: $${data.ethereum.usd.toLocaleString()}`);
                setSolPrice(`SOL: $${data.solana.usd.toLocaleString()}`);
              } catch (error) {
                console.error('Error fetching crypto prices:', error);
                // Keep the previous prices if they exist, otherwise show error
                setBtcPrice(prev => prev.includes('$') ? prev : 'BTC: Error loading price');
                setEthPrice(prev => prev.includes('$') ? prev : 'ETH: Error loading price');
                setSolPrice(prev => prev.includes('$') ? prev : 'SOL: Error loading price');
                
                // Retry after 5 seconds if it's a rate limit error
                if (error.message.includes('429') || error.message.includes('rate limit')) {
                  setTimeout(updateCryptoPrices, 5000);
                }
              }
            };

            updateCryptoPrices();
            // Increase interval to 2 minutes to avoid rate limiting
            const interval = setInterval(updateCryptoPrices, 120000);

            return () => clearInterval(interval);
          }, []);

          // Toggle mobile menu
          const toggleMenu = () => {
            setMenuOpen(!menuOpen);
          };

          // Connect wallet function
          const connectWallet = async () => {
            try {
              if (!window.ethereum) {
                alert('Please install MetaMask to connect your wallet!');
                return;
              }

              const provider = new ethers.providers.Web3Provider(window.ethereum);
              await provider.send("eth_requestAccounts", []);
              const signer = provider.getSigner();
              const address = await signer.getAddress();
              setWalletAddress(address);
              setIsConnected(true);

              // Try to resolve ENS name
              try {
                const ensName = await provider.lookupAddress(address);
                if (ensName) {
                  setEnsName(ensName);
                }
              } catch (error) {
                console.error('Error fetching ENS:', error);
              }

              // Listen for account changes
              window.ethereum.on('accountsChanged', handleAccountsChanged);
            } catch (error) {
              console.error('Error connecting wallet:', error);
            }
          };

          // Handle account changes
          const handleAccountsChanged = async (accounts) => {
            if (accounts.length === 0) {
              // User disconnected
              setWalletAddress('');
              setEnsName('');
              setIsConnected(false);
            } else {
              // Account changed
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              const address = accounts[0];
              setWalletAddress(address);
              setIsConnected(true);

              try {
                const ensName = await provider.lookupAddress(address);
                if (ensName) {
                  setEnsName(ensName);
                } else {
                  setEnsName('');
                }
              } catch (error) {
                console.error('Error fetching ENS:', error);
                setEnsName('');
              }
            }
          };

          // Disconnect wallet function
          const disconnectWallet = () => {
            setWalletAddress('');
            setEnsName('');
            setIsConnected(false);
            // Remove the event listener
            if (window.ethereum) {
              window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
          };

          // Handle chat navigation
          const handleChatClick = (e) => {
            e.preventDefault();
            setShowChat(true);
            setMenuOpen(false);
          };

          const handleBackClick = () => {
            setShowChat(false);
          };

          if (showChat) {
            return (
              <div className="App">
                <header>
                  <nav>
                    <button className="back-button" onClick={handleBackClick}>
                      ← Back
                    </button>
                    <div className="wallet-section">
                      {!isConnected ? (
                        <button className="connect-wallet" onClick={connectWallet}>
                          Connect Wallet
                        </button>
                      ) : (
                        <div className="wallet-info">
                          <div className="connection-status-container">
                            <span className="status-icon check">✓</span>
                            <span className="connection-status">Connected</span>
                            <button className="status-icon disconnect" onClick={disconnectWallet}>×</button>
                          </div>
                          <span className="wallet-address">
                            {ensName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </nav>
                </header>
                <ChatPage 
                  isConnected={isConnected} 
                  btcPrice={btcPrice}
                  ethPrice={ethPrice}
                  solPrice={solPrice}
                />
              </div>
            );
          }

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
              <li><a href="#chat" onClick={handleChatClick}>Chat</a></li>
            </ul>
            <div className="wallet-section">
              {!isConnected ? (
                <button className="connect-wallet" onClick={connectWallet}>
                  Connect Wallet
                </button>
              ) : (
                <div className="wallet-info">
                  <div className="connection-status-container">
                    <span className="status-icon check">✓</span>
                    <span className="connection-status">Connected</span>
                    <button className="status-icon disconnect" onClick={disconnectWallet}>×</button>
                  </div>
                  <span className="wallet-address">
                    {ensName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                  </span>
                </div>
              )}
            </div>
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
                <span id="sol-price">{solPrice}</span>
              </div>
              <footer>
                <p>© 2024 Brandon Arbuthnot. All rights reserved.</p>
              </footer>
            </div>
          );
        }

        export default App;