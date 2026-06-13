import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { useData } from '../context/DataContext';
import './AIChatbot.css';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: 'Hello! I am your TaskSync Assistant. I have context about your projects and tasks. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { tasks, projects } = useData();

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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Build context string
      const contextPrompt = `
        You are a helpful AI assistant for a productivity app. 
        Here is the current state of the user's data:
        Total Projects: ${projects.length}
        Total Tasks: ${tasks.length}
        Pending (TODO/DOING) Tasks: ${tasks.filter(t => t.status === 'TODO' || t.status === 'DOING').length}
        Blocked Tasks: ${tasks.filter(t => t.status === 'BLOCKED').length}
        
        The user just said: "${userMessage}"
        
        Respond concisely, professionally, and use the provided data context if relevant.
      `;

      const result = await model.generateContent(contextPrompt);
      const responseText = result.response.text();

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
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
                <div className="message-text">{msg.text}</div>
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
