import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Smart Mock Interview Platform',
  description: 'AI-Powered interview preparation for students',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="glow-mesh" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
