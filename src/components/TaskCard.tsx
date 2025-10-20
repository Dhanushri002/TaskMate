'use client';

import { Calendar, User, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface TaskCardProps {
  task: any;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const router = useRouter();

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div
      className="bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge className={statusColors[task.status as keyof typeof statusColors]}>
          {task.status.replace('_', ' ')}
        </Badge>
        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
          {task.priority}
        </Badge>
        {task.aiGenerated && (
          <Badge className="bg-purple-100 text-purple-800">
            AI Enhanced
          </Badge>
        )}
        {task.aiCategory && (
          <Badge variant="outline">{task.aiCategory}</Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        {task.assignee && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar} />
              <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{task.assignee.name}</span>
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
          </div>
        )}

        {task.estimatedHours && (
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{task.estimatedHours}h</span>
          </div>
        )}

        {task.comments && task.comments.length > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare size={16} />
            <span>{task.comments.length}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
        <Select
          value={task.status}
          onValueChange={(value) => onStatusChange(task.id, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}