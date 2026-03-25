import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, AlertCircle, TrendingUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInsightsNotesQueryFn, createInsightsNoteMutationFn, deleteInsightsNoteMutationFn, getAIInsightsQueryFn } from "@/lib/api";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useAuth from "@/hooks/api/use-auth";

export default function InsightsTab() {
    const workspaceId = useWorkspaceId();
    const queryClient = useQueryClient();
    const { data: currentUser } = useAuth();
    const [category, setCategory] = useState<'all' | 'performance' | 'team' | 'personal'>('all');
    const [noteInput, setNoteInput] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Get user's name with fallback
    const authorName = currentUser?.user?.name || 'Anonymous User';

    // Dynamic AI insights
    const { data: aiData, isLoading: aiLoading, isError: aiError, refetch: refetchAI } = useQuery({
        queryKey: ['ai-insights', workspaceId],
        queryFn: () => getAIInsightsQueryFn(workspaceId),
        enabled: !!workspaceId
    });

    const rawInsights = aiData?.insights || [];
    const filteredInsights = category === 'all'
        ? rawInsights
        : rawInsights.filter(i => i.type === category);

    // Fetch notes from backend
    const { data, isLoading: notesLoading } = useQuery({
        queryKey: ['insights-notes', workspaceId],
        queryFn: () => getInsightsNotesQueryFn(workspaceId),
        enabled: !!workspaceId
    });

    const userNotes = data?.notes || [];

    // Create note mutation
    const createNoteMutation = useMutation({
        mutationFn: ({ text, author }: { text: string; author: string }) =>
            createInsightsNoteMutationFn({ workspaceId, text, author }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['insights-notes', workspaceId] });
            setNoteInput('');
        }
    });

    // Delete note mutation
    const deleteNoteMutation = useMutation({
        mutationFn: (noteId: string) => deleteInsightsNoteMutationFn({ workspaceId, noteId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['insights-notes', workspaceId] });
        },
        onError: (err: any) => {
            console.error('[InsightsTab] Delete note failed', err?.response?.data || err);
        }
    });

    const handleAddNote = () => {
        if (noteInput.trim() && workspaceId) {
            createNoteMutation.mutate({ text: noteInput.trim(), author: authorName });
        }
    };

    const handleDeleteNote = (noteId: string) => {
        deleteNoteMutation.mutate(noteId);
    };

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 1200);
    };

    return (
        <div className="space-y-6">
            {/* AI Insights Header */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-800/30 border-purple-200 dark:border-purple-700/50 shadow-sm dark:shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Lightbulb className="h-5 w-5" />
                        AI-Powered Insights {aiLoading && <span className="text-xs font-normal text-purple-400">(loading)</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {aiError && (
                        <p className="text-xs text-red-500">Failed to load AI insights.</p>
                    )}
                    <div className="text-purple-600 dark:text-purple-400 text-sm space-y-1">
                        <p>AI analyzes task patterns and surfaces performance, team, and personal signals.</p>
                        {aiData && (
                            <div className="text-xs text-purple-500 dark:text-purple-400">
                                Generated: {new Date(aiData.generatedAt).toLocaleTimeString()} • Provider: {aiData.provider}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Filter Controls */}
            <div className="flex gap-2 mb-2">
                <button
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${category === 'all' ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200'}`}
                    onClick={() => setCategory('all')}
                >All</button>
                <button
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${category === 'performance' ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/40 dark:border-green-600 dark:text-green-200' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200'}`}
                    onClick={() => setCategory('performance')}
                >Performance</button>
                <button
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${category === 'team' ? 'bg-indigo-100 border-indigo-400 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-200' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200'}`}
                    onClick={() => setCategory('team')}
                >Team</button>
                <button
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${category === 'personal' ? 'bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900/40 dark:border-yellow-600 dark:text-yellow-200' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200'}`}
                    onClick={() => setCategory('personal')}
                >Personal</button>
            </div>

            {/* Insights List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Performance Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {aiLoading && (
                            <div className="text-xs text-gray-500">Loading dynamic insights…</div>
                        )}
                        {!aiLoading && filteredInsights.length === 0 && (
                            <div className="text-xs text-gray-500">No insights for this category yet.</div>
                        )}
                        {filteredInsights.map((insight, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-100 dark:border-blue-700/50 relative group shadow-sm dark:shadow-md">
                                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed flex-1">
                                    {insight.text}
                                </p>
                                <button
                                    className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                                    onClick={() => handleCopy(insight.text, index)}
                                >
                                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                                AI Recommendation
                            </h4>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            {aiData?.recommendation || 'Insights are being generated…'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* User Notes Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                        Your Insights & Notes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={noteInput}
                            onChange={e => setNoteInput(e.target.value)}
                            placeholder={`Add your insight (will be posted as ${authorName})...`}
                            className="flex-1 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600"
                        />
                        <button
                            onClick={handleAddNote}
                            className="px-3 py-1 rounded bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition"
                        >
                            Add
                        </button>
                    </div>
                    <div className="space-y-2">
                        {notesLoading ? (
                            <div className="text-gray-400 text-sm">Loading notes...</div>
                        ) : userNotes.length === 0 ? (
                            <div className="text-gray-400 text-sm">No notes yet.</div>
                        ) : (
                            userNotes.map((note, idx) => (
                                <div key={note.id} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800 relative group">
                                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                                            {note.text}
                                        </p>
                                        <div className="text-xs text-purple-500 dark:text-purple-300 mt-1">
                                            By: {note.author} • {new Date(note.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            className="px-2 py-1 text-xs rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 transition"
                                            onClick={() => { navigator.clipboard.writeText(note.text); setCopiedIndex(idx + 1000); setTimeout(() => setCopiedIndex(null), 1200); }}
                                        >
                                            {copiedIndex === idx + 1000 ? 'Copied!' : 'Copy'}
                                        </button>
                                        {/* Only show delete button for notes owned by current user */}
                                        {currentUser?.user?._id === note.userId && (
                                            <button
                                                className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-800 transition"
                                                onClick={() => handleDeleteNote(note.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
