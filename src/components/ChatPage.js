import React, { useEffect } from 'react';
import Chat from './Chat';
import { initParticles } from '../particles';

function ChatPage({ isConnected, btcPrice, ethPrice, solPrice, suiPrice, showTickers, setShowTickers }) {
  useEffect(() => {
    // Initialize particles.js
    initParticles();
  }, []);

  return (
    <div className="chat-page">
      <div id="particles-js" className="particles"></div>
      <div className="chat-page-container">
        <h1>Juno AI</h1>
        {isConnected ? (
          <Chat />
        ) : (
          <div className="connect-wallet-prompt">
            <p>Please connect your wallet to use the chat function</p>
          </div>
        )}
      </div>
      <div id="crypto-tracker" className={!showTickers ? 'hidden' : ''}>
        <button className="crypto-toggle" onClick={() => setShowTickers(!showTickers)}>
          <span className={`caret ${showTickers ? 'up' : ''}`}>^</span>
        </button>
        <span id="btc-price">{btcPrice}</span>
        <span id="eth-price">{ethPrice}</span>
        <span id="sol-price">{solPrice}</span>
        <span id="sui-price">{suiPrice}</span>
      </div>
    </div>
  );
}

export default ChatPage; 