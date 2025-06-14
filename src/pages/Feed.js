import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { generateAIResponse, generateTags } from '../utils/openaiClient';
import QuestionForm from '../components/QuestionForm';
import PostCard from '../components/PostCard';
import '../styles/Feed.css';

const Feed = ({ session }) => {
  console.log('Feed component render/re-render');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'best'
  console.log('Current sortOrder state:', sortOrder);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingQuestions, setRemainingQuestions] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [userLikes, setUserLikes] = useState(new Set()); // Stores post IDs liked by the current user
  const [selectedTag, setSelectedTag] = useState(null);

  const fetchPosts = useCallback(async () => {
    console.log('fetchPosts called with sortOrder:', sortOrder);
    try {
      setLoading(true);

      let query = supabase
        .from('posts')
        .select(`
          *,
          users:user_id (username),
          post_likes_agg:post_likes(count)
        `)
        .order('created_at', { ascending: false });

      const { data: postsData, error: postsError } = await query;
      // The console.log below that uses sortOrder already logs postsData, so we can comment this one out or ensure it uses postsData.
      // console.log('Raw data from Supabase (initial fetch):', postsData);
      if (postsError) throw postsError;

      // Fetch likes for the current user if logged in
      let currentUserLikedPostIds = new Set();
      if (session && session.user) {
        const { data: likedPostsData, error: likedPostsError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', session.user.id);

        if (likedPostsError) {
          console.error('Error fetching user likes:', likedPostsError);
        } else if (likedPostsData) {
          likedPostsData.forEach(like => currentUserLikedPostIds.add(like.post_id));
          setUserLikes(currentUserLikedPostIds); // Update state for optimistic updates
        }
      }
      // console.log('Raw data from Supabase (default sort: newest):', postsData); // This was the first one, now corrected
      console.log('Raw data from Supabase for sortOrder (' + sortOrder + '):', postsData); // Corrected to postsData

      // Format the posts data, now including user_has_liked
      const formattedPosts = postsData.map((post) => ({
        ...post,
        username: post.users?.username || 'Anonymous',
        // Access the count from the post_likes_agg object
        like_count: post.post_likes_agg && post.post_likes_agg.length > 0 ? post.post_likes_agg[0].count : 0,
        user_has_liked: currentUserLikedPostIds.has(post.id)
      }));

      if (sortOrder === 'best') {
        console.log('Applying client-side sort for "best"');
        formattedPosts.sort((a, b) => {
          // Sort by like_count descending
          if (b.like_count !== a.like_count) {
            return b.like_count - a.like_count;
          }
          // If like_counts are equal, sort by created_at descending (newer first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }
      // For 'newest', it's already sorted by created_at desc by Supabase query

      setPosts(formattedPosts);
      console.log('Formatted posts set to state for sortOrder (' + sortOrder + '):', formattedPosts);
    } catch (error) {
      setError(`Error fetching posts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [sortOrder, session]); // Add session as a dependency for fetching user-specific likes

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
  }, [fetchPosts]); // fetchPosts is now a dependency

  // Callback to check remaining questions, stable across renders
  const checkRemainingQuestions = useCallback(async () => {
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

      if (
        lastQuestionDate &&
        (lastQuestionDate.getDate() !== today.getDate() ||
          lastQuestionDate.getMonth() !== today.getMonth() ||
          lastQuestionDate.getFullYear() !== today.getFullYear())
      ) {
        // Reset the count if last question was not from today
        questionsAskedToday = 0;

        // Update the database
        await supabase
          .from('users')
          .update({
            questions_asked_today: 0,
            last_question_date: null,
          })
          .eq('id', session.user.id);
      }

      setRemainingQuestions(100 - questionsAskedToday);
    } catch (error) {
      console.error('Error checking remaining questions:', error);
    }
  }, [session]);

  // Get remaining questions count if user is logged in
  useEffect(() => {
    if (session) {
      checkRemainingQuestions();
    }
  }, [session, checkRemainingQuestions]);

  const handleSubmitQuestion = async (question) => {
    if (!session || !session.user || !session.user.id) {
      console.error('handleSubmitQuestion: Attempted to submit question without a valid session, user, or user ID.', session);
      setError('Authentication error. Please log out and log back in to post a question.');
      return;
    }
    if (!question.trim()) return;

    setSubmitLoading(true);
    setError(null);

    try {
      // Generate AI response and tags in parallel
      const [aiResult, tagsResult] = await Promise.all([
        generateAIResponse(question),
        generateTags(question)
      ]);

      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }

      if (!tagsResult.success) {
        console.error('Could not generate tags:', tagsResult.error);
        // We can still proceed without tags
      }

      const response = aiResult.data;
      const tags = tagsResult.success ? tagsResult.data : [];

      // Create post in the database
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert([{
          user_id: session.user.id,
          question,
          response,
          tags, // Add tags to the insert object
          created_at: new Date().toISOString()
        }])
        .select('*, users:user_id (username)')
        .single();

      if (error) throw error;

      // Optimistically update the UI
      const formattedPost = {
        ...newPost,
        username: newPost.users?.username || 'Anonymous',
        like_count: 0,
        user_has_liked: false,
      };
      setPosts(prevPosts => [formattedPost, ...prevPosts]);

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

    } catch (error) {
      setError(`Error submitting question: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter(post => post.tags && post.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  const handleTagClick = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Unselect if the same tag is clicked again
    } else {
      setSelectedTag(tag);
    }
  };

  const handleLike = async (postId) => {
    if (!session) return;

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      console.error('Post not found for liking:', postId);
      return;
    }

    const originalPost = posts[postIndex];
    const isCurrentlyLiked = originalPost.user_has_liked;
    const newLikeCount = isCurrentlyLiked ? originalPost.like_count - 1 : originalPost.like_count + 1;

    // Optimistic UI update
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.id === postId
          ? { ...p, user_has_liked: !isCurrentlyLiked, like_count: newLikeCount }
          : p
      )
    );
    // Update userLikes set optimistically as well
    setUserLikes(prevLikes => {
      const newLikes = new Set(prevLikes);
      if (isCurrentlyLiked) {
        newLikes.delete(postId);
      } else {
        newLikes.add(postId);
      }
      return newLikes;
    });

    try {
      if (isCurrentlyLiked) {
        // User is unliking the post
        const { error: unlikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);

        if (unlikeError) throw unlikeError;
      } else {
        // User is liking the post
        const { error: likeError } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: session.user.id }]);

        if (likeError) throw likeError;
      }
      // No need to call fetchPosts() here if optimistic update is sufficient and reliable.
      // If you want to ensure data consistency by re-fetching after every like/unlike:
      // fetchPosts(); 
    } catch (error) {
      setError(`Error liking post: ${error.message}`);
      // Revert optimistic update on error
      setPosts(currentPosts =>
        currentPosts.map(p =>
          p.id === postId
            ? { ...originalPost } // Revert to original post state before optimistic update
            : p
        )
      );
      setUserLikes(prevLikes => {
        const newLikes = new Set(prevLikes);
        // Revert based on the action that failed
        if (isCurrentlyLiked) { // Action was 'unlike', it failed, so post is still liked
          newLikes.add(postId);
        } else { // Action was 'like', it failed, so post is not liked
          newLikes.delete(postId);
        }
        return newLikes;
      });
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
        <div className="feed-controls">
          <div className="sort-options">
            <button 
              onClick={() => setSortOrder('newest')} 
              className={sortOrder === 'newest' ? 'active' : ''}
              disabled={loading}
            >
              Newest
            </button>
            <button 
              onClick={() => setSortOrder('best')} 
              className={sortOrder === 'best' ? 'active' : ''}
              disabled={loading}
            >
              Best
            </button>
          </div>
          <button onClick={fetchPosts} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {selectedTag && (
        <div className="active-filter-container">
          <div className="active-filter-tag">
            {selectedTag}
            <button onClick={() => setSelectedTag(null)} className="clear-filter-btn">
              &times;
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading-message">Loading posts...</div>
      ) : filteredPosts.length > 0 ? (
        <div className="posts-container">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthenticated={!!session}
              onLike={() => handleLike(post.id)}
              onTagClick={handleTagClick}
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
