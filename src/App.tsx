import React, { useState } from 'react';
import { User, UserRole, VideoTask, TaskStatus, Project } from './types';
import { AnnotationWorkspace } from './components/AnnotationWorkspace';
import { generateProjectReport } from './services/geminiService';
import { 
  Users, 
  LayoutDashboard, 
  PlaySquare, 
  FileText, 
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Manager', role: UserRole.MANAGER, avatar: 'https://picsum.photos/100/100?random=1' },
  { id: 'u2', name: 'Bob Worker', role: UserRole.COLLABORATOR, avatar: 'https://picsum.photos/100/100?random=2' },
  { id: 'u3', name: 'Charlie Worker', role: UserRole.COLLABORATOR, avatar: 'https://picsum.photos/100/100?random=3' },
];

const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Traffic Analysis 2024', clientName: 'City Council' },
  { id: 'p2', name: 'Retail Behavior Study', clientName: 'ShopSmart Inc.' },
];

const INITIAL_TASKS: VideoTask[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Intersection CAM 04 - Morning',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    assigneeId: 'u2',
    status: TaskStatus.IN_PROGRESS,
    timeSpentSeconds: 1450, // approx 24 mins
    lastUpdated: Date.now(),
    annotations: []
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Intersection CAM 04 - Noon',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    assigneeId: null,
    status: TaskStatus.TODO,
    timeSpentSeconds: 0,
    lastUpdated: Date.now(),
    annotations: []
  },
  {
    id: 't3',
    projectId: 'p2',
    title: 'Aisle 4 Shopper Tracking',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    assigneeId: 'u3',
    status: TaskStatus.REVIEW,
    timeSpentSeconds: 3200,
    lastUpdated: Date.now(),
    annotations: [
        { id: 'a1', startTime: 0, endTime: 5, description: "Subject enters frame from left.", timestamp: Date.now() },
        { id: 'a2', startTime: 5, endTime: 10, description: "Subject pauses at shelf.", timestamp: Date.now() }
    ]
  }
];

function App() {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // Default to Manager
  const [tasks, setTasks] = useState<VideoTask[]>(INITIAL_TASKS);
  const [activeTask, setActiveTask] = useState<VideoTask | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // --- Handlers ---

  const handleUpdateTask = (updatedTask: VideoTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    // If we are currently working on this task, update the active state too
    if (activeTask && activeTask.id === updatedTask.id) {
      setActiveTask(updatedTask);
    }
  };

  const handleAssignTask = (taskId: string, userId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      handleUpdateTask({ ...task, assigneeId: userId, status: TaskStatus.IN_PROGRESS });
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const report = await generateProjectReport(tasks, MOCK_USERS);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  const exportToCSV = () => {
     // Simple client-side CSV generation
     const headers = ["Task ID", "Video Title", "Collaborator", "Status", "Time Spent (s)", "Annotation Count"];
     const rows = tasks.map(t => [
         t.id,
         t.title,
         MOCK_USERS.find(u => u.id === t.assigneeId)?.name || "Unassigned",
         t.status,
         t.timeSpentSeconds,
         t.annotations.length
     ]);
     
     const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "project_tracking_sheet.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // --- Views ---

  if (activeTask) {
    return (
      <AnnotationWorkspace 
        task={activeTask} 
        onUpdateTask={handleUpdateTask} 
        onBack={() => setActiveTask(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight text-indigo-400">AutoNote<span className="text-white">Video</span></h1>
          <p className="text-xs text-slate-400 mt-1">Automation Workflow v1.0</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Role Switcher (Demo)</div>
           {MOCK_USERS.map(user => (
             <button
                key={user.id}
                onClick={() => {
                    setCurrentUser(user);
                    setActiveTask(null);
                    setAiReport(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${currentUser.id === user.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
             >
                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                <span className="text-sm truncate">{user.name}</span>
             </button>
           ))}
           
           <div className="border-t border-slate-700 my-4 pt-4"></div>
           
           <div className={`px-3 py-2 rounded-md bg-slate-800 text-slate-300 mb-2 flex items-center gap-2`}>
             <LayoutDashboard size={18} />
             <span className="text-sm font-medium">Dashboard</span>
           </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
                {currentUser.role === UserRole.MANAGER ? 'Manager Overview' : 'My Assignments'}
            </h2>
            <p className="text-slate-500">
                Welcome back, {currentUser.name}
            </p>
          </div>
          
          {currentUser.role === UserRole.MANAGER && (
            <div className="flex gap-3">
               <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
               >
                 <FileText className="w-4 h-4" />
                 {isGeneratingReport ? 'Analyzing...' : 'AI Daily Report'}
               </button>
               <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
               >
                 <FileSpreadsheet className="w-4 h-4" />
                 Export Sheet
               </button>
            </div>
          )}
        </header>

        {/* AI Report Section (Manager Only) */}
        {aiReport && currentUser.role === UserRole.MANAGER && (
            <div className="mb-8 bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5" /> Gemini AI Insight Report
                    </h3>
                    <button onClick={() => setAiReport(null)} className="text-white/80 hover:text-white text-sm">Close</button>
                </div>
                <div className="p-6 prose prose-slate max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600">{aiReport}</pre>
                </div>
            </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <PlaySquare className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Videos</p>
                        <h3 className="text-2xl font-bold text-slate-800">{tasks.length}</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Pending Review</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {tasks.filter(t => t.status === TaskStatus.REVIEW).length}
                        </h3>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Completed</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {tasks.filter(t => t.status === TaskStatus.DONE).length}
                        </h3>
                    </div>
                </div>
            </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Video Assignments</h3>
                <span className="text-xs text-slate-500">Auto-Tracking Enabled</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-medium">
                        <tr>
                            <th className="px-6 py-3">Video Title</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Assignee</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Time Spent</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tasks.map((task) => {
                            // Filter for Collaborator view
                            if (currentUser.role === UserRole.COLLABORATOR && task.assigneeId !== currentUser.id && task.assigneeId !== null) {
                                return null;
                            }

                            const assignee = MOCK_USERS.find(u => u.id === task.assigneeId);
                            const project = MOCK_PROJECTS.find(p => p.id === task.projectId);

                            return (
                                <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {task.title}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {project?.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {currentUser.role === UserRole.MANAGER ? (
                                            <select 
                                                value={task.assigneeId || ''}
                                                onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                                className="bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Unassigned</option>
                                                {MOCK_USERS.filter(u => u.role === UserRole.COLLABORATOR).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {assignee ? (
                                                    <>
                                                        <img src={assignee.avatar} className="w-6 h-6 rounded-full" alt="" />
                                                        <span className="text-slate-700">{assignee.name}</span>
                                                    </>
                                                ) : <span className="text-slate-400 italic">Unassigned</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${task.status === TaskStatus.TODO ? 'bg-slate-100 text-slate-800' : ''}
                                            ${task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' : ''}
                                            ${task.status === TaskStatus.REVIEW ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${task.status === TaskStatus.DONE ? 'bg-green-100 text-green-800' : ''}
                                        `}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        {Math.floor(task.timeSpentSeconds / 60)}m {task.timeSpentSeconds % 60}s
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {currentUser.role === UserRole.MANAGER ? (
                                            task.status === TaskStatus.REVIEW ? (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleUpdateTask({...task, status: TaskStatus.DONE})}
                                                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => setActiveTask(task)}
                                                        className="text-xs border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100"
                                                    >
                                                        Review
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setActiveTask(task)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-xs"
                                                >
                                                    View Details
                                                </button>
                                            )
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    // Auto-assign if unassigned
                                                    if(!task.assigneeId) handleAssignTask(task.id, currentUser.id);
                                                    setActiveTask(task);
                                                }}
                                                className="flex items-center gap-1 ml-auto text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                                            >
                                                {task.status === TaskStatus.IN_PROGRESS ? 'Continue' : 'Start'} 
                                                <ChevronRight size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {tasks.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No tasks found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
