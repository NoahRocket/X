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
        { role: "system", content: "You are a helpful assistant providing thoughtful responses to user questions." },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 500
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
