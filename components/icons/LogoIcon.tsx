import React from 'react';

// A simple, abstract logo for ScrumDinger
export const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradientIcon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="url(#logoGradientIcon)"/>
    <path d="M9.5 8C11.7091 8 13.5 9.79086 13.5 12C13.5 14.2091 11.7091 16 9.5 16C7.29086 16 5.5 14.2091 5.5 12C5.5 9.79086 7.29086 8 9.5 8Z" fill="white" className="dark:fill-dark-bg" opacity="0.9"/>
    <path d="M18.5 8C20.7091 8 22.5 9.79086 22.5 12C22.5 14.2091 20.7091 16 18.5 16H15.5C13.2909 16 11.5 14.2091 11.5 12C11.5 9.79086 13.2909 8 15.5 8H18.5Z" fill="white" className="dark:fill-dark-bg" opacity="0.9"/>
  </svg>
);
