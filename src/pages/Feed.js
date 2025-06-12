import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { generateAIResponse } from '../utils/openaiClient';
import QuestionForm from '../components/QuestionForm';
import PostCard from '../components/PostCard';
import '../styles/Feed.css';

const Feed = ({ session }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingQuestions, setRemainingQuestions] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Fetch all posts
  useEffect(() => {
    fetchPosts();

    // Subscribe to new posts
    const postsSubscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts' 
      }, (payload) => {
        setPosts(prevPosts => [payload.new, ...prevPosts]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
    };
  }, []);

  // Get remaining questions count if user is logged in
  useEffect(() => {
    if (session) {
      checkRemainingQuestions();
    }
  }, [session, checkRemainingQuestions]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts with user details and likes count
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:user_id (username),
          likes:post_likes (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the posts data
      const formattedPosts = data.map(post => ({
        ...post,
        username: post.users?.username || 'Anonymous',
        like_count: post.likes.length > 0 ? post.likes[0].count : 0
      }));

      setPosts(formattedPosts);
    } catch (error) {
      setError(`Error fetching posts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkRemainingQuestions = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('questions_asked_today, last_question_date')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      // Check if last_question_date is from today
      let questionsAskedToday = data.questions_asked_today || 0;
      const lastQuestionDate = data.last_question_date ? new Date(data.last_question_date) : null;
      const today = new Date();
      
      if (lastQuestionDate && 
          (lastQuestionDate.getDate() !== today.getDate() || 
          lastQuestionDate.getMonth() !== today.getMonth() ||
          lastQuestionDate.getFullYear() !== today.getFullYear())) {
        // Reset the count if last question was not from today
        questionsAskedToday = 0;
        
        // Update the database
        await supabase
          .from('users')
          .update({
            questions_asked_today: 0,
            last_question_date: null
          })
          .eq('id', session.user.id);
      }

      setRemainingQuestions(100 - questionsAskedToday);
    } catch (error) {
      console.error('Error checking remaining questions:', error);
    }
  };

  const handleSubmitQuestion = async (question) => {
    if (!session) return;
    if (!question.trim()) return;
    
    try {
      setSubmitLoading(true);
      
      // Generate AI response
      const aiResult = await generateAIResponse(question);
      
      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }
      
      const response = aiResult.data;

      // Create post in database
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          user_id: session.user.id,
          question,
          response,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Update user's daily question count
      await supabase
        .from('users')
        .update({
          questions_asked_today: supabase.rpc('increment_questions'),
          last_question_date: new Date().toISOString()
        })
        .eq('id', session.user.id);

      // Update the remaining questions count
      checkRemainingQuestions();
      
      // Refresh the feed
      fetchPosts();
    } catch (error) {
      setError(`Error submitting question: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!session) return;
    
    try {
      // Check if the user already liked this post
      const { data: existingLike, error: likeCheckError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', session.user.id)
        .single();
      
      if (likeCheckError && likeCheckError.code !== 'PGRST116') {
        throw likeCheckError;
      }

      if (existingLike) {
        // Unlike the post
        const { error: unlikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) throw unlikeError;
      } else {
        // Like the post
        const { error: likeError } = await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: session.user.id
          }]);

        if (likeError) throw likeError;
      }

      // Refresh the posts to update like count
      fetchPosts();
    } catch (error) {
      setError(`Error liking post: ${error.message}`);
    }
  };

  return (
    <div className="feed-container">
      {session && (
        <div className="question-section">
          <QuestionForm 
            onSubmit={handleSubmitQuestion} 
            loading={submitLoading}
            remainingQuestions={remainingQuestions}
          />
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      <div className="feed-header">
        <h1>FEED</h1>
        <button onClick={fetchPosts} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {loading ? (
        <div className="loading-message">Loading posts...</div>
      ) : posts.length > 0 ? (
        <div className="posts-container">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthenticated={!!session}
              onLike={() => handleLike(post.id)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-feed">No posts yet. Be the first to ask a question!</div>
      )}
    </div>
  );
};

export default Feed;
