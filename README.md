# Smart-Mock-Interview

An AI-powered technical interview platform that revolutionizes candidate assessment through automated, intelligent mock interviews. Built with Next.js, Firebase, and OpenAI's GPT-4 for comprehensive evaluation.

## 🚀 Features

- **Automated Interviews**: Conduct technical interviews across multiple domains (Java, Frontend, Data Science, etc.) and difficulty levels (Beginner to Expert)
- **Speech Recognition**: Real-time speech-to-text transcription for natural interview responses
- **AI Evaluation**: Advanced AI-powered assessment using GPT-4 for technical accuracy, communication clarity, and detailed feedback
- **User Authentication**: Secure Firebase-based authentication with email verification
- **Dashboard**: Personalized dashboard for managing interviews and viewing results
- **Results Analysis**: Comprehensive scoring with strengths, weaknesses, and follow-up questions
- **File Uploads**: Support for document uploads during interviews
- **Email Notifications**: Automated email notifications for interview results
- **Responsive Design**: Modern UI built with Tailwind CSS and Lucide icons

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **AI**: OpenAI GPT-4 Turbo
- **Email**: Resend
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Firebase project with authentication and Firestore enabled
- OpenAI API key
- Resend API key for email functionality

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-mock-interview
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
RESEND_API_KEY=your_resend_api_key
```

4. Configure Firebase Admin (for server-side operations):
Create a `firebase-admin-key.json` file in the root directory with your Firebase service account key.

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📖 Usage

1. **Sign Up/Login**: Create an account with your corporate email
2. **Dashboard**: Select your desired domain and difficulty level
3. **Interview**: Answer questions verbally - the system records and transcribes your responses
4. **Evaluation**: Receive instant AI-powered feedback and scoring
5. **Results**: View detailed analysis and improvement suggestions

## 🏗️ Project Structure

```
smart-mock-interview/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── evaluate/      # AI evaluation endpoint
│   │   ├── upload/        # File upload endpoint
│   │   └── email/         # Email notification endpoint
│   ├── dashboard/         # User dashboard
│   ├── interview/         # Interview interface
│   ├── profile/           # User profile
│   ├── results/           # Results display
│   └── page.js            # Landing page
├── components/            # Reusable React components
├── context/               # React context providers
├── lib/                   # Utility libraries
│   ├── data.js           # Interview questions and data
│   ├── firebase.js       # Firebase client config
│   └── firebaseAdmin.js  # Firebase admin config
├── public/                # Static assets
└── tmp/                   # Temporary files
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Contact

For questions or support, please contact the development team.

## 🚀 Deployment

Deploy easily on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

The application is optimized for Vercel's serverless environment and automatic scaling.
"# Smart-Mock-interview" 
