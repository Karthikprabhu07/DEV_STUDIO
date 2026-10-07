import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClubData } from '../context/ClubDataContext';
import { TaskStatus, Priority } from '../types';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import {
  Award,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Trash2,
  User as UserIcon,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { currentUser, isAdmin, isCaptain } = useAuth();
  const { tasks, users, addTask, updateTaskStatus, deleteTask } = useClubData();
  const { success } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (!currentUser) return null;

  // Dev Mate can toggle their task status
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTaskStatus(taskId, newStatus);
    success(`Task updated to ${newStatus.replace('_', ' ')}.`);
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm('Delete this task?')) {
      deleteTask(taskId);
      success('Task deleted.');
    }
  };

  // Dev Mate by default sees their tasks or all club tasks
  const isDevMate = currentUser.role === 'DEV_MATE';
  let list = tasks;
  if (isDevMate && statusFilter === 'MY_TASKS') {
    list = tasks.filter((t) => t.assignedTo === currentUser.id);
  } else if (statusFilter !== 'ALL') {
    list = tasks.filter((t) => t.status === statusFilter);
  }

  const priorityColors = {
    LOW: 'default',
    MEDIUM: 'info',
    HIGH: 'warning',
    URGENT: 'danger',
  } as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
              Tasks & Project Sprints
            </h2>
            <span className="p-1 rounded-full bg-indigo-500/10 text-indigo-400">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage deliverables, UI challenges, and sprint backlog across DevStudio cohorts.
          </p>
        </div>

        {(isAdmin || isCaptain) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign New Task</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              statusFilter === st
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            {st === 'ALL' ? 'All Tasks' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((task) => {
          const isAssignedToMe = task.assignedTo === currentUser.id;

          return (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-3.5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant={priorityColors[task.priority] || 'default'} size="sm">
                    {task.priority} Priority
                  </Badge>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Due: {task.deadline}
                  </span>
                </div>

                <h3 className="mt-2.5 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="mt-3.5 flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">
                    Assignee: <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">{task.assignedToName}</strong>
                    {isAssignedToMe && ' (You)'}
                  </span>
                </div>
              </div>

              {/* Status Selector & Actions */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="w-full px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed ✓</option>
                  </select>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 text-neutral-400 hover:text-rose-500 rounded"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={addTask}
        members={users}
        creatorId={currentUser.id}
      />
    </div>
  );
};
