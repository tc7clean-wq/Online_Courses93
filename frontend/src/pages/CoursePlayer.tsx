import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const CoursePlayer: React.FC = () => {
  const { courseId } = useParams();
  const [currentLesson, setCurrentLesson] = useState(0);

  // Mock data - replace with actual API calls
  const course = {
    id: courseId,
    title: "React Advanced Patterns",
    modules: [
      {
        id: 1,
        title: "Introduction to Advanced Patterns",
        lessons: [
          { id: 1, title: "Course Overview", duration: "5:30", completed: true },
          { id: 2, title: "Prerequisites", duration: "3:45", completed: true },
          { id: 3, title: "Setting Up Environment", duration: "8:20", completed: false }
        ]
      },
      {
        id: 2,
        title: "Compound Components Pattern",
        lessons: [
          { id: 4, title: "Understanding Compound Components", duration: "12:15", completed: false },
          { id: 5, title: "Implementation Examples", duration: "18:30", completed: false },
          { id: 6, title: "Best Practices", duration: "10:45", completed: false }
        ]
      }
    ]
  };

  const allLessons = course.modules.flatMap(module => module.lessons);
  const currentLessonData = allLessons[currentLesson];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Video Player */}
      <div className="flex-1 flex flex-col">
        {/* Video Area */}
        <div className="bg-black aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">{currentLessonData?.title}</h3>
            <p className="text-gray-300">Duration: {currentLessonData?.duration}</p>
          </div>
        </div>

        {/* Video Controls */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
                disabled={currentLesson === 0}
                className="p-2 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentLesson(Math.min(allLessons.length - 1, currentLesson + 1))}
                disabled={currentLesson === allLessons.length - 1}
                className="p-2 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-4 text-white">
              <button className="p-2 hover:bg-gray-700 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 9H4a1 1 0 00-1 1v4a1 1 0 001 1h1.586l4.707 4.707C10.923 20.337 12 19.575 12 18.414V5.586c0-1.161-1.077-1.923-1.707-1.293L5.586 9z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-700 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-600 rounded-full h-1">
              <div className="bg-blue-600 h-1 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-white p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{currentLessonData?.title}</h2>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>Lesson {currentLesson + 1} of {allLessons.length}</span>
            <span>Duration: {currentLessonData?.duration}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              currentLessonData?.completed
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {currentLessonData?.completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Course Content</h3>
        </div>

        <div className="p-4 space-y-4">
          {course.modules.map((module) => (
            <div key={module.id} className="space-y-2">
              <h4 className="font-medium text-gray-900">{module.title}</h4>
              <div className="space-y-1">
                {module.lessons.map((lesson, index) => {
                  const globalIndex = allLessons.findIndex(l => l.id === lesson.id);
                  const isActive = globalIndex === currentLesson;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(globalIndex)}
                      className={`w-full text-left p-3 rounded-lg border ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            lesson.completed
                              ? 'bg-green-100 text-green-600'
                              : isActive
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {lesson.completed ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{lesson.title}</p>
                            <p className="text-xs text-gray-500">{lesson.duration}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;