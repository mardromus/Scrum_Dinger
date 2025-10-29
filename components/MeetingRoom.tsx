import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scrum, Attendee, MeetingStatus } from '../types';
import { useTimer } from '../hooks/useTimer';
import { generateMeetingSummary } from '../services/geminiService';
import { UsersIcon } from '../context/UsersIcon';
import { ListIcon } from './icons/ListIcon';
import { LogoIcon } from './icons/LogoIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface MeetingRoomProps {
  scrum: Scrum;
  onMeetingEnd: (scrum: Scrum, talkTimes: Record<string, number>) => void;
}

const TimerDisplay: React.FC<{ timeLeft: number, speakerTime: number }> = ({ timeLeft, speakerTime }) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = (timeLeft / speakerTime) * 100;
    const strokeDashoffset = 283 * (1 - progress / 100);

    const isEnding = timeLeft <= 10;
    const isLowTime = timeLeft <= 20 && !isEnding;
    
    let timerColor = 'text-brand-primary';
    if(isEnding) timerColor = 'text-red-500';
    else if(isLowTime) timerColor = 'text-yellow-500';

    return (
        <div className={`relative w-64 h-64 sm:w-80 sm:h-80 transition-colors duration-500 ${isEnding ? 'animate-pulse-bg rounded-full' : ''}`}>
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-light-border dark:text-dark-border" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                    className={`transform -rotate-90 origin-center ${timerColor}`}
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s linear' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-6xl sm:text-8xl font-bold text-light-text-primary dark:text-dark-text-primary transition-colors duration-500`}>
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>
        </div>
    );
};


export const MeetingRoom: React.FC<MeetingRoomProps> = ({ scrum, onMeetingEnd }) => {
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [status, setStatus] = useState<MeetingStatus>(MeetingStatus.NOT_STARTED);
  const [transcripts, setTranscripts] = useState<Record<string, string[]>>({});
  const [currentUtterance, setCurrentUtterance] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [notes, setNotes] = useState(scrum.notes || '');
  const [talkTimes, setTalkTimes] = useState<Record<string, number>>(() => {
      const initialTimes: Record<string, number> = {};
      scrum.attendees.forEach(a => initialTimes[a.name] = 0);
      return initialTimes;
  });
  const [activeTab, setActiveTab] = useState<'transcript' | 'attendees' | 'notes'>('transcript');

  const speakerTime = scrum.timePerSpeakerSeconds;
  const { timeLeft, isActive, start, pause, reset, addTime } = useTimer(speakerTime);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const talkTimeIntervalRef = useRef<number | null>(null);


  const currentSpeaker = scrum.attendees[currentSpeakerIndex];
  const fullTranscript = Object.entries(transcripts)
        .map(([speaker, texts]) => `[${speaker}]:\n${(texts as string[]).join('\n')}`)
        .join('\n\n');

  useEffect(() => {
    if (transcriptContainerRef.current) {
        transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcripts, currentSpeaker]);

  // Effect to track speaker talk time
  useEffect(() => {
    if (status === MeetingStatus.IN_PROGRESS && currentSpeaker) {
        talkTimeIntervalRef.current = window.setInterval(() => {
            setTalkTimes(prev => ({
                ...prev,
                [currentSpeaker.name]: (prev[currentSpeaker.name] || 0) + 1
            }));
        }, 1000);
    } else {
        if (talkTimeIntervalRef.current) {
            clearInterval(talkTimeIntervalRef.current);
        }
    }
    return () => {
        if (talkTimeIntervalRef.current) {
            clearInterval(talkTimeIntervalRef.current);
        }
    };
  }, [status, currentSpeaker]);

  const handleNextSpeaker = useCallback(() => {
    if (currentSpeaker && currentUtterance.trim()) {
        const newUtterance = currentUtterance.trim();
        setTranscripts(prev => ({
            ...prev,
            [currentSpeaker.name]: [...(prev[currentSpeaker.name] || []), newUtterance]
        }));
    }
    setCurrentUtterance('');

    const nextIndex = currentSpeakerIndex + 1;
    if (nextIndex < scrum.attendees.length) {
      setCurrentSpeakerIndex(nextIndex);
      reset(speakerTime);
      start();
    } else {
      setStatus(MeetingStatus.FINISHED);
      pause();
    }
  }, [currentSpeakerIndex, scrum.attendees.length, reset, speakerTime, start, pause, currentSpeaker, currentUtterance]);

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      handleNextSpeaker();
    }
  }, [timeLeft, isActive, handleNextSpeaker]);

  const handleStart = () => {
    setStatus(MeetingStatus.IN_PROGRESS);
    start();
  };
  
  const handlePause = () => {
    setStatus(MeetingStatus.PAUSED);
    pause();
  };

  const handleResume = () => {
    setStatus(MeetingStatus.IN_PROGRESS);
    start();
  };

  const handleEndMeeting = async () => {
    setStatus(MeetingStatus.FINISHED);
    pause();
    setIsSummarizing(true);
    const finalSummary = await generateMeetingSummary(fullTranscript);
    setSummary(finalSummary);
    setIsSummarizing(false);
  };
  
  const handleSaveAndExit = () => {
    const updatedScrum = { ...scrum, transcript: fullTranscript, summary: summary || undefined, notes };
    onMeetingEnd(updatedScrum, talkTimes);
  };

  const handleUpdateTranscript = () => {
    if(currentUtterance.trim()){
        const newUtterance = currentUtterance.trim();
        setTranscripts(prev => ({
            ...prev,
            [currentSpeaker.name]: [...(prev[currentSpeaker.name] || []), newUtterance]
        }));
        setCurrentUtterance('');
    }
  }

  const renderContent = () => {
    if (status === MeetingStatus.FINISHED) {
      return (
        <div className="text-center p-4 md:p-8 flex flex-col items-center justify-center h-full animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Scrum Finished!</h2>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary mb-8">Here is your AI-generated meeting summary.</p>
          {isSummarizing ? (
             <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-brand-primary"></div>
                <p className="mt-6 text-light-text-secondary dark:text-dark-text-secondary">Generating summary with Gemini...</p>
            </div>
          ) : (
            <div className="w-full max-w-3xl bg-light-bg dark:bg-dark-bg p-8 rounded-lg text-left overflow-y-auto max-h-[60vh] prose dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans">{summary}</pre>
            </div>
          )}
          <button
            onClick={handleSaveAndExit}
            disabled={isSummarizing}
            className="mt-10 px-10 py-4 bg-brand-primary hover:bg-brand-secondary rounded-md text-white font-semibold transition-colors disabled:bg-gray-500"
          >
            Save & Exit
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full p-4 md:p-6">
        {/* Main Panel: Timer & Speaker */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center bg-light-surface dark:bg-dark-surface rounded-lg p-6 animate-fade-in">
            <div className="flex items-center space-x-4 mb-8">
                <img src={`https://i.pravatar.cc/80?u=${currentSpeaker?.email}`} alt={currentSpeaker?.name} className="w-20 h-20 rounded-full ring-4 ring-brand-primary/50" />
                <div>
                     <p className="text-light-text-secondary dark:text-dark-text-secondary">Up Next:</p>
                     <h2 className="text-4xl font-bold" key={currentSpeaker?.name}>{currentSpeaker?.name || 'Nobody'}</h2>
                </div>
            </div>
            
            <TimerDisplay timeLeft={timeLeft} speakerTime={speakerTime} />
            
            <div className="flex items-center space-x-4 mt-8">
                <button onClick={() => addTime(30)} className="px-5 py-3 bg-light-border dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-semibold transition-colors">+30s</button>
                <button onClick={handleNextSpeaker} className="px-8 py-3 bg-brand-secondary hover:bg-purple-700 rounded-md text-white font-semibold transition-colors text-lg">Next Speaker</button>
            </div>
        </div>

        {/* Side Panel: Transcript & Attendees */}
        <div className="lg:col-span-2 bg-light-surface dark:bg-dark-surface rounded-lg p-4 flex flex-col animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex-shrink-0 mb-4">
                <div className="flex border-b border-light-border dark:border-dark-border">
                    <button onClick={() => setActiveTab('transcript')} className={`px-4 py-2 font-semibold ${activeTab === 'transcript' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}><ListIcon className="w-5 h-5 inline mr-2"/>Transcript</button>
                    <button onClick={() => setActiveTab('attendees')} className={`px-4 py-2 font-semibold ${activeTab === 'attendees' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}><UsersIcon className="w-5 h-5 inline mr-2"/>Attendees</button>
                    <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 font-semibold ${activeTab === 'notes' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}><DocumentTextIcon className="w-5 h-5 inline mr-2"/>Notes</button>
                </div>
            </div>

            {activeTab === 'transcript' && (
                <div className="flex-grow flex flex-col overflow-hidden">
                    <div ref={transcriptContainerRef} className="flex-grow overflow-y-auto space-y-4 pr-2">
                        {Object.entries(transcripts).flatMap(([speaker, texts]) =>
                            (texts as string[]).map((text, index) => {
                                const speakerInfo = scrum.attendees.find(a => a.name === speaker);
                                return (
                                    <div key={`${speaker}-${index}`} className="flex items-start gap-3 animate-fade-in">
                                        <img src={`https://i.pravatar.cc/40?u=${speakerInfo?.email}`} alt={speaker} className="w-8 h-8 rounded-full mt-1" />
                                        <div className="flex-1">
                                            <p className="font-bold text-brand-secondary text-sm">{speaker}</p>
                                            <div className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg text-sm">
                                                <p className="whitespace-pre-wrap text-light-text-primary dark:text-dark-text-primary font-sans">{text}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                     {status === MeetingStatus.IN_PROGRESS && (
                        <div className="mt-auto pt-4 border-t border-light-border dark:border-dark-border">
                            <textarea
                                value={currentUtterance}
                                onChange={(e) => setCurrentUtterance(e.target.value)}
                                placeholder={`Log update for ${currentSpeaker.name}...`}
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 h-24 resize-none focus:ring-brand-primary focus:border-brand-primary"
                            />
                            <button onClick={handleUpdateTranscript} className="w-full mt-2 px-4 py-2 bg-brand-primary/80 hover:bg-brand-primary rounded-md text-white text-sm font-semibold transition-colors">Add to Transcript</button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'attendees' && (
                 <ul className="space-y-3 overflow-y-auto pr-2">
                    {scrum.attendees.map((attendee, index) => (
                    <li key={attendee.email} className={`flex items-center p-3 rounded-md transition-all duration-300
                        ${index === currentSpeakerIndex ? 'bg-brand-primary/20 ring-2 ring-brand-primary' : ''}
                        ${index < currentSpeakerIndex ? 'opacity-50' : ''}
                    `}>
                        <img src={`https://i.pravatar.cc/40?u=${attendee.email}`} alt={attendee.name} className="w-10 h-10 rounded-full mr-3" />
                        <div className="flex-1">
                        <span className="font-medium">{attendee.name}</span>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Talk time: {Math.floor(talkTimes[attendee.name] / 60)}m {talkTimes[attendee.name] % 60}s</p>
                        </div>
                        {index === currentSpeakerIndex && status === MeetingStatus.IN_PROGRESS && <div className="ml-auto w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>}
                        {index < currentSpeakerIndex && <div className="ml-auto text-green-500 font-bold text-xs">DONE</div>}
                    </li>
                    ))}
                </ul>
            )}
            
            {activeTab === 'notes' && (
                <div className="flex-grow flex flex-col">
                     <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Start typing collaborative notes here..."
                        className="w-full flex-grow bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-3 resize-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                </div>
            )}

        </div>
      </div>
    );
  };
  
  return (
    <div className="h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary">
      <header className="relative flex-shrink-0 p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3">
          <LogoIcon className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold">ScrumDinger</h1>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">A product By Mardromus</p>
          </div>
        </div>
        
        {/* Center: Meeting Title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary truncate max-w-xs sm:max-w-md">
                {scrum.title}
            </h2>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-4">
            {status === MeetingStatus.NOT_STARTED && <button onClick={handleStart} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold transition-colors">Start Meeting</button>}
            {status === MeetingStatus.IN_PROGRESS && <button onClick={handlePause} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-md text-white font-bold transition-colors">Pause</button>}
            {status === MeetingStatus.PAUSED && <button onClick={handleResume} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold transition-colors">Resume</button>}
            {status !== MeetingStatus.FINISHED && <button onClick={handleEndMeeting} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-bold transition-colors">End Meeting</button>}
        </div>
      </header>
      <main className="flex-grow overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};