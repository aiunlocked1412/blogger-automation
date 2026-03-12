# Blogger Automation

AI-powered blog post automation for Google Blogger. Generate SEO-optimized content with Google Gemini AI, auto-attach images, schedule posts, and bulk publish - all from a sleek dark-mode web UI.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **AI Content Generation** - Generate long-form, SEO-optimized blog posts using Google Gemini 2.5 Flash Lite
- **SEO Scoring** - Real-time SEO analysis with actionable checks (title, meta, keywords, headings, word count)
- **Auto Images** - Fetch relevant images from Unsplash/Pexels and auto-inject into posts
- **Backlink Insertion** - Automatically insert natural backlinks to your money site within article content
- **Bulk Posting** - Generate and schedule multiple articles with configurable time intervals
- **Multi-Blog** - Post unique articles to multiple Blogger blogs simultaneously
- **Schedule Posts** - Set future publish dates using Blogger API native scheduling
- **Web UI** - Modern glassmorphism dark theme with animations, fully browser-based
- **Thai & English** - Full Thai language support for content generation

## Prerequisites

Before you begin, you'll need:

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Google Cloud Project** with Blogger API v3 enabled
3. **OAuth 2.0 Client ID** (Desktop app type) from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
4. **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)
5. **Unsplash Access Key** (optional) from [Unsplash Developers](https://unsplash.com/developers)
6. **Pexels API Key** (optional) from [Pexels API](https://www.pexels.com/api/)

## Installation

```bash
# Clone the repository
git clone https://github.com/aiunlocked1412/blogger-automation.git
cd blogger-automation

# Install dependencies
npm install
```

## Quick Start

### 1. Start the Web UI

```bash
npm run web
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 2. Configure Settings

Go to **Settings** page and enter:

| Setting | Where to Get |
|---------|-------------|
| Google Client ID | Google Cloud Console > Credentials > OAuth 2.0 Client (Desktop type) |
| Google Client Secret | Same as above |
| Gemini API Key | [Google AI Studio](https://aistudio.google.com/apikey) |
| Unsplash Access Key | [Unsplash Developers](https://unsplash.com/developers) (optional) |
| Pexels API Key | [Pexels API](https://www.pexels.com/api/) (optional) |

Click **Save All Settings**.

### 3. Connect Google Account

Click **Connect Google** button. A popup will open for Google OAuth consent. After authorizing, your Blogger blogs will auto-load in the dropdown.

### 4. Generate & Publish

1. Go to **AI Generate** page
2. Select your blog from the dropdown
3. Enter a topic/keyword
4. (Optional) Enter a Money Site URL for backlink insertion
5. Click **Generate Content**
6. Review the generated article and SEO score
7. Click **Publish Now**, **Save as Draft**, or **Schedule**

## Usage

### Web UI (Recommended)

```bash
npm run web
# Opens at http://localhost:3001
```

### CLI

```bash
# Authenticate
node src/index.js auth

# Generate content
node src/index.js generate "Your Topic Here"

# Post to Blogger
node src/index.js post "Your Topic Here"

# List recent posts
node src/index.js list

# List drafts
node src/index.js drafts
```

## Web UI Pages

### AI Generate
Generate a single article with customizable settings:
- **Topic/Keyword** - The main subject for your article
- **Money Site URL** - Auto-insert 2-3 natural backlinks in the content
- **Language** - Thai (default) or English
- **Word Count** - Target word count (default: 600)

### Bulk Post
Two modes for mass publishing:

**Schedule Bulk** - Generate N articles from one topic, each with unique content (different angles: beginner guide, advanced tips, case study, FAQ, etc.), scheduled at configurable intervals.

**Multi-Blog** - Generate unique articles and post to multiple Blogger blogs simultaneously (1 unique article per blog).

### Post / Schedule
Manual post editor with Markdown support. Write or paste content, set labels, and publish immediately or schedule for a future date.

### My Posts / Drafts
View, manage, and delete your published posts and drafts.

## Project Structure

```
blogger-automation/
├── config/
│   └── default.js          # Central config with live settings reload
├── src/
│   ├── index.js             # CLI entry point (commander)
│   ├── auth/
│   │   └── google-auth.js   # OAuth2 flow + token storage
│   ├── blogger/
│   │   └── blogger-api.js   # Blogger API v3 wrapper with retry
│   ├── content/
│   │   ├── ai-generator.js  # Gemini AI content generation
│   │   ├── file-loader.js   # Markdown/JSON file loader
│   │   └── templates.js     # HTML templates
│   ├── images/
│   │   └── image-service.js # Unsplash/Pexels image fetching
│   ├── scheduler/
│   │   └── scheduler.js     # Schedule date parsing
│   ├── seo/
│   │   └── seo-optimizer.js # SEO scoring & optimization
│   ├── utils/
│   │   ├── html-builder.js  # Markdown to HTML + image injection
│   │   └── logger.js        # Winston logger
│   └── web/
│       ├── server.js         # Express API server
│       └── public/
│           └── index.html    # Single-page web UI
├── content/
│   ├── posts/               # Pre-written Markdown posts
│   └── topics.json          # Topic queue for batch processing
├── data/                    # Runtime data (gitignored)
│   ├── settings.json        # User settings
│   └── tokens.json          # OAuth tokens
└── templates/
    └── blog-post.html       # HTML post template
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get current settings (secrets masked) |
| POST | `/api/settings` | Save settings |
| GET | `/api/auth/status` | Check authentication status |
| GET | `/api/auth/connect` | Start OAuth flow |
| POST | `/api/auth/disconnect` | Disconnect Google account |
| GET | `/api/blogs` | List user's Blogger blogs |
| POST | `/api/blogs/select` | Select active blog |
| POST | `/api/generate` | Generate AI content |
| POST | `/api/post` | Create/publish a post |
| POST | `/api/schedule` | Schedule a post |
| GET | `/api/posts` | List published posts |
| GET | `/api/drafts` | List draft posts |
| DELETE | `/api/posts/:id` | Delete a post |
| POST | `/api/seo/check` | Check SEO score |

## Google Cloud Setup Guide

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Blogger API v3**:
   - Go to APIs & Services > Library
   - Search "Blogger API v3"
   - Click Enable
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Desktop app**
   - Copy the **Client ID** and **Client Secret**
5. Configure OAuth consent screen if prompted

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Web Framework:** Express 5
- **AI:** Google Gemini 2.5 Flash Lite (`@google/generative-ai`)
- **APIs:** Google Blogger API v3, Unsplash, Pexels
- **CLI:** Commander.js
- **Logging:** Winston
- **Markdown:** Marked + gray-matter

## License

MIT

## Author

Made with AI by [AI Unlocked](https://github.com/aiunlocked1412)
