import React, { useState } from 'react';
import '../styles/QuestionForm.css';

const QuestionForm = ({ onSubmit, loading }) => {
  const [question, setQuestion] = useState('');
  const MAX_CHARS = 140;

  const handleInputChange = (e) => {
    setQuestion(e.target.value);
  };

  const currentChars = question.length;
  const canSubmit = !loading && question.trim().length > 0 && currentChars <= MAX_CHARS;

  const performSubmit = () => {
    if (!canSubmit) return;
    onSubmit(question);
    setQuestion('');
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    performSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in textarea
      performSubmit();
    }
  };

  return (
    <div className="question-form-container">
      <h2>ASK A QUESTION</h2>
      <form onSubmit={handleSubmitForm}>
        <textarea
          value={question}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="What would you like to know?"
          disabled={loading}
          required
          maxLength={MAX_CHARS}
          rows="3" // Set initial visible rows
          aria-describedby="char-counter-info" // For accessibility
        />
        <div className="form-footer"> {/* Wrapper for counter and button */}
          <div 
            id="char-counter-info" // For accessibility
            className={`char-counter ${currentChars > MAX_CHARS ? 'over-limit' : ''}`}
          >
            {currentChars}/{MAX_CHARS}
          </div>
          <button 
            type="submit" 
            disabled={!canSubmit}
          >
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
