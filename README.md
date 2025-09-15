# 🚀 AgenitiX

**AI-powered workflow automation platform built with Next.js, Convex, and TypeScript.**

AgenitiX is a comprehensive workflow automation platform that enables users to create, manage, and execute complex AI-driven workflows. Built with modern web technologies, it provides a visual node-based interface for creating automated processes.

## ✨ Features

- **🎯 Visual Workflow Builder** - Drag-and-drop interface for creating workflows
- **🤖 AI Integration** - Built-in AI agents and LLM support
- **📧 Email Automation** - Gmail integration and email workflow capabilities
- **📊 Data Processing** - Google Sheets integration and data manipulation
- **🔐 Authentication** - Secure user authentication with magic links
- **📱 PWA Support** - Progressive Web App capabilities
- **🛡️ Bot Protection** - Built-in Anubis protection system
- **📈 Analytics** - Comprehensive usage tracking and monitoring

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (real-time database and functions)
- **Styling**: Tailwind CSS, Radix UI
- **Authentication**: Convex Auth with magic links
- **Email**: Resend, Gmail API
- **Monitoring**: Sentry
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Convex account
- Resend account (for emails)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/agenitix/agenitix.git
   cd agenitix
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Set up Convex**

   ```bash
   npx convex dev
   # Follow the prompts to create a new Convex project
   ```

5. **Start development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env.local` and configure:

#### Core Settings

- `NEXT_PUBLIC_APP_URL` - Your application URL
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `CONVEX_DEPLOYMENT` - Convex deployment name

#### Authentication

- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `AUTH_RESEND_KEY` - Resend API key for magic links

#### Email Services

- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - From email address

#### Optional Services

- `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` - Gmail integration
- `GOOGLE_SHEETS_API_KEY` - Google Sheets integration
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

See `.env.example` for complete list of environment variables.

## 🏗️ Project Structure

```
agenitix/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── nodes/             # Workflow node components
│   └── auth/              # Authentication components
├── convex/                # Convex backend functions
├── features/              # Feature-specific code
│   └── business-logic-modern/  # Core business logic
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── utils/                 # Helper utilities
```

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev                  # Start development server
pnpm dev:setup           # Set up Convex development
pnpm dev:parallel        # Run Convex and frontend in parallel

# Building
pnpm build               # Build for production
pnpm build:convex       # Deploy Convex functions
pnpm build:frontend     # Build Next.js app

# Database
pnpm db:seed            # Seed database with test data
pnpm db:backup          # Backup database
pnpm db:restore         # Restore database

# Testing
pnpm test               # Run tests
pnpm test:convex        # Test Convex functions

# Code Quality
pnpm lint               # Lint code
pnpm lint:fix           # Fix linting issues
pnpm format             # Format code
```

### Development Workflow

1. **Start Convex development**

   ```bash
   pnpm convex:dev
   ```

2. **Start frontend development**

   ```bash
   pnpm dev:frontend
   ```

3. **Access Convex dashboard**
   ```bash
   pnpm convex:dashboard
   ```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**

   ```bash
   vercel
   ```

2. **Set environment variables**
   Add all required environment variables in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build the application**

   ```bash
   pnpm build
   ```

2. **Deploy Convex**

   ```bash
   pnpm convex:deploy
   ```

3. **Deploy frontend**
   Deploy the `.next` folder to your hosting provider

## 📚 Documentation

- [API Documentation](docs/api/) - API endpoints and usage
- [Node Documentation](documentation/nodes/) - Available workflow nodes
- [Authentication Guide](docs/AUTH_COLLISION_PREVENTION.md) - Auth setup
- [OAuth Setup](docs/OAUTH_CORS_SETUP.md) - Gmail OAuth configuration

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/agenitix/agenitix/issues)
- **Discussions**: [GitHub Discussions](https://github.com/agenitix/agenitix/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/agenitix/agenitix/wiki)

## 🙏 Acknowledgments

- [Convex](https://convex.dev) - Real-time backend platform
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Radix UI](https://radix-ui.com) - UI component library

---

**Made with ❤️ by AgenitiX**

