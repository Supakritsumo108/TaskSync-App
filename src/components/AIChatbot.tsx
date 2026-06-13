import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MessageSquare, X, Send, Bot, User, Plus, RefreshCw, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { useData } from '../context/DataContext';
import './AIChatbot.css';

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
Always reply in Thai. Use polite language (ครับ/ค่ะ).

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
        <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window glass-panel">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <Bot size={20} />
              <span>AI Assistant</span>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'model-bubble'}`}>
                <div className="message-icon">
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className="message-text">
                  <div>{msg.text}</div>
                  
                  {/* Action Badges Log */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="chatbot-actions-log">
                      {msg.actions.map((act, actIdx) => (
                        <div key={actIdx} className={`action-log-badge ${act.type === 'DELETE_TASK' ? 'delete-badge' : act.type === 'UPDATE_TASK' ? 'update-badge' : ''}`}>
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
                    <div className="suggested-plan-widget">
                      <div className="suggested-plan-title">
                        <Calendar size={14} className="text-accent" />
                        <span>📅 แผนการจัดตารางเวลาแนะนำ</span>
                      </div>
                      <div className="plan-timeline">
                        {msg.suggestedPlan.map((item, planIdx) => (
                          <div key={planIdx} className="plan-timeline-item">
                            <div className="plan-time">{item.time}</div>
                            <div className="plan-task">{item.task_title}</div>
                            <div className="plan-reason">{item.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-bubble model-bubble">
                <div className="message-icon"><Bot size={14} /></div>
                <div className="message-text typing-indicator">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
