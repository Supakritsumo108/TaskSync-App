import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MessageSquare, X, Send, Sparkles, User, Plus, RefreshCw, Trash2, Calendar, ClipboardList, BotMessageSquare } from 'lucide-react';
import { useData } from '../context/DataContext';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  actions?: {
    type: 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 'ADD_SUBTASKS';
    payload: any;
  }[];
  suggestedPlan?: {
    time: string;
    task_title: string;
    reason: string;
  }[];
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'สวัสดีครับ! ผมคือผู้ช่วยส่วนตัว TaskSync AI ผมรู้สถานะของงานและโปรเจกต์ของคุณทั้งหมด ต้องการให้ผมช่วยจัดตารางเวลา ย่อยงาน สร้างการ์ดงานใหม่ หรืออัปเดตสถานะงานด้านไหน พิมพ์บอกได้เลยครับ!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    tasks, 
    projects, 
    users, 
    addTask, 
    updateTask, 
    deleteTask, 
    addSubtasksToTask 
  } = useData();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      // Format data context for Gemini to read
      const projectsContext = projects.map(p => `- ID: ${p.project_id}, Name: "${p.name}", Deadline: ${p.deadline}`).join('\n');
      const usersContext = users.map(u => `- ID: ${u.user_id}, Name: "${u.name}"`).join('\n');
      const tasksContext = tasks.map(t => `- ID: ${t.task_id}, Title: "${t.title}", Status: ${t.status}, Priority: ${t.priority}, Assigned To: ${t.assigned_to}, Subtasks: ${t.subtasks ? t.subtasks.map(s => s.title + (s.completed ? ' (Done)' : ' (Pending)')).join(', ') : 'None'}`).join('\n');

      const systemInstruction = `
You are TaskSync AI, an expert productivity and task assistant.
You help the user manage their tasks, priorities, daily scheduling, and breaking down tasks.
You MUST respond with a valid JSON object matching the requested schema.
Always reply in Thai. Use polite male language (ครับ/ผม). You are a male assistant.

Context of projects currently in system:
${projectsContext}

Context of users currently in system:
${usersContext}

Context of tasks currently in system:
${tasksContext}

Actions you can request in the "actions" array if the user explicitly asks to perform them:
1. ADD_TASK: Creates a task.
   - Match project names to project IDs. Match assignee names to user IDs. If not found, use default.
   - Payload keys: { "title": "...", "project_id": "...", "priority": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "assigned_to": "..." }
2. UPDATE_TASK: Updates status, priority, or other details.
   - Locate the task_id from the context tasks list.
   - Payload keys: { "task_id": "...", "status": "TODO"|"DOING"|"DONE"|"BLOCKED", "priority": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "title": "..." }
3. DELETE_TASK: Deletes a task.
   - Locate the task_id.
   - Payload keys: { "task_id": "..." }
4. ADD_SUBTASKS: Breaks down a task.
   - Locate the parent task_id.
   - Payload keys: { "task_id": "...", "subtask_titles": ["title 1", "title 2", ...] }

If the user asks to schedule or prioritize, generate the "suggestedPlan" array containing daily timeline blocks or order.
`;

      const responseSchema = {
        type: "object",
        properties: {
          reply: { 
            type: "string", 
            description: "The conversational response to display to the user, in Thai. Tell them what you did, or answer their question." 
          },
          actions: {
            type: "array",
            description: "Optional list of actions to modify the database. Only include if the user requested to add, edit, change status, or delete tasks/subtasks.",
            items: {
              type: "object",
              properties: {
                type: { 
                  type: "string", 
                  enum: ["ADD_TASK", "UPDATE_TASK", "DELETE_TASK", "ADD_SUBTASKS"] 
                },
                payload: {
                  type: "object",
                  properties: {
                    task_id: { type: "string" },
                    title: { type: "string" },
                    project_id: { type: "string" },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                    status: { type: "string", enum: ["TODO", "DOING", "DONE", "BLOCKED"] },
                    assigned_to: { type: "string" },
                    subtask_titles: {
                      type: "array",
                      items: { type: "string" }
                    }
                  }
                }
              },
              required: ["type", "payload"]
            }
          },
          suggestedPlan: {
            type: "array",
            description: "A list of time slots or priority slots for daily planning or task prioritization.",
            items: {
              type: "object",
              properties: {
                time: { type: "string", description: "Time slot or order, e.g. '09:00 - 10:00' or '1st Priority'" },
                task_title: { type: "string" },
                reason: { type: "string" }
              },
              required: ["time", "task_title", "reason"]
            }
          }
        },
        required: ["reply"]
      };

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
        }
      });

      const result = await model.generateContent(userMessage);
      const responseText = result.response.text();

      // Parse JSON response
      const parsedData = JSON.parse(responseText);
      const reply = parsedData.reply || '';
      const actions = parsedData.actions || [];
      const suggestedPlan = parsedData.suggestedPlan || [];

      // Execute actions in real-time
      actions.forEach((action: any) => {
        const { type, payload } = action;
        if (type === 'ADD_TASK') {
          addTask(payload);
        } else if (type === 'UPDATE_TASK' && payload.task_id) {
          updateTask(payload.task_id, payload);
        } else if (type === 'DELETE_TASK' && payload.task_id) {
          deleteTask(payload.task_id);
        } else if (type === 'ADD_SUBTASKS' && payload.task_id && payload.subtask_titles) {
          addSubtasksToTask(payload.task_id, payload.subtask_titles);
        }
      });

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: reply, 
        actions: actions.length > 0 ? actions : undefined, 
        suggestedPlan: suggestedPlan.length > 0 ? suggestedPlan : undefined 
      }]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `เกิดข้อผิดพลาดในการประมวลผล: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button 
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-transform hover:scale-105 z-50 cursor-pointer" 
          onClick={() => setIsOpen(true)}
          title="TaskSync AI Assistant"
        >
          <BotMessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[340px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white border-b border-slate-100 p-3 flex justify-between items-center text-slate-800 shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span>TaskSync AI</span>
            </div>
            <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-colors cursor-pointer" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-slate-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-sm'}`}>
                  {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                </div>
                <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 text-[13px] shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                  
                  {/* Action Badges Log */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.actions.map((act, actIdx) => (
                        <div key={actIdx} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium border ${act.type === 'DELETE_TASK' ? 'bg-red-50 text-red-600 border-red-100' : act.type === 'UPDATE_TASK' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {act.type === 'ADD_TASK' && (
                            <>
                              <Plus size={12} />
                              <span>เพิ่มงาน: "{act.payload.title}"</span>
                            </>
                          )}
                          {act.type === 'UPDATE_TASK' && (
                            <>
                              <RefreshCw size={12} />
                              <span>อัปเดตงาน: ID {act.payload.task_id}</span>
                            </>
                          )}
                          {act.type === 'DELETE_TASK' && (
                            <>
                              <Trash2 size={12} />
                              <span>ลบงานเรียบร้อย</span>
                            </>
                          )}
                          {act.type === 'ADD_SUBTASKS' && (
                            <>
                              <ClipboardList size={12} />
                              <span>เพิ่มงานย่อย {act.payload.subtask_titles.length} รายการ</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Daily Schedule Planning Widget */}
                  {msg.suggestedPlan && msg.suggestedPlan.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 mt-1 w-full max-w-[280px] shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                        <Calendar size={14} className="text-indigo-600" />
                        <span>📅 แผนการจัดตารางเวลาแนะนำ</span>
                      </div>
                      <div className="flex flex-col gap-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-200">
                        {msg.suggestedPlan.map((item, planIdx) => (
                          <div key={planIdx} className="relative pl-6">
                            <div className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 ring-4 ring-white"></div>
                            <div className="text-xs font-bold text-blue-600 mb-0.5">{item.time}</div>
                            <div className="text-sm font-semibold text-slate-900 mb-0.5">{item.task_title}</div>
                            <div className="text-xs text-slate-500">{item.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] self-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-sm flex items-center justify-center shrink-0">
                  <Sparkles size={14} />
                </div>
                <div className="px-3 py-2 text-[13px] shadow-sm bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-tl-sm flex items-center gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce delay-100">•</span>
                  <span className="animate-bounce delay-200">•</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-200 flex items-end gap-2 shrink-0">
            <textarea
              rows={1}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none max-h-32 overflow-y-auto"
              placeholder="Message AI Assistant..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  e.currentTarget.style.height = 'auto';
                }
              }}
            />
            <button 
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer disabled:hover:scale-100" 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
