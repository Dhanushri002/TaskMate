'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, Clock, User, Edit, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch task');
      const data = await res.json();
      setTask(data);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/tasks/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete task');
      router.push('/dashboard/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: params.id,
          content: comment,
        }),
      });

      if (!res.ok) throw new Error('Failed to add comment');
      
      setComment('');
      fetchTask(); // Refresh to get new comment
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Task not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {task.title}
            </h1>
            <div className="flex flex-wrap gap-2">
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
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {task.description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {task.creator && (
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">
                Created By
              </h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={task.creator.avatar} />
                  <AvatarFallback>
                    {task.creator.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{task.creator.name}</span>
              </div>
            </div>
          )}

          {task.assignee && (
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">
                Assigned To
              </h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={task.assignee.avatar} />
                  <AvatarFallback>
                    {task.assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{task.assignee.name}</span>
              </div>
            </div>
          )}

          {task.dueDate && (
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">
                Due Date
              </h3>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{format(new Date(task.dueDate), 'PPP')}</span>
              </div>
            </div>
          )}

          {task.estimatedHours && (
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">
                Estimated Time
              </h3>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{task.estimatedHours} hours</span>
              </div>
            </div>
          )}
        </div>

        {task.project && (
          <div>
            <h3 className="font-semibold mb-2 text-sm text-gray-600">
              Project
            </h3>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded"
              style={{ backgroundColor: task.project.color + '20' }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.project.color }}
              ></div>
              <span>{task.project.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={20} />
          Comments ({task.comments?.length || 0})
        </h2>

        <div className="space-y-4 mb-6">
          {task.comments && task.comments.length > 0 ? (
            task.comments.map((comment: any) => (
              <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback>
                      {comment.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), 'PPp')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No comments yet
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
          />
          <Button
            onClick={handleAddComment}
            disabled={!comment.trim() || submitting}
          >
            {submitting ? 'Adding...' : 'Add Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}