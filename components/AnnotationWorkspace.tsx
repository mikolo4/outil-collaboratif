import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoTask, Annotation, TaskStatus } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { TimeTracker } from './TimeTracker';
import { cleanupAnnotationText } from '../services/geminiService';
import { Play, Plus, Wand2, Save, CheckCircle, ArrowLeft } from 'lucide-react';

interface AnnotationWorkspaceProps {
  task: VideoTask;
  onUpdateTask: (task: VideoTask) => void;
  onBack: () => void;
}

export const AnnotationWorkspace: React.FC<AnnotationWorkspaceProps> = ({ task, onUpdateTask, onBack }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(true); // Auto-start tracking when opened
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Auto-save time spent
  const handleTick = useCallback(() => {
    onUpdateTask({
      ...task,
      timeSpentSeconds: task.timeSpentSeconds + 1
    });
  }, [task, onUpdateTask]);

  // Pause tracking if user is idle or leaves tab (simplified for demo: pause button)
  const toggleTracking = () => setIsTracking(!isTracking);

  const handleCreateSegments = () => {
    // Automate the "5 second rule"
    const newAnnotations: Annotation[] = [];
    const segmentDuration = 5;
    
    for (let i = 0; i < duration; i += segmentDuration) {
      newAnnotations.push({
        id: crypto.randomUUID(),
        startTime: i,
        endTime: Math.min(i + segmentDuration, duration),
        description: "",
        timestamp: Date.now()
      });
    }
    
    onUpdateTask({
      ...task,
      annotations: [...task.annotations, ...newAnnotations]
    });
  };

  const handleUpdateAnnotation = (id: string, text: string) => {
    const updated = task.annotations.map(a => a.id === id ? { ...a, description: text } : a);
    onUpdateTask({ ...task, annotations: updated });
  };

  const handleAiPolish = async (id: string, text: string) => {
      if(!text) return;
      setIsAiProcessing(true);
      const polished = await cleanupAnnotationText(text);
      handleUpdateAnnotation(id, polished);
      setIsAiProcessing(false);
  }

  const handleComplete = () => {
    setIsTracking(false);
    onUpdateTask({
      ...task,
      status: TaskStatus.REVIEW
    });
    onBack();
  };

  const seekTo = (time: number) => {
    if (videoRef) {
      videoRef.currentTime = time;
      videoRef.play();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{task.title}</h1>
            <p className="text-sm text-slate-500">Project Workspace</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
            <button 
                onClick={toggleTracking}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
                {isTracking ? "Pause Tracking" : "Resume Tracking"}
            </button>
          <TimeTracker 
            isActive={isTracking && task.status === TaskStatus.IN_PROGRESS} 
            totalSeconds={task.timeSpentSeconds} 
            onTick={handleTick} 
          />
          <button 
            onClick={handleComplete}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Submit for Review
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <VideoPlayer 
            url={task.videoUrl} 
            onTimeUpdate={setCurrentTime} 
            onLoadedMetadata={setDuration}
            setVideoRef={setVideoRef}
          />
          
          <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Video Controls</h3>
                <div className="text-sm text-slate-500 font-mono">
                    Current: {currentTime.toFixed(2)}s / Total: {duration.toFixed(2)}s
                </div>
             </div>
             
             <div className="flex gap-3">
                 <button 
                    onClick={handleCreateSegments}
                    disabled={task.annotations.length > 0 || duration === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50 text-sm"
                 >
                    <Plus className="w-4 h-4" />
                    Auto-Generate 5s Segments
                 </button>
             </div>
             <p className="mt-2 text-xs text-slate-500">
                Clicking auto-generate will split the video into 5-second blocks for rapid annotation.
             </p>
          </div>
        </div>

        {/* Sidebar / Annotations List */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                Annotations 
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{task.annotations.length}</span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {task.annotations.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <p>No annotations yet.</p>
                    <p className="text-sm">Use the tool to generate segments.</p>
                </div>
            ) : (
                task.annotations.sort((a,b) => a.startTime - b.startTime).map((ann) => (
                    <div 
                        key={ann.id} 
                        className={`p-3 rounded-lg border transition-all ${
                            currentTime >= ann.startTime && currentTime < ann.endTime 
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span 
                                onClick={() => seekTo(ann.startTime)}
                                className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-1 rounded cursor-pointer hover:bg-slate-300"
                            >
                                {new Date(ann.startTime * 1000).toISOString().substr(14, 5)} - {new Date(ann.endTime * 1000).toISOString().substr(14, 5)}
                            </span>
                            {activeAnnotationId === ann.id && (
                                <span className="text-xs text-indigo-600 font-medium animate-pulse">Editing...</span>
                            )}
                        </div>
                        <div className="relative">
                            <textarea 
                                className="w-full text-sm p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                rows={2}
                                placeholder="Describe activity..."
                                value={ann.description}
                                onFocus={() => setActiveAnnotationId(ann.id)}
                                onBlur={() => setActiveAnnotationId(null)}
                                onChange={(e) => handleUpdateAnnotation(ann.id, e.target.value)}
                            />
                            <button 
                                onClick={() => handleAiPolish(ann.id, ann.description)}
                                disabled={isAiProcessing || !ann.description}
                                title="AI Polish Text"
                                className="absolute right-2 bottom-2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                <Wand2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
