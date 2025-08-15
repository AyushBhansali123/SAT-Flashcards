# SAT Flashcards 📚

A production-ready web application for studying SAT vocabulary through flashcards, spaced repetition, and interactive quizzes. Built with modern web technologies and optimized for both desktop and mobile use.

## ✨ Features

### 🎯 Core Study Features
- **Interactive Flashcards** - Clean, intuitive cards with definitions and examples
- **Spaced Repetition** - SM-2 algorithm for optimal learning efficiency
- **Multiple Quiz Modes** - Test your knowledge with various question types
- **Progress Tracking** - Detailed statistics and learning analytics
- **Star System** - Bookmark difficult words for focused review

### 🔐 User Management
- **Multiple Auth Options** - Google OAuth, Email, and Anonymous sessions
- **Personal Progress** - Track learning across devices when signed in
- **Admin Panel** - Import management and system administration

### 🎨 User Experience
- **Dark/Light Theme** - Automatic system detection with manual override
- **Progressive Web App** - Install on mobile devices for offline access
- **Responsive Design** - Optimized for all screen sizes
- **Accessibility** - WCAG AA compliant with keyboard navigation

### 📊 Advanced Features
- **Smart Study Sessions** - Prioritizes due reviews and new words
- **Difficulty Levels** - 5-point scale for word complexity
- **Search & Filter** - Find words by difficulty, progress, or text
- **Offline Support** - Core functionality works without internet

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd SAT-Flashcards
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Initialize database**
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

4. **Import vocabulary**
   ```bash
   npm run import-words
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to start studying!

## 📖 Words.txt Format

The application imports vocabulary from `words.txt` in the project root. Format each entry as:

```
Word — definition — example sentence (optional)
```

Examples:
```
Abate — to lessen in intensity — The storm suddenly abated.
Aberration — a departure from what is normal — His angry outburst was an aberration.
```

### Supported Separators
- `—` (em dash) - recommended
- `-` (hyphen)
- `:` (colon)

### Parts of Speech
Definitions can include parts of speech prefixes:
- `n.` for nouns
- `v.` for verbs  
- `adj.` for adjectives
- `adv.` for adverbs

## 🛠 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run test` | Run unit tests |
| `npm run e2e` | Run E2E tests |
| `npm run import-words` | Import words from words.txt |
| `npm run seed` | Seed database with sample data |
| `npm run analyze` | Analyze bundle size |

## 🏗 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Beautiful SVG icons

### Backend & Database
- **Prisma ORM** - Type-safe database client
- **SQLite** (dev) / **PostgreSQL** (prod) - Database
- **NextAuth.js** - Authentication system
- **React Query** - Server state management

### Tools & Services
- **Vercel** - Deployment platform
- **GitHub Actions** - CI/CD pipeline
- **Prisma Studio** - Database management
- **Bundle Analyzer** - Performance optimization

## 📱 PWA Features

The app is a Progressive Web App with:
- **Offline support** - Core features work without internet
- **Install prompt** - Add to home screen on mobile
- **Service Worker** - Background sync and caching
- **App shortcuts** - Quick access to key features

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
# For development: "file:./dev.db"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Provider (optional)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="user@example.com"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@example.com"

# Admin
ADMIN_EMAIL="admin@example.com"
```

### Admin Access

Set `ADMIN_EMAIL` to your email address to gain admin privileges. Admin users can:
- Access the admin panel at `/admin`
- Re-import words from words.txt
- View system statistics
- Access Prisma Studio

## 🧠 Spaced Repetition Algorithm

The app uses a variant of the SM-2 (SuperMemo 2) algorithm:

### Rating Scale (0-5)
- **0** - Complete blackout, didn't know at all
- **1** - Incorrect, but recognized on second try
- **2** - Incorrect, but remembered with hint
- **3** - Correct response with difficulty
- **4** - Correct response with hesitation  
- **5** - Perfect response

### Learning Progression
1. **New words** start with 1-day intervals
2. **Successful reviews** increase intervals exponentially
3. **Failed reviews** reset to 1-day intervals
4. **Ease factor** adjusts based on performance history
5. **Words become "learned"** after consistent success

## 🎯 Study Strategies

### Effective Learning Tips
1. **Daily consistency** - Study a little each day rather than cramming
2. **Review due words first** - Prioritize spaced repetition reviews
3. **Use example sentences** - Context helps with retention
4. **Star difficult words** - Focus extra attention on challenging vocabulary
5. **Take quizzes regularly** - Test recall in different formats

### Difficulty Levels
- **Level 1-2** - Common words, basic vocabulary
- **Level 3** - Intermediate SAT words
- **Level 4-5** - Advanced, complex vocabulary

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
docker build -t sat-flashcards .
docker run -p 3000:3000 sat-flashcards
```

### Self-Hosted
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Start with: `npm start`

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run e2e
```

### Test Coverage
- Authentication flows
- Spaced repetition algorithm
- Word import/export
- API endpoints
- UI components

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SuperMemo** - For the SM-2 spaced repetition algorithm
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **Vercel** - For the excellent deployment platform

---

**Happy studying! 🎓** Master those SAT vocabulary words with confidence.