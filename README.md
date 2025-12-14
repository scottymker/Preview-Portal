# Preview Portal

A client preview portal for sharing website mockups, collecting inline feedback, and delivering brand assets.

## Features

- **Unique Preview Links** - Each project gets a private shareable link (`/p/abc123xyz`)
- **Inline Comments** - Clients can click anywhere to leave pinned feedback
- **Responsive Preview** - Toggle between desktop, tablet, and mobile views
- **Brand Assets** - Attach downloadable brand kits to projects
- **Admin Dashboard** - Manage all projects from one place

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor**
3. Paste the contents of `supabase-schema.sql` and run it
4. Go to **Settings > API** and copy your:
   - Project URL
   - Anon/Public key

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=your-secure-password
```

### 3. Install & Run Locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Set your custom domain `preview.thedevside.com` in Vercel's domain settings.

## Usage

### Creating a Project

1. Go to `/admin`
2. Enter admin password
3. Click "New Project"
4. Fill in:
   - **Project Name** - Display name for the client
   - **Preview URL** - URL of the mockup site (can be localhost, Vercel preview, etc.)
   - **Brand Assets URL** - Link to downloadable brand kit (optional)
   - **Client Info** - Name and email for reference

### Sharing with Clients

After creating a project, you'll get a unique link like:

```
https://preview.thedevside.com/p/abc123xyz
```

Share this link with your client. They can:
- View the site in different device sizes
- Click anywhere to leave comments
- Download brand assets

### Managing Feedback

Comments appear in the sidebar and as pins on the preview. You can:
- Click a pin to see the comment
- Mark comments as resolved
- Delete comments

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Custom CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Icons**: Lucide React

## Project Structure

```
preview-portal/
├── src/
│   ├── pages/
│   │   ├── HomePage.jsx      # Landing page
│   │   ├── PreviewPage.jsx   # Client preview with comments
│   │   └── AdminPage.jsx     # Project management
│   ├── lib/
│   │   └── supabase.js       # Database client & functions
│   ├── styles/
│   │   └── index.css         # Global styles
│   └── App.jsx               # Router setup
├── supabase-schema.sql       # Database schema
├── vercel.json               # Vercel routing config
└── .env.example              # Environment template
```

## License

MIT
