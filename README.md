# Unblot

An anonymous poetry-sharing platform where poets can create, discover, and engage with poetry without revealing their identity. Built with vanilla JavaScript and powered by Supabase.

## Features

### Anonymous Poetry Creation
- **Create & Edit Poems**: Write and edit your poetry with a clean, distraction-free interface
- **Rich Formatting**: Support for tags and metadata to organize your work
- **My Poems**: Personal collection of all your published poems
- **History**: Track your reading history and revisit poems you've enjoyed
- **Complete Anonymity**: All poets appear anonymous to maintain privacy and focus on the art

### Community Engagement
- **Likes**: Show appreciation for poems you enjoy
- **Comments**: Engage with other anonymous poets through thoughtful discussions
- **Liked Poems**: Access all poems you've liked in one place

### Discovery
- **Trending**: Discover popular poems based on community engagement
- **Discover**: Search and explore the entire poetry collection
- **Collections**: Browse curated collections of poetry
- **Search**: Find poems by title, content, or tags
- **Daily Prompts**: Get inspired with fresh writing prompts

### Platform Management
- **Authentication**: Secure but anonymous user accounts
- **Admin Panel**: Content moderation and platform management

## Getting Started

Unblot is live and accessible at: **[www.unblot.app](https://www.unblot.app)**

Simply visit the website to start reading, writing, and sharing poetry anonymously. No installation required.

### For Developers

If you want to contribute or run your own instance:

1. Clone the repository:
```bash
git clone https://github.com/yourusername/unblot.git
cd unblot
```

2. Configure environment variables (do not commit env files):
   - Set these variables in your deployment environment:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `ADMIN_USER_IDS` (comma-separated UUIDs)
   - Vercel runs `node scripts/generate-runtime-env.mjs` during build to generate runtime `env.js` and `env.loader.js`.
   - Keep `.env`, `env.js`, and `env.loader.js` out of git.

3. Set up Supabase database with the following tables:
   - `poems` - Store poetry content and metadata
   - `comments` - User comments on poems
   - `likes` - Track poem likes
   - `prompts` - Daily writing prompts

4. Deploy to Vercel or serve locally

## Project Structure

```
unblot/
├── index.html              # Main HTML file with UI layout
├── main.js                 # Application entry point and routing
├── router.js               # Client-side routing logic
├── auth.js                 # Authentication and user management
├── poems.js                # Poem CRUD operations
├── comments.js             # Comment functionality
├── likes.js                # Like/unlike functionality
├── dom.js                  # DOM element references
├── utils.js                # Utility functions
├── env.js                  # Environment configuration
├── env.loader.js           # Environment variable loader
├── assets/                 # Static assets (images, icons)
├── utils/
│   ├── supabase.js        # Supabase client configuration
│   └── imageExport.js     # Image export utilities
└── views/
    ├── home.js            # Home feed view
    ├── discover.js        # Discovery page
    ├── trending.js        # Trending poems
    ├── collections.js     # Curated collections
    ├── myPoems.js         # User's poems
    ├── addPoem.js         # Poem creation
    ├── editPoem.js        # Poem editing
    ├── viewPoem.js        # Single poem view
    ├── liked.js           # Liked poems
    ├── history.js         # Reading history
    ├── notifications.js   # User notifications
    ├── admin.js           # Admin panel
    ├── login.js           # Login page
    ├── register.js        # Registration page
    └── reset.js           # Password reset
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Fonts**: EB Garamond, Inter, Playfair Display, Quicksand
- **Architecture**: Single Page Application (SPA) with hash routing

## Key Features Explained

### Anonymous Authentication
The app uses Supabase Auth for secure authentication while keeping all users anonymous. User sessions are cached to minimize API calls and improve performance. All poets appear simply as "Poet" to maintain privacy and shift focus to the poetry itself.

### Real-time Updates
Leverages Supabase real-time subscriptions for live updates to poems, comments, and likes.

### Responsive Design
Fully responsive layout with glassmorphism effects and smooth animations for a modern user experience.

### Dark Mode Support
Built-in dark mode with CSS custom properties for seamless theme switching.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## Contact

For questions or support, please open an issue in the GitHub repository.

