'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AITaskEnhancerProps {
  title: string;
  onEnhance: (enhancement: any) => void;
  onClose: () => void;
}

export default function AITaskEnhancer({
  title,
  onEnhance,
  onClose,
}: AITaskEnhancerProps) {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [enhancement, setEnhancement] = useState<any>(null);
  const [error, setError] = useState('');

  const handleEnhance = async () => {
    if (!title.trim()) {
      setError('Please enter a task title first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/enhance-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          briefDescription: brief,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to enhance task');
      }

      const data = await res.json();
      setEnhancement(data);
    } catch (err) {
      setError('Failed to enhance task. Please try again.');
      console.error('AI enhancement error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (enhancement) {
      onEnhance(enhancement);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            AI Task Enhancement
          </DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions for your task details, priority, and timeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Task Title
            </label>
            <div className="p-3 bg-gray-50 rounded border">
              {title || 'No title entered'}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Brief Description (Optional)
            </label>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Add any additional context..."
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {!enhancement ? (
            <Button
              onClick={handleEnhance}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" size={18} />
                  Enhance with AI
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <h3 className="font-semibold mb-2">AI Suggestions</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-gray-700">
                      {enhancement.enhancedDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Category:</span>
                      <p className="text-gray-700">{enhancement.suggestedCategory}</p>
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>
                      <p className="text-gray-700 capitalize">
                        {enhancement.suggestedPriority}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Estimated Time:</span>
                      <p className="text-gray-700">{enhancement.estimatedHours} hours</p>
                    </div>
                    <div>
                      <span className="font-medium">Suggested Deadline:</span>
                      <p className="text-gray-700">
                        {enhancement.suggestedDeadlineDays} days from now
                      </p>
                    </div>
                  </div>

                  {enhancement.reasoning && (
                    <div>
                      <span className="font-medium">Reasoning:</span>
                      <p className="mt-1 text-gray-600 text-xs">
                        {enhancement.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEnhancement(null)} className="flex-1">
                  Regenerate
                </Button>
                <Button onClick={handleApply} className="flex-1">
                  Apply Suggestions
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}