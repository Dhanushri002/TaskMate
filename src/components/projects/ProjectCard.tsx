'use client';

import { useRouter } from 'next/navigation';
import { MoreVertical, Users } from 'lucide-react';

interface ProjectCardProps {
  project: any;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  return (
    <div
      className="bg-white border rounded-lg p-6 hover:shadow-md transition cursor-pointer"
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: project.color }}
        >
          {project.name.charAt(0)}
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={20} />
        </button>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {project.name}
      </h3>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={16} />
          <span>{project.tasks?.length || 0} tasks</span>
        </div>
        <div className="flex items-center gap-1">
          {project.owner && (
            <span className="text-gray-500">{project.owner.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}