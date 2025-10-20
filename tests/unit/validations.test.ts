import { describe, it, expect } from 'vitest';
import { taskSchema, projectSchema } from '@/lib/validations';

describe('Task Validation', () => {
  it('should validate a correct task', () => {
    const task = {
      title: 'Test Task',
      description: 'Test description',
      status: 'todo',
      priority: 'medium',
    };

    const result = taskSchema.safeParse(task);
    expect(result.success).toBe(true);
  });

  it('should reject task without title', () => {
    const task = {
      description: 'Test description',
      status: 'todo',
      priority: 'medium',
    };

    const result = taskSchema.safeParse(task);
    expect(result.success).toBe(false);
  });

  it('should reject invalid status', () => {
    const task = {
      title: 'Test Task',
      status: 'invalid_status',
      priority: 'medium',
    };

    const result = taskSchema.safeParse(task);
    expect(result.success).toBe(false);
  });
});

describe('Project Validation', () => {
  it('should validate a correct project', () => {
    const project = {
      name: 'Test Project',
      description: 'Test description',
      color: '#3b82f6',
    };

    const result = projectSchema.safeParse(project);
    expect(result.success).toBe(true);
  });

  it('should reject invalid color format', () => {
    const project = {
      name: 'Test Project',
      color: 'blue',
    };

    const result = projectSchema.safeParse(project);
    expect(result.success).toBe(false);
  });
});