import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Course, Module, Lesson } from '../../services/course';
import { progressService } from '../../services/progress';
import VideoPlayer from './VideoPlayer';
import ModuleList from './ModuleList';
import LessonNotes from './LessonNotes';
import LessonResources from './LessonResources';
import ProgressBar from '../ui/ProgressBar';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';

interface CoursePlayerProps {
  course: Course;
  initialModuleIndex?: number;
  initialLessonIndex?: number;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({
  course,
  initialModuleIndex = 0,
  initialLessonIndex = 0
}) => {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(initialModuleIndex);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(initialLessonIndex);
  const [showNotes, setShowNotes] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const playerRef = useRef<any>(null);

  const currentModule = course.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons[currentLessonIndex];

  // Get course progress
  const { data: progressData, isLoading: progressLoading } = useQuery(
    ['course-progress', course._id],
    () => progressService.getCourseProgress(course._id),
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  // Update lesson progress mutation
  const updateProgressMutation = useMutation(
    (data: { watchTime: number; watchPercentage: number; currentTime: number }) =>
      progressService.updateLessonProgress(course._id, currentLesson._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-progress', course._id]);
      },
      onError: (error: any) => {
        showToast('Failed to update progress', 'error');
      }
    }
  );

  // Handle lesson completion
  const handleLessonProgress = (watchTime: number, watchPercentage: number, currentTime: number) => {
    if (!currentLesson) return;

    updateProgressMutation.mutate({
      watchTime,
      watchPercentage,
      currentTime
    });

    // Show completion message if lesson is completed
    if (watchPercentage >= 80 && !isLessonCompleted(currentLesson._id)) {
      showToast('Lesson completed! 🎉', 'success');
    }
  };

  // Navigate to specific lesson
  const navigateToLesson = (moduleIndex: number, lessonIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
  };

  // Navigate to next lesson
  const goToNextLesson = () => {
    const currentModuleLessons = course.modules[currentModuleIndex].lessons;

    // Check if there's a next lesson in current module
    if (currentLessonIndex < currentModuleLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
    // Check if there's a next module
    else if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
    }
  };

  // Navigate to previous lesson
  const goToPreviousLesson = () => {
    // Check if there's a previous lesson in current module
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
    // Check if there's a previous module
    else if (currentModuleIndex > 0) {
      const prevModule = course.modules[currentModuleIndex - 1];
      setCurrentModuleIndex(currentModuleIndex - 1);
      setCurrentLessonIndex(prevModule.lessons.length - 1);
    }
  };

  // Check if lesson is completed
  const isLessonCompleted = (lessonId: string): boolean => {
    return progressData?.progress?.completedLessons?.some(
      (completed: any) => completed.lessonId === lessonId
    ) || false;
  };

  // Calculate overall progress
  const overallProgress = progressData?.completionPercentage || 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          playerRef.current?.togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          playerRef.current?.seekBackward(10);
          break;
        case 'ArrowRight':
          event.preventDefault();
          playerRef.current?.seekForward(10);
          break;
        case 'ArrowUp':
          event.preventDefault();
          goToPreviousLesson();
          break;
        case 'ArrowDown':
          event.preventDefault();
          goToNextLesson();
          break;
        case 'n':
          event.preventDefault();
          setShowNotes(!showNotes);
          break;
        case 'r':
          event.preventDefault();
          setShowResources(!showResources);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showNotes, showResources, currentModuleIndex, currentLessonIndex]);

  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No lesson selected</h2>
          <p className="text-gray-600">Please select a lesson from the course outline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-800 border-r border-gray-700`}>
        <div className="h-full flex flex-col">
          {/* Course Header */}
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-lg font-semibold text-white truncate" title={course.title}>
              {course.title}
            </h1>
            <div className="mt-2">
              <ProgressBar
                progress={overallProgress}
                size="sm"
                showLabel
                className="text-xs text-gray-300"
              />
            </div>
          </div>

          {/* Module List */}
          <div className="flex-1 overflow-y-auto">
            <ModuleList
              modules={course.modules}
              currentModuleIndex={currentModuleIndex}
              currentLessonIndex={currentLessonIndex}
              completedLessons={progressData?.progress?.completedLessons || []}
              onLessonSelect={navigateToLesson}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h2 className="text-white font-medium truncate max-w-md" title={currentLesson.title}>
              {currentLesson.title}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                showNotes
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Notes
            </button>

            <button
              onClick={() => setShowResources(!showResources)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                showResources
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Resources
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 flex">
          <div className="flex-1">
            <VideoPlayer
              ref={playerRef}
              videoUrl={currentLesson.videoUrl}
              title={currentLesson.title}
              onProgress={handleLessonProgress}
              onEnded={goToNextLesson}
              poster={course.thumbnail}
            />
          </div>

          {/* Side Panels */}
          {(showNotes || showResources) && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {showNotes && (
                <LessonNotes
                  courseId={course._id}
                  lessonId={currentLesson._id}
                  lessonTitle={currentLesson.title}
                />
              )}

              {showResources && (
                <LessonResources
                  resources={currentLesson.resources || []}
                  lessonTitle={currentLesson.title}
                />
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousLesson}
              disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>

            <div className="text-center text-gray-400 text-sm">
              Lesson {currentLessonIndex + 1} of {currentModule.lessons.length} •
              Module {currentModuleIndex + 1} of {course.modules.length}
            </div>

            <button
              onClick={goToNextLesson}
              disabled={
                currentModuleIndex === course.modules.length - 1 &&
                currentLessonIndex === currentModule.lessons.length - 1
              }
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg text-xs opacity-75 hover:opacity-100 transition-opacity">
        <div className="font-medium mb-1">Keyboard Shortcuts:</div>
        <div>Space: Play/Pause • ← →: Seek • ↑ ↓: Navigate lessons</div>
        <div>N: Notes • R: Resources</div>
      </div>
    </div>
  );
};

export default CoursePlayer;