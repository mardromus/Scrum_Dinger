import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface LoginProps {
  onLogin: () => void;
}

const GoogleIcon: React.FC = () => (
    <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.226-11.283-7.584l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

export const LandingPage: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary">
      <div className="container mx-auto px-6 pt-16 pb-12 text-center">
        <div className="flex justify-center mb-6">
          <LogoIcon className="w-20 h-20" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">ScrumDinger</span>
        </h1>
        <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-8">A Product By Mardromus</p>

        <p className="text-lg md:text-xl text-light-text-secondary dark:text-dark-text-secondary max-w-3xl mx-auto mb-10">
          The intelligent, automated platform to make your daily stand-ups faster, more focused, and actually productive.
        </p>
        <button
          onClick={onLogin}
          className="bg-white text-gray-700 font-semibold py-3 px-8 rounded-lg inline-flex items-center justify-center shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
        >
          <GoogleIcon />
          Sign in with Google to Get Started
        </button>
      </div>

      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why ScrumDinger?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-3">Automated Timekeeping</h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">Keep everyone on track with automatic speaker timers. No more long-winded updates.</p>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-3">AI-Powered Summaries</h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">Get instant, actionable summaries of your meetings, powered by the Gemini API.</p>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-3">Seamless Workflow</h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">From scheduling to summaries, manage your entire scrum process in one place.</p>
          </div>
        </div>
      </div>
    </div>
  );
};