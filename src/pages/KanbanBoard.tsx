import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import type { Task } from '../types';

const KanbanBoard = () => {
  const { tasks, updateTask, loading, users } = useData();
  const navigate = useNavigate();

  // Local state for optimistic UI updates during drag
  const [boardData, setBoardData] = useState<Record<string, Task[]>>({
    TODO: [],
    DOING: [],
    BLOCKED: [],
    DONE: []
  });

  // Sync with context
  useEffect(() => {
    if (tasks) {
      setBoardData({
        TODO: tasks.filter(t => t.status === 'TODO'),
        DOING: tasks.filter(t => t.status === 'DOING'),
        BLOCKED: tasks.filter(t => t.status === 'BLOCKED'),
        DONE: tasks.filter(t => t.status === 'DONE'),
      });
    }
  }, [tasks]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId as keyof typeof boardData;
    const destCol = destination.droppableId as keyof typeof boardData;

    // Optimistic UI update
    const sourceTasks = Array.from(boardData[sourceCol]);
    const destTasks = sourceCol === destCol ? sourceTasks : Array.from(boardData[destCol]);

    const [movedTask] = sourceTasks.splice(source.index, 1);
    
    // Update status locally
    movedTask.status = destCol as any;
    destTasks.splice(destination.index, 0, movedTask);

    setBoardData({
      ...boardData,
      [sourceCol]: sourceTasks,
      [destCol]: destTasks,
    });

    // Actually update context/DB
    if (sourceCol !== destCol) {
      updateTask(draggableId, { status: destCol as any });
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: `Moved to ${destCol}`,
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'bg-slate-100', dot: 'bg-slate-400' },
    { id: 'DOING', title: 'In Progress', color: 'bg-indigo-50/50', dot: 'bg-indigo-500' },
    { id: 'BLOCKED', title: 'Blocked', color: 'bg-rose-50/50', dot: 'bg-rose-500' },
    { id: 'DONE', title: 'Done', color: 'bg-emerald-50/50', dot: 'bg-emerald-500' }
  ];

  if (loading) return <div className="text-slate-500 p-8 flex justify-center">Loading board...</div>;

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kanban Board</h1>
          <p className="text-slate-500 text-sm mt-1">Drag and drop tasks to update their status.</p>
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 xl:gap-6 overflow-x-auto pb-8 h-[calc(100vh-180px)] min-h-[500px] custom-scrollbar">
          {columns.map(col => (
            <div key={col.id} className={`flex flex-col flex-1 min-w-[260px] max-w-[340px] rounded-2xl border border-slate-200 ${col.color} overflow-hidden`}>
              <div className="p-4 border-b border-slate-200/50 bg-white/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`}></div>
                  <h2 className="font-bold text-slate-800">{col.title}</h2>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200">
                    {boardData[col.id].length}
                  </span>
                </div>
                <button aria-label="Add new task" className="text-slate-400 hover:text-indigo-600 transition-colors p-1 hover:bg-white rounded-md">
                  <Plus size={18} />
                </button>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/80' : ''}`}
                  >
                    {boardData[col.id].length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
                        Drop here
                      </div>
                    )}
                    {boardData[col.id].map((task, index) => {
                      const user = users.find(u => u.user_id === task.assigned_to);
                      return (
                        <Draggable key={task.task_id} draggableId={task.task_id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/tasks/${task.task_id}`)}
                              className={`bg-white p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing transition-all ${snapshot.isDragging ? 'border-indigo-500 shadow-lg scale-105 rotate-1' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getPriorityColor(task.priority)} uppercase tracking-wider`}>
                                  {task.priority}
                                </span>
                                <button aria-label="More options" className="text-slate-400 hover:text-slate-600" onClick={(e) => { e.stopPropagation(); }}>
                                  <MoreHorizontal size={16} />
                                </button>
                              </div>
                              <h3 className="font-bold text-slate-800 text-sm mb-3 leading-snug">{task.title}</h3>
                              
                              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                {task.subtasks && task.subtasks.length > 0 ? (
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <Sparkles size={12} className="text-indigo-500" />
                                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400 font-medium">No subtasks</div>
                                )}
                                
                                {user && (
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-white shadow-sm" title={user.name}>
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
