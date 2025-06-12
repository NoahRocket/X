import React, { useState } from 'react';
import '../styles/QuestionForm.css';

const QuestionForm = ({ onSubmit, loading, remainingQuestions }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    onSubmit(question);
    setQuestion('');
  };

  return (
    <div className="question-form-container">
      <h2>ASK A QUESTION</h2>
      
      {typeof remainingQuestions === 'number' && (
        <div className="questions-remaining">
          {remainingQuestions > 0 ? (
            <span>{remainingQuestions} questions remaining today</span>
          ) : (
            <span className="limit-reached">Daily limit reached. Try again tomorrow.</span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to know?"
          disabled={loading || remainingQuestions === 0}
          required
        />
        <button 
          type="submit" 
          disabled={loading || !question.trim() || remainingQuestions === 0}
        >
          {loading ? 'Sending...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default QuestionForm;
