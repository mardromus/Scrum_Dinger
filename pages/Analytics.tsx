import React, { useState, useMemo } from 'react';
import { Scrum, TeamMember } from '../types';
import { generateMemberSummary, analyzeBlockerTrends } from '../services/geminiService';
import { parseSummaryForBlockers, parseTranscriptForMember } from '../utility/summaryParser';

const KPICard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
  <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md">
    <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{title}</p>
    <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mt-1">{value}</p>
    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">{description}</p>
  </div>
);

const TalkTimeChart: React.FC<{ talkTimes: Record<string, number> }> = ({ talkTimes }) => {
    const totalTalkTime = Object.values(talkTimes).reduce((sum, time) => sum + time, 0);
    const sortedSpeakers = Object.entries(talkTimes).sort(([, a], [, b]) => b - a);

    if (totalTalkTime === 0) {
        return (
            <div className="text-center p-8">
                <p className="text-light-text-secondary dark:text-dark-text-secondary">No talk time data available yet. Complete a meeting to see insights.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {sortedSpeakers.map(([name, time]) => {
                const percentage = totalTalkTime > 0 ? (time / totalTalkTime) * 100 : 0;
                return (
                    <div key={name} className="flex items-center">
                        <span className="w-32 text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary truncate pr-4 text-right">{name}</span>
                        <div className="flex-1 bg-light-border dark:bg-dark-border rounded-full h-6">
                            <div 
                                className="bg-gradient-to-r from-brand-primary to-brand-secondary h-6 rounded-full flex items-center justify-end px-2" 
                                style={{ width: `${percentage}%` }}
                            >
                               <span className="text-xs font-bold text-white">{Math.floor(time / 60)}m {time % 60}s</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    )
}

interface AnalyticsProps {
  scrums: Scrum[];
  members: TeamMember[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ scrums, members }) => {
    // State for AI features
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [memberSummary, setMemberSummary] = useState<string>('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [blockerAnalysis, setBlockerAnalysis] = useState<string>('');
    const [isAnalyzingBlockers, setIsAnalyzingBlockers] = useState(false);

    // Memoized calculations for performance
    const analyticsData = useMemo(() => {
        const totalScrums = scrums.length;
        const totalMeetingTimeMinutes = scrums.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const avgMeetingLength = totalScrums > 0 ? (totalMeetingTimeMinutes / totalScrums).toFixed(1) : 0;
        
        const aggregateTalkTimes: Record<string, number> = {};
        const memberStats: Record<string, { attended: number; spoke: number; }> = {};

        members.forEach(member => {
            memberStats[member.uid] = { attended: 0, spoke: 0 };
        });

        scrums.forEach(scrum => {
            scrum.attendees.forEach(attendee => {
                const member = members.find(m => m.email === attendee.email);
                if (member && memberStats[member.uid]) {
                    memberStats[member.uid].attended += 1;
                }
            });

            if (scrum.speakerTalkTimes) {
                Object.entries(scrum.speakerTalkTimes).forEach(([name, time]) => {
                    aggregateTalkTimes[name] = (aggregateTalkTimes[name] || 0) + (time as number);
                    const member = members.find(m => m.name === name);
                     if (member && memberStats[member.uid]) {
                        memberStats[member.uid].spoke += 1;
                    }
                });
            }
        });

        const topContributor = Object.entries(aggregateTalkTimes).sort(([, a], [, b]) => b - a)[0];
        
        return {
            totalScrums,
            avgMeetingLength,
            aggregateTalkTimes,
            topContributor: topContributor ? topContributor[0] : 'N/A',
            memberStats,
        };
    }, [scrums, members]);

    // Handler for generating member summary
    const handleGenerateSummary = async () => {
        const member = members.find(m => m.uid === selectedMemberId);
        if (!member) return;

        setIsGeneratingSummary(true);
        setMemberSummary('');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentScrums = scrums.filter(s => new Date(s.scheduledAt) > sevenDaysAgo);
        const updates = recentScrums.flatMap(s => parseTranscriptForMember(s.transcript || '', member.name));
        
        const summary = await generateMemberSummary(member.name, updates);
        setMemberSummary(summary);
        setIsGeneratingSummary(false);
    };

    // Handler for analyzing blockers
    const handleAnalyzeBlockers = async () => {
        setIsAnalyzingBlockers(true);
        setBlockerAnalysis('');

        const allBlockers = scrums.flatMap(s => parseSummaryForBlockers(s.summary || ''));
        if (allBlockers.length === 0) {
            setBlockerAnalysis("No blockers were found in the provided scrum summaries.");
            setIsAnalyzingBlockers(false);
            return;
        }

        const analysis = await analyzeBlockerTrends(allBlockers.join('\n- '));
        setBlockerAnalysis(analysis);
        setIsAnalyzingBlockers(false);
    };


  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Scrums" value={analyticsData.totalScrums} description="Number of completed meetings." />
        <KPICard title="Avg. Meeting Length" value={`${analyticsData.avgMeetingLength} min`} description="Average duration of all scrums." />
        <KPICard title="Top Contributor" value={analyticsData.topContributor} description="User with the most talk time." />
        <KPICard title="Total Members" value={members.length} description="Members across selected team(s)." />
      </div>

      {/* Participation Metrics Table */}
      <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Participation Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-light-text-secondary dark:text-dark-text-secondary uppercase bg-light-bg dark:bg-dark-bg">
              <tr>
                <th scope="col" className="px-6 py-3">Member</th>
                <th scope="col" className="px-6 py-3">Attendance</th>
                <th scope="col" className="px-6 py-3">Participation</th>
                <th scope="col" className="px-6 py-3">Total Talk Time</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                  const stats = analyticsData.memberStats[member.uid] || { attended: 0, spoke: 0 };
                  const attendanceRate = analyticsData.totalScrums > 0 ? ((stats.attended / analyticsData.totalScrums) * 100).toFixed(0) : 0;
                  const participationRate = stats.attended > 0 ? ((stats.spoke / stats.attended) * 100).toFixed(0) : 0;
                  const talkTime = analyticsData.aggregateTalkTimes[member.name] || 0;
                  const talkTimeString = `${Math.floor(talkTime / 60)}m ${talkTime % 60}s`;

                  return (
                    <tr key={member.uid} className="border-b border-light-border dark:border-dark-border">
                      <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">{member.name}</th>
                      <td className="px-6 py-4">{stats.attended} / {analyticsData.totalScrums} ({attendanceRate}%)</td>
                      <td className="px-6 py-4">{stats.spoke} / {stats.attended} ({participationRate}%)</td>
                      <td className="px-6 py-4">{talkTimeString}</td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Weekly Member Summary */}
      <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Weekly Member Summary</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
            <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="block w-full sm:max-w-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                <option value="" disabled>Select a team member</option>
                {members.map(member => <option key={member.uid} value={member.uid}>{member.name}</option>)}
            </select>
            <button
                onClick={handleGenerateSummary}
                disabled={!selectedMemberId || isGeneratingSummary}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors disabled:bg-gray-400 flex-shrink-0"
            >
                {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
            </button>
        </div>
        {isGeneratingSummary && <div className="text-center p-4">Loading...</div>}
        {memberSummary && (
            <div className="mt-4 p-4 bg-light-bg dark:bg-dark-bg rounded-md prose dark:prose-invert max-w-none">
                 <pre className="whitespace-pre-wrap font-sans">{memberSummary}</pre>
            </div>
        )}
      </div>

       {/* Blocker Trends Analysis */}
       <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Blocker Trends Analysis</h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                Use Gemini to analyze all reported blockers from past scrums to identify recurring themes and patterns.
            </p>
            <button
                onClick={handleAnalyzeBlockers}
                disabled={isAnalyzingBlockers}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
            >
                {isAnalyzingBlockers ? 'Analyzing...' : 'Analyze Blocker Trends'}
            </button>
            {isAnalyzingBlockers && <div className="text-center p-4 mt-4">Analyzing with Gemini...</div>}
            {blockerAnalysis && (
                <div className="mt-4 p-4 bg-light-bg dark:bg-dark-bg rounded-md prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">{blockerAnalysis}</pre>
                </div>
            )}
      </div>

      {/* Talk Time Distribution (existing) */}
      <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Speaker Talk Time Distribution</h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
            This chart shows the total time each participant has spoken across all completed meetings.
        </p>
        <TalkTimeChart talkTimes={analyticsData.aggregateTalkTimes} />
      </div>
    </div>
  );
};
