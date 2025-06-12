# Intellectus - Installation Guide

This guide will walk you through setting up the Intellectus platform on your local environment.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account
- OpenAI API key

## Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/intellectus.git
cd intellectus
```

## Step 2: Install dependencies

```bash
npm install
```

## Step 3: Set up environment variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

### Setting up Supabase

1. Create a new project in [Supabase](https://supabase.io)
2. Go to Settings > API in your Supabase dashboard
3. Copy the `URL` and `anon public` key to your `.env` file
4. Navigate to the SQL Editor in the Supabase dashboard
5. Run the SQL commands from `supabase/schema.sql` to set up your database schema

### Setting up OpenAI

1. Create an account on [OpenAI](https://openai.com)
2. Navigate to API Keys in your account dashboard
3. Create a new API key and copy it to your `.env` file

## Step 4: Start the development server

```bash
npm start
```

Your application should now be running at http://localhost:3000.

## Step 5: Building for production

```bash
npm run build
```

This will create a `build` folder with production-ready files.

## Step 6: Deploying to Netlify

1. Create a new site on [Netlify](https://netlify.com)
2. Connect your GitHub repository or upload the build folder
3. Set up the environment variables in the Netlify dashboard
4. Deploy your site

## Troubleshooting

- **Authentication issues**: Make sure your Supabase URL and anon key are correct.
- **OpenAI errors**: Verify your API key and check that your OpenAI account has sufficient credits.
- **Database errors**: Check the Supabase dashboard for any error logs or issues with your database.

## Additional Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Supabase Documentation](https://supabase.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
