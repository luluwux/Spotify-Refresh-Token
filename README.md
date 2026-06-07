# Spotify Refresh Token Getter

A modern web application designed to help you easily and securely obtain persistent Spotify Refresh Tokens for your hobby projects, integrations, and Discord bots. The application supports both the Authorization Code Flow with PKCE and the Standard Authorization Code Flow.

## Features

- **Bilingual Support:** Switch instantly between English and Turkish languages.
- **Secure PKCE Flow:** Authorize via client-side Proof Key for Code Exchange (PKCE) without exposing your Client Secret.
- **Standard Flow:** Fall back to the traditional Client ID and Client Secret combination when required.
- **Granular Scope Management:** Select individual Spotify permission scopes or toggle entire categories effortlessly.
- **Privacy Focused:** Your Client Secret is never stored in localStorage; it is only kept in sessionStorage for the duration of your active tab. Client ID and retrieved tokens can be optionally remembered locally.
- **Modern Interface:** Built with Tailwind CSS and Shadcn UI components featuring a dark-themed glassmorphism layout.

## Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Components:** Radix UI & Shadcn UI
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Hosting:** Vercel

## Installation and Setup

Follow these steps to run the project locally:

1. Clone the repository:

```bash
git clone <repository-url>
cd Spotify-Refresh-Token
```

2. Install the project dependencies:

```bash
npm install
```

3. Launch the local development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`.

## Deployment

This project is configured for seamless deployment on **Vercel**.

To deploy your own instance:

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project into your Vercel dashboard.
3. Vercel will automatically detect the Vite configuration and handle the build process.
4. **Important:** Remember to add your production Vercel deployment URL (e.g., `https://your-app.vercel.app`) to the **Redirect URIs** section in your Spotify Developer Dashboard.

## How to Use

1. **Setup Spotify Developer Dashboard:**
   - Go to the [Spotify Developer Portal](https://developer.spotify.com/dashboard) and create a new application.
   - Open your application settings and add your exact application URL (e.g., `http://localhost:5173` for local testing or your production Vercel URL) to the **Redirect URIs** field, then save.

2. **Configure the App:**
   - Choose your preferred authentication method (PKCE Flow is recommended).
   - Enter the **Client ID** from your Spotify Dashboard. If you use the Standard Flow, you must also provide the **Client Secret**.
   - Check the specific permission scopes required for your implementation.

3. **Generate Tokens:**
   - Click **Login & Connect with Spotify**.
   - Log in on the official Spotify authorization page and approve the permissions.
   - Once redirected back, copy your persistent **Refresh Token** and temporary **Access Token** directly from the UI panel.
