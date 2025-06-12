import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">INTELLECTUS</h1>
        <p className="home-description">
          A space where human curiosity merges with artificial intelligence.
        </p>
        <p className="home-subtitle">
          Join our community to explore questions posed to AI and their responses,
          fostering a collective learning experience.
        </p>
        <div className="home-buttons">
          <Link to="/register" className="home-button">
            Join Now
          </Link>
          <Link to="/feed" className="home-button home-button-secondary">
            Browse Feed
          </Link>
        </div>
      </div>
      <div className="home-features">
        <div className="home-feature">
          <h3>Public Feed</h3>
          <p>Explore an endless stream of questions and AI answers.</p>
        </div>
        <div className="home-feature">
          <h3>Ask Questions</h3>
          <p>Contribute up to 100 questions daily as a registered user.</p>
        </div>
        <div className="home-feature">
          <h3>Engage</h3>
          <p>Like and interact with content from the community.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
