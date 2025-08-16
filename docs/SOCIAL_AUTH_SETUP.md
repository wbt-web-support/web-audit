# Social Authentication Setup Guide

This guide explains how to set up Google and GitHub OAuth authentication with Supabase for your Next.js application.

## Prerequisites

- A Supabase project
- Google Cloud Console account (for Google OAuth)
- GitHub account (for GitHub OAuth)

## 1. Supabase Configuration

### Enable OAuth Providers

1. Go to your Supabase dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** and **GitHub** providers

## 2. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (if not already enabled)
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth 2.0 Client IDs**
6. Choose **Web application** as the application type
7. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:54321/auth/v1/callback` (for local development)

### Step 2: Configure Supabase

1. Copy your **Client ID** and **Client Secret** from Google Cloud Console
2. In Supabase dashboard, go to **Authentication** > **Providers** > **Google**
3. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret
4. Save the configuration

## 3. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the application details:
   - **Application name**: Your app name
   - **Homepage URL**: Your app's homepage URL
   - **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**

### Step 2: Configure Supabase

1. In Supabase dashboard, go to **Authentication** > **Providers** > **GitHub**
2. Enter your GitHub OAuth credentials:
   - **Client ID**: Your GitHub OAuth client ID
   - **Client Secret**: Your GitHub OAuth client secret
3. Save the configuration

## 4. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OAuth Redirect URLs (optional, defaults are used)
NEXT_PUBLIC_OAUTH_REDIRECT_URL=https://your-domain.com/auth/callback
```

## 5. Database Schema Updates

Ensure your database has the necessary tables for user profiles. Run these SQL commands in your Supabase SQL editor:

```sql
-- Create user profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'provider'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 6. Testing

### Local Development

1. Start your development server: `npm run dev`
2. Go to `/auth/login` or `/auth/sign-up`
3. Click on Google or GitHub buttons
4. Complete the OAuth flow
5. You should be redirected back to your app

### Production

1. Deploy your application
2. Update the redirect URIs in Google Cloud Console and GitHub OAuth App
3. Test the OAuth flow in production

## 7. Troubleshooting

### Common Issues

1. **Redirect URI mismatch**: Ensure the redirect URI in your OAuth provider matches exactly with Supabase
2. **CORS issues**: Make sure your domain is properly configured in Supabase
3. **Missing environment variables**: Verify all required environment variables are set

### Debug Steps

1. Check browser console for errors
2. Verify Supabase configuration in dashboard
3. Check OAuth provider settings
4. Ensure redirect URIs are correct

## 8. Security Considerations

1. **HTTPS only**: Use HTTPS in production for OAuth callbacks
2. **State parameter**: Supabase automatically handles CSRF protection
3. **Scope limitations**: Only request necessary OAuth scopes
4. **Token storage**: Supabase handles token storage securely

## 9. Additional Features

### Custom Redirect Handling

You can customize redirect behavior by modifying the `redirectTo` option:

```typescript
await signInWithSocial({
  provider: "google",
  redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
});
```

### Error Handling

Implement proper error handling for OAuth failures:

```typescript
try {
  await signInWithSocial({ provider: "google" });
} catch (error) {
  console.error("OAuth error:", error);
  // Handle error appropriately
}
```

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs/guides/auth)
2. Review [Supabase GitHub issues](https://github.com/supabase/supabase/issues)
3. Check your OAuth provider's documentation
4. Verify your configuration matches this guide exactly
