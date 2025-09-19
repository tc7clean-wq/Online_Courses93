import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { courseService } from '../services/course';
import { enrollmentService } from '../services/enrollment';
import { progressService } from '../services/progress';
import { useAuth } from '../contexts/AuthContext';
import CourseCheckout from '../components/payment/CourseCheckout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import {
  PlayIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  CheckCircleIcon,
  DocumentIcon,
  AcademicCapIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon, HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium'>('basic');
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInWishlist, setIsInWishlist] = useState(false);

  const { data: course, isLoading, error } = useQuery(
    ['course', slug],
    () => courseService.getCourseBySlug(slug!),
    { enabled: !!slug }
  );

  const { data: enrollmentStatus } = useQuery(
    ['enrollment-status', course?._id],
    () => enrollmentService.checkEnrollment(course!._id),
    { enabled: !!course && !!user }
  );

  const { data: progress } = useQuery(
    ['course-progress', course?._id],
    () => progressService.getCourseProgress(course!._id),
    { enabled: !!course && !!user && enrollmentStatus?.enrolled }
  );

  const handleEnrollClick = () => {
    if (!user) {
      navigate('/login', { state: { from: `/courses/${slug}` } });
      return;
    }
    setShowCheckout(true);
  };

  const handleContinueLearning = () => {
    if (progress?.nextLesson) {
      navigate(`/courses/${course?.slug}/learn?module=${progress.nextLesson.moduleIndex}&lesson=${progress.nextLesson.lessonIndex}`);
    } else {
      navigate(`/courses/${course?.slug}/learn`);
    }
  };

  const handlePreviewLesson = (moduleIndex: number, lessonIndex: number) => {
    navigate(`/courses/${slug}/preview?module=${moduleIndex}&lesson=${lessonIndex}`);
  };

  const toggleWishlist = async () => {
    if (!user || !course) return;

    try {
      if (isInWishlist) {
        await enrollmentService.removeFromWishlist(course._id);
        setIsInWishlist(false);
      } else {
        await enrollmentService.addToWishlist(course._id);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-5 w-5">
            <StarOutlineIcon className="h-5 w-5 text-yellow-400 absolute" />
            <div className="absolute overflow-hidden w-1/2">
              <StarIcon className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarOutlineIcon key={i} className="h-5 w-5 text-gray-300" />);
      }
    }
    return stars;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage
          message="Course not found"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <CourseCheckout
            course={course}
            selectedTier={selectedTier}
            onClose={() => setShowCheckout(false)}
          />
        </div>
      </div>
    );
  }

  const isEnrolled = enrollmentStatus?.enrolled;
  const completionPercentage = progress?.completionPercentage || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 text-sm mb-4">
                <span className="bg-blue-600 px-2 py-1 rounded text-xs font-medium">
                  {course.category.name}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-300">{course.level}</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-gray-300 mb-6">{course.shortDescription}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center space-x-6 mb-6">
                <div className="flex items-center">
                  {renderStars(course.averageRating)}
                  <span className="ml-2 text-sm">
                    {course.averageRating.toFixed(1)} ({course.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  {course.enrollmentCount} students
                </div>
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {formatDuration(course.totalDuration)}
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center">
                <img
                  src={course.instructor.avatar || '/default-avatar.png'}
                  alt={course.instructor.name}
                  className="h-12 w-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-medium">Created by {course.instructor.name}</p>
                  <p className="text-sm text-gray-400">{course.instructor.title}</p>
                </div>
              </div>

              {/* Progress (if enrolled) */}
              {isEnrolled && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your Progress</span>
                    <span className="text-sm">{completionPercentage}% complete</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Course Preview/Enrollment */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-4">
                {/* Video Preview */}
                <div className="relative aspect-video bg-gray-200">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <button
                      onClick={() => course.previewVideo && handlePreviewLesson(0, 0)}
                      className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all"
                    >
                      <PlayIcon className="h-8 w-8 text-gray-800" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${course.pricing[selectedTier].price}
                      </span>
                      {course.pricing.premium && selectedTier === 'basic' && (
                        <span className="text-lg text-gray-500 line-through">
                          ${course.pricing.premium.price}
                        </span>
                      )}
                    </div>

                    {/* Tier Selection */}
                    {course.pricing.premium && (
                      <div className="space-y-2 mb-4">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="tier"
                            value="basic"
                            checked={selectedTier === 'basic'}
                            onChange={(e) => setSelectedTier(e.target.value as 'basic')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="ml-3">
                            <div className="font-medium">{course.pricing.basic.name}</div>
                            <div className="text-sm text-gray-600">${course.pricing.basic.price}</div>
                          </div>
                        </label>
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="tier"
                            value="premium"
                            checked={selectedTier === 'premium'}
                            onChange={(e) => setSelectedTier(e.target.value as 'premium')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="ml-3">
                            <div className="font-medium">{course.pricing.premium.name}</div>
                            <div className="text-sm text-gray-600">${course.pricing.premium.price}</div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {isEnrolled ? (
                      <button
                        onClick={handleContinueLearning}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Continue Learning
                      </button>
                    ) : (
                      <button
                        onClick={handleEnrollClick}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Enroll Now
                      </button>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={toggleWishlist}
                        className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {isInWishlist ? (
                          <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
                        ) : (
                          <HeartOutlineIcon className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <span className="text-sm">Wishlist</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <ShareIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm">Share</span>
                      </button>
                    </div>
                  </div>

                  {/* What's Included */}
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">This course includes:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {course.pricing[selectedTier].features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'curriculum', label: 'Curriculum' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'instructor', label: 'Instructor' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="prose max-w-none">
                <h2>About this course</h2>
                <div dangerouslySetInnerHTML={{ __html: course.description }} />

                <h3>What you'll learn</h3>
                <ul>
                  {course.learningObjectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>

                <h3>Requirements</h3>
                <ul>
                  {course.prerequisites.map((prerequisite, index) => (
                    <li key={index}>{prerequisite}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="space-y-4">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module._id} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                          Module {moduleIndex + 1}: {module.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {module.lessons.length} lessons • {formatDuration(module.totalDuration || 0)}
                        </span>
                      </div>
                      {module.description && (
                        <p className="text-gray-600 mt-2">{module.description}</p>
                      )}
                    </div>
                    <div className="divide-y divide-gray-200">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson._id} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <PlayIcon className="h-4 w-4 text-gray-400 mr-3" />
                            <div>
                              <h4 className="font-medium">{lesson.title}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{formatDuration(lesson.duration || 0)}</span>
                                {lesson.type === 'quiz' && <span>Quiz</span>}
                                {lesson.hasResources && <span>Resources</span>}
                              </div>
                            </div>
                          </div>
                          {lesson.isPreview && (
                            <button
                              onClick={() => handlePreviewLesson(moduleIndex, lessonIndex)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Preview
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <p className="text-gray-600">Reviews section coming soon...</p>
              </div>
            )}

            {activeTab === 'instructor' && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-4">
                  <img
                    src={course.instructor.avatar || '/default-avatar.png'}
                    alt={course.instructor.name}
                    className="h-20 w-20 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{course.instructor.name}</h3>
                    <p className="text-gray-600 mb-4">{course.instructor.title}</p>
                    <div className="prose">
                      <p>{course.instructor.bio}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Course Features */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-4">Course Features</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{formatDuration(course.totalDuration)} on-demand video</span>
                  </div>
                  <div className="flex items-center">
                    <DocumentIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{course.totalLessons} lessons</span>
                  </div>
                  {course.hasCertificate && (
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Certificate of completion</span>
                    </div>
                  )}
                  {course.hasDownloads && (
                    <div className="flex items-center">
                      <DocumentIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Downloadable resources</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;