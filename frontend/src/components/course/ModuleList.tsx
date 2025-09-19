import React from 'react';
import { Module } from '../../services/course';
import { LessonProgress } from '../../services/progress';
import { CheckCircleIcon, PlayCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ModuleListProps {
  modules: Module[];
  currentModuleIndex: number;
  currentLessonIndex: number;
  completedLessons: LessonProgress[];
  onLessonSelect: (moduleIndex: number, lessonIndex: number) => void;
}

const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  currentModuleIndex,
  currentLessonIndex,
  completedLessons,
  onLessonSelect
}) => {
  const [expandedModules, setExpandedModules] = React.useState<Set<number>>(
    new Set([currentModuleIndex])
  );

  const toggleModule = (moduleIndex: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex);
    } else {
      newExpanded.add(moduleIndex);
    }
    setExpandedModules(newExpanded);
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return completedLessons.some(completed => completed.lessonId === lessonId);
  };

  const getModuleProgress = (module: Module): number => {
    const completedCount = module.lessons.filter(lesson =>
      isLessonCompleted(lesson._id)
    ).length;
    return Math.round((completedCount / module.lessons.length) * 100);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-2">
      {modules.map((module, moduleIndex) => {
        const isExpanded = expandedModules.has(moduleIndex);
        const moduleProgress = getModuleProgress(module);
        const isCurrentModule = moduleIndex === currentModuleIndex;

        return (
          <div key={module._id} className="border border-gray-600 rounded-lg overflow-hidden">
            {/* Module Header */}
            <button
              onClick={() => toggleModule(moduleIndex)}
              className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors ${
                isCurrentModule ? 'bg-gray-700' : 'bg-gray-750'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-400">
                    Module {moduleIndex + 1}
                  </span>
                  {moduleProgress === 100 && (
                    <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  )}
                </div>
                <h3 className="text-white font-medium mt-1 truncate" title={module.title}>
                  {module.title}
                </h3>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span>{module.lessons.length} lessons</span>
                  <span className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {formatDuration(module.totalDuration || 0)}
                  </span>
                  <span>{moduleProgress}% complete</span>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                {isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Progress Bar */}
            <div className="px-4 pb-2">
              <div className="w-full bg-gray-600 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${moduleProgress}%` }}
                />
              </div>
            </div>

            {/* Lessons List */}
            {isExpanded && (
              <div className="border-t border-gray-600">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isCompleted = isLessonCompleted(lesson._id);
                  const isCurrent = moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex;

                  return (
                    <button
                      key={lesson._id}
                      onClick={() => onLessonSelect(moduleIndex, lessonIndex)}
                      className={`w-full px-6 py-3 text-left flex items-center space-x-3 hover:bg-gray-600 transition-colors ${
                        isCurrent ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        ) : isCurrent ? (
                          <PlayCircleIcon className="h-5 w-5 text-blue-400" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-500 rounded-full" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">
                            {lessonIndex + 1}.
                          </span>
                          <h4 className={`font-medium truncate ${
                            isCurrent ? 'text-white' : 'text-gray-200'
                          }`} title={lesson.title}>
                            {lesson.title}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-xs flex items-center ${
                            isCurrent ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatDuration(lesson.duration || 0)}
                          </span>

                          {lesson.type === 'quiz' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isCurrent
                                ? 'bg-blue-500 text-white'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              Quiz
                            </span>
                          )}

                          {lesson.hasResources && (
                            <span className={`text-xs ${
                              isCurrent ? 'text-blue-200' : 'text-gray-400'
                            }`}>
                              📎 Resources
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Preview Indicator */}
                      {lesson.isPreview && (
                        <div className="flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isCurrent
                              ? 'bg-white bg-opacity-20 text-white'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Preview
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ModuleList;