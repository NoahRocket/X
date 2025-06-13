import React from 'react';
import '../styles/PostCard.css';

const PostCard = ({ post, isAuthenticated, onLike, onTagClick }) => {
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-user">{post.username}</div>
        <div className="post-time">{formatDate(post.created_at)}</div>
      </div>
      
      <div className="post-question">{post.question}</div>
      
      <div className="post-response">
        <div className="response-label">AI RESPONSE:</div>
        <div className="response-content">{post.response}</div>
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, index) => (
            <span key={index} className="tag" onClick={() => onTagClick(tag)}>{tag}</span>
          ))}
        </div>
      )}
      
      <div className="post-actions">
        <button 
          className={`like-button ${post.user_has_liked ? 'liked' : ''}`}
          onClick={onLike}
          disabled={!isAuthenticated}
        >
          <span className="heart-icon">♥</span> {post.like_count}
        </button>
      </div>
    </div>
  );
};

export default PostCard;
