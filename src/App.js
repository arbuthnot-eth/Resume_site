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
              const urls = [
                'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
              ];
              
              for (const url of urls) {
                try {
                  const response = await fetch(url, {
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
                  break; // Exit loop if successful
                } catch (error) {
                  console.error('Error fetching crypto prices:', error);
                  // Only set error state if we've tried all URLs
                  if (url === urls[urls.length - 1]) {
                    setBtcPrice('BTC: Error loading');
                    setEthPrice('ETH: Error loading');
                    setSolPrice('SOL: Error loading');
                  }
                }
              }
            };

            updateCryptoPrices();
            // Update every 2 minutes
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
              // Check for injected provider
              const provider = window.ethereum || window.web3?.currentProvider;
              if (!provider) {
                alert('Please install MetaMask or another Web3 wallet to connect!');
                return;
              }

              const ethersProvider = new ethers.providers.Web3Provider(provider);
              
              try {
                await ethersProvider.send("eth_requestAccounts", []);
              } catch (requestError) {
                console.warn('User rejected wallet connection');
                return;
              }

              const signer = ethersProvider.getSigner();
              const address = await signer.getAddress();
              setWalletAddress(address);
              setIsConnected(true);

              // Try to resolve ENS name
              try {
                const ensName = await ethersProvider.lookupAddress(address);
                if (ensName) {
                  setEnsName(ensName);
                }
              } catch (ensError) {
                console.warn('Error fetching ENS:', ensError);
              }

              // Listen for account changes
              provider.on('accountsChanged', handleAccountsChanged);
              provider.on('disconnect', () => {
                disconnectWallet();
              });
            } catch (error) {
              console.error('Error connecting wallet:', error);
              alert('Failed to connect wallet. Please try again.');
            }
          };

          // Handle account changes
          const handleAccountsChanged = async (accounts) => {
            if (!accounts || accounts.length === 0) {
              disconnectWallet();
            } else {
              try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const address = accounts[0];
                setWalletAddress(address);
                setIsConnected(true);

                try {
                  const ensName = await provider.lookupAddress(address);
                  setEnsName(ensName || '');
                } catch (error) {
                  console.warn('Error fetching ENS:', error);
                  setEnsName('');
                }
              } catch (error) {
                console.error('Error handling account change:', error);
                disconnectWallet();
              }
            }
          };

          // Disconnect wallet function
          const disconnectWallet = () => {
            setWalletAddress('');
            setEnsName('');
            setIsConnected(false);
            
            // Remove event listeners
            const provider = window.ethereum;
            if (provider && provider.removeListener) {
              try {
                provider.removeListener('accountsChanged', handleAccountsChanged);
                provider.removeListener('disconnect', disconnectWallet);
              } catch (error) {
                console.warn('Error removing event listeners:', error);
              }
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
                      <li>Increased deployment velocity by ~750% (12+ hours &rarr; 1.5 hours)</li>
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