import React, { useEffect, useState, useMemo, useCallback } from 'react';
import './App.css';
import { initParticles } from './particles';
import { ethers } from 'ethers';
import Chat from './components/Chat';

function App() {
  const [name, setName] = useState('');
  const [btcPrice, setBtcPrice] = useState('Loading...');
  const [ethPrice, setEthPrice] = useState('Loading...');
  const [solPrice, setSolPrice] = useState('Loading...');
  const [suiPrice, setSuiPrice] = useState('Loading...');
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [ensName, setEnsName] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');
  const [bitcoinAddress, setBitcoinAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [showTickers, setShowTickers] = useState(true);
  const [showCopyNotification, setShowCopyNotification] = useState(false); // New state for notification
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-r1-0528:free"); // Model selection state
  const [expandedSections, setExpandedSections] = useState({
    about: false,
    experience: false,
    education: false,
    stack: false,
    contact: true
  });

  // Add useMemo for static content
  const skillsList = useMemo(() => (
    ['Docker', 'ELK Stack', 'Git', 'Jenkins', 'Linux', 'Mainframe', 'Python', 'Solidity', 'SQL', 'XL Release', 'YAML'].map((skill, index) => (
      <li key={index}>{skill}</li>
    ))
  ), []);

  // Add useCallback for event handlers
  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const handleModelChange = (e) => { // Function to handle model change
    setSelectedModel(e.target.value);
  };

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const section = document.getElementById(sectionId);
    const header = document.querySelector('header');
    if (section && header) {
      const headerHeight = header.offsetHeight;
      const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: sectionTop - headerHeight,
        behavior: 'smooth'
      });
      setExpandedSections(prev => ({
        ...prev,
        [sectionId]: true
      }));
    }
  }, []);

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
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,sui&vs_currencies=usd', {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setBtcPrice(`BTC: $${Math.round(data.bitcoin.usd).toLocaleString()}`);
        setEthPrice(`ETH: $${Math.round(data.ethereum.usd).toLocaleString()}`);
        setSolPrice(`SOL: $${Math.round(data.solana.usd).toLocaleString()}`);
        setSuiPrice(`SUI: $${data.sui.usd.toFixed(2)}`);
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
        // Keep the previous prices if they exist, otherwise show error
        setBtcPrice(prev => prev.includes('$') ? prev : 'BTC: Error loading price');
        setEthPrice(prev => prev.includes('$') ? prev : 'ETH: Error loading price');
        setSolPrice(prev => prev.includes('$') ? prev : 'SOL: Error loading price');
        setSuiPrice(prev => prev.includes('$') ? prev : 'SUI: Error loading price');

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

      // Try to resolve ENS name and associated records
      try {
        const ensName = await provider.lookupAddress(address);
        if (ensName) {
          setEnsName(ensName);

          // Get the resolver for the ENS name
          const resolver = await provider.getResolver(ensName);
          if (resolver) {
            // Try to get the X (Twitter) handle
            const xHandle = await resolver.getText('com.twitter');
            if (xHandle) {
              setXHandle(xHandle);
            }

            // Try to get the Solana address
            try {
              const solAddr = await resolver.getAddress(501); // Solana is coinType 501
              if (solAddr) {
                setSolanaAddress(solAddr);
              } else {
                // Fallback to text record
                const solText = await resolver.getText('solAddr');
                if (solText) {
                  setSolanaAddress(solText);
                }
              }
            } catch (solError) {
              console.error('Error fetching Solana address:', solError);
              // Try fallback to text record if address lookup fails
              try {
                const solText = await resolver.getText('solAddr');
                if (solText) {
                  setSolanaAddress(solText);
                }
              } catch (textError) {
                console.error('Error fetching Solana text record:', textError);
              }
            }

            // Try to get the Bitcoin address
            try {
              // First try address record
              const btcAddr = await resolver.getAddress(0); // Bitcoin is coinType 0
              if (btcAddr) {
                setBitcoinAddress(btcAddr);
              } else {
                // Fallback to text record
                const btcText = await resolver.getText('btc');
                if (btcText) {
                  setBitcoinAddress(btcText);
                }
              }
            } catch (btcError) {
              console.error('Error fetching BTC address:', btcError);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching ENS records:', error);
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
      setXHandle('');
      setSolanaAddress('');
      setBitcoinAddress('');
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

          // Get the resolver for the ENS name
          const resolver = await provider.getResolver(ensName);
          if (resolver) {
            // Try to get the X (Twitter) handle
            const xHandle = await resolver.getText('com.twitter');
            if (xHandle) {
              setXHandle(xHandle);
            }

            // Try to get the Solana address
            try {
              const solAddr = await resolver.getAddress(501); // Solana is coinType 501
              if (solAddr) {
                setSolanaAddress(solAddr);
              } else {
                // Fallback to text record
                const solText = await resolver.getText('solAddr');
                if (solText) {
                  setSolanaAddress(solText);
                }
              }
            } catch (solError) {
              console.error('Error fetching Solana address:', solError);
              // Try fallback to text record if address lookup fails
              try {
                const solText = await resolver.getText('solAddr');
                if (solText) {
                  setSolanaAddress(solText);
                }
              } catch (textError) {
                console.error('Error fetching Solana text record:', textError);
              }
            }

            // Try to get the Bitcoin address
            try {
              // First try address record
              const btcAddr = await resolver.getAddress(0); // Bitcoin is coinType 0
              if (btcAddr) {
                setBitcoinAddress(btcAddr);
              } else {
                // Fallback to text record
                const btcText = await resolver.getText('btc');
                if (btcText) {
                  setBitcoinAddress(btcText);
                }
              }
            } catch (btcError) {
              console.error('Error fetching BTC address:', btcError);
            }
          }
        } else {
          setEnsName('');
          setXHandle('');
          setSolanaAddress('');
          setBitcoinAddress('');
        }
      } catch (error) {
        console.error('Error fetching ENS records:', error);
        setEnsName('');
        setXHandle('');
        setSolanaAddress('');
        setBitcoinAddress('');
      }
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setWalletAddress('');
    setEnsName('');
    setXHandle('');
    setSolanaAddress('');
    setBitcoinAddress('');
    setIsConnected(false);
    // Remove the event listener
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  };

  // Add useEffect to initialize particles for chat popup
  useEffect(() => {
    if (showChatPopup) {
      initParticles('chat-particles');
    }
  }, [showChatPopup]);

// Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopyNotification(true); // Show the custom notification
      setTimeout(() => {
        setShowCopyNotification(false); // Hide after 3 seconds
      }, 3000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleCloseNotification = () => {
    setShowCopyNotification(false);
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
            <li><a href="#stack" onClick={(e) => { e.preventDefault(); scrollToSection('stack'); toggleMenu(); }}>Stack</a></li>
      <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); toggleMenu(); }}>Contact</a></li>
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
                 <div className="wallet-address-container" onClick={() => setShowWalletDetails(!showWalletDetails)}>
                   <span className="wallet-address">
                     {ensName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                   </span>
                   <span className="dropdown-arrow" style={{ transform: showWalletDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                     &darr;
                   </span>
                   {showWalletDetails && (
                     <div className="wallet-details-dropdown">
                       {xHandle && (
                         <div className="dropdown-item x-handle">
                           <span className="label">X Handle</span>
                           <span className="value">{xHandle}</span>
                         </div>
                       )}
                       <div className="dropdown-item bitcoin-address">
                         <span className="label">Bitcoin</span>
                         <span className="value">
                           {bitcoinAddress ?
                             `${bitcoinAddress.slice(0, 10)}...${bitcoinAddress.slice(-10)}` :
                             '[Bitcoin Addr not found]'
                           }
                         </span>
                       </div>
                       <div className="dropdown-item solana-address">
                         <span className="label">Solana</span>
                         <span className="value">
                           {solanaAddress ?
                             `${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}` :
                             '[Solana Addr not found]'
                           }
                         </span>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
   </nav>
   </header>

       <button className="chat-bubble" onClick={() => setShowChatPopup(true)} aria-label="Open chat">
         <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
           <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
         </svg>
       </button>

       <div className={`chat-popup ${showChatPopup ? 'visible' : ''}`}>
         <div id="chat-particles" className="particles"></div>
         <div className="chat-header">
           <h2>Juno AI</h2>
           <div className="model-selector-header" style={{ marginLeft: '15px' }}>
             <select
               id="model-select-header"
               className="chat-model-selector"
               value={selectedModel}
               onChange={handleModelChange}
               style={{
                 backgroundColor: '#000000',
                 color: '#14F195',
                 border: '1px solid #14F195',
                 padding: '5px 8px',
                 borderRadius: '4px',
                 fontFamily: "'Orbitron', sans-serif",
                 fontSize: '0.9rem',
                 fontWeight: 'bold'
               }}
             >
               <option value="deepseek/deepseek-r1-0528:free" style={{ backgroundColor: '#000000', color: '#14F195', fontWeight: 'normal' }}>DeepSeek (Free)</option>
               <option value="google/gemini-2.5-flash-preview" style={{ backgroundColor: '#000000', color: '#14F195', fontWeight: 'normal' }}>Gemini 2.5 Flash</option>
               <option value="google/gemini-pro" style={{ backgroundColor: '#000000', color: '#14F195', fontWeight: 'normal' }}>Gemini 2.5 Pro</option>
             </select>
           </div>
           <button className="close-button" onClick={() => setShowChatPopup(false)}>×</button>
         </div>
         {isConnected ? (
           <Chat selectedModel={selectedModel} />
         ) : (
           <div className="connect-wallet-prompt">
             <p>Please connect your wallet to use the chat function</p>
           </div>
         )}
       </div>

       <main>
       <section id="hero">
         <h1 id="name">{name}</h1>
         <p>DevOps Engineer</p>
       </section>

         <div className="section-titles">
           <div
             className={`section-title ${expandedSections.about ? 'active' : ''}`}
             onClick={() => toggleSection('about')}
           >
             About Me
           </div>
           <div
             className={`section-title ${expandedSections.experience ? 'active' : ''}`}
             onClick={() => toggleSection('experience')}
           >
             Experience
           </div>
           <div
             className={`section-title ${expandedSections.education ? 'active' : ''}`}
             onClick={() => toggleSection('education')}
           >
             Education
           </div>
           <div
             className={`section-title ${expandedSections.stack ? 'active' : ''}`}
             onClick={() => toggleSection('stack')}
           >
             Stack
           </div>
           <div
             className={`section-title ${expandedSections.contact ? 'active' : ''}`}
             onClick={() => toggleSection('contact')}
           >
             Contact
           </div>
         </div>

         <div className="sections-container">
           <section
             id="about"
             className={`collapsible-section ${expandedSections.about ? 'expanded' : ''}`}
           >
           <h2>About Me</h2>
             <div className="section-content">
           <p>Blockchain believer, with a rapidly accelerating interest in AI. 4 years of experience engineering critical infrastructure for applications with millions of users</p>
             </div>
         </section>

           <section
             id="experience"
             className={`collapsible-section ${expandedSections.experience ? 'expanded' : ''}`}
           >
           <h2>Professional Experience</h2>
             <div className="section-content">
           <div className="job">
             <h3>Software Engineer - DevOps</h3>
             <p>Cognizant Technology Solutions (contract via Keybank)</p>
             <p>Jan 2020 - Feb 2024</p>
             <ul>
               <li>Owned and engineered 200+ deployments via CI/CD pipelines (Git, XLR, Jenkins)</li>
               <li><span>Increased deployment velocity by ~750% (12+ hours -&gt; 1.5 hours)</span></li>
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
           </div>
         </section>

           <section
             id="education"
             className={`collapsible-section ${expandedSections.education ? 'expanded' : ''}`}
           >
           <h2>Education</h2>
             <div className="section-content">
           <h3>B.S. Computer Science & Engineering</h3>
           <p>Ohio State University</p>
           <p>August 2015 - December 2019 | Columbus, OH</p>
             </div>
         </section>

           <section
             id="stack"
             className={`collapsible-section ${expandedSections.stack ? 'expanded' : ''}`}
           >
             <h2>Stack</h2>
             <div className="section-content">
           <ul className="skill-list">
                 {skillsList}
           </ul>
             </div>
         </section>

           <section
             id="contact"
             className={`collapsible-section ${expandedSections.contact ? 'expanded' : ''}`}
           >
           <h2>Contact</h2>
             <div className="section-content">
           <div className="contact-item">
             <p className="contact-text">Email: brandon@imbibed.life</p>
             <button className="copy-button" onClick={() => copyToClipboard('brandon@imbibed.life')}>Copy</button>
           </div>
           <div className="contact-item">
             <p className="contact-text">Phone: (330) 703-8650</p>
             <button className="copy-button" onClick={() => copyToClipboard('(330) 703-8650')}>Copy</button>
           </div>
             </div>
         </section>
         </div>
       </main>
       <div id="crypto-tracker">
         <span id="btc-price">{btcPrice}</span>
         <span id="eth-price">{ethPrice}</span>
         <span id="sol-price">{solPrice}</span>
         <span id="sui-price">{suiPrice}</span>
       </div>
       <footer>
         <p>© 2024 Brandon Arbuthnot. All rights reserved.</p>
       </footer>
       {/* Custom Copy Notification */}
       <div className={`copy-notification ${showCopyNotification ? 'show' : ''}`}>
         <span>Copied!</span>
         <button className="close-button" onClick={handleCloseNotification}>×</button>
       </div>
    </div>
  );
}

export default App;