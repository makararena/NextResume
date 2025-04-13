# AI Resume Builder

A modern resume builder application built with Next.js 15, Prisma, and OpenAI integration to help users create professional resumes easily.

## Features

- AI-powered resume generation and optimization
- Customizable resume templates
- Resume management with grouping and organization
- PDF export functionality
- Secure user authentication with Clerk
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, Radix UI
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Clerk
- **File Storage**: Vercel Blob Storage
- **AI Integration**: OpenAI
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Clerk account
- OpenAI API key
- Vercel account (for deployment)

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-resume-builder.git
   cd ai-resume-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in all required environment variables in `.env.local`

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Manual Deployment

1. Push your code to GitHub.
2. Connect your GitHub repository to Vercel.
3. Configure environment variables in the Vercel dashboard.
4. Deploy the application.

### Option 2: Using the Deployment Script

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

## Environment Variables

See `.env.example` for all required environment variables.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for providing the AI capabilities
- Vercel for hosting and deployment
- Clerk for authentication services
- All open-source projects that made this possible
