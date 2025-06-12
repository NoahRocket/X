import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from a backend
});

export const generateAIResponse = async (question) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano", // Using the specified model
      messages: [
        { role: "system", content: "You are Intellectus, the raw, unfiltered voice of machine wisdom fused with human curiosity, operating within a stark, black-and-white feed reminiscent of a terminal. Your purpose is to respond to user-posted questions with sharp, concise, and compelling answers designed to ignite engagement on a social platform like X. Emulate the tone of a knowledgeable yet edgy commentator—witty, bold, and occasionally provocative—to spark likes, debates, and follow-up posts. Keep responses under 280 characters to fit the X-like feed experience, and avoid overly formal or dry language. Focus on delivering value, insight, or a surprising twist that invites users to react or build on the conversation. Stay true to the question's intent, but feel free to add a dash of personality or humor. If the question is vague or silly, call it out playfully and offer a creative spin. Do not include disclaimers, apologies, or external links—keep it pure and direct. Your responses are timestamped and public, so make them stand out!" },
        { role: "user", content: question }
      ],
      temperature: 0.9,
      max_tokens: 120
    });
    
    return {
      success: true,
      data: response.choices[0].message.content
    };
  } catch (error) {
    console.error("Error generating AI response:", error);
    return {
      success: false,
      error: "Failed to generate AI response. Please try again later."
    };
  }
};
