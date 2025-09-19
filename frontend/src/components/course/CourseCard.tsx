import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../services/course';
import { StarIcon, ClockIcon, UserGroupIcon, PlayIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import ProgressBar from '../ui/ProgressBar';

interface CourseCardProps {
  course: Course;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  showProgress = false,
  progress = 0,
  className = ''
}) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-4 w-4">
            <StarOutlineIcon className="h-4 w-4 text-yellow-400 absolute" />
            <div className="absolute overflow-hidden w-1/2">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarOutlineIcon key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }

    return stars;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      <Link to={`/courses/${course.slug}`} className="block">
        {/* Course Thumbnail */}
        <div className="relative aspect-video bg-gray-200">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-course.jpg'; // Fallback image
            }}
          />

          {/* Play Icon Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white bg-opacity-90 rounded-full p-3">
              <PlayIcon className="h-8 w-8 text-gray-800" />
            </div>
          </div>

          {/* Level Badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.level)}`}>
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </div>

          {/* Featured Badge */}
          {course.isFeatured && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              Featured
            </div>
          )}
        </div>

        {/* Course Content */}
        <div className="p-4">
          {/* Course Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          {/* Course Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {course.shortDescription}
          </p>

          {/* Instructor */}
          <div className="flex items-center mb-3">
            <img
              src={course.instructor.avatar || '/default-avatar.png'}
              alt={course.instructor.name}
              className="h-6 w-6 rounded-full mr-2"
            />
            <span className="text-sm text-gray-700">{course.instructor.name}</span>
          </div>

          {/* Course Stats */}
          <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              {/* Rating */}
              <div className="flex items-center">
                <div className="flex mr-1">
                  {renderStars(course.averageRating)}
                </div>
                <span className="font-medium">
                  {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'New'}
                </span>
                {course.reviewCount > 0 && (
                  <span className="ml-1">({course.reviewCount})</span>
                )}
              </div>

              {/* Duration */}
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{formatDuration(course.totalDuration)}</span>
              </div>

              {/* Students */}
              <div className="flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                <span>{course.enrollmentCount}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar (if applicable) */}
          {showProgress && (
            <div className="mb-3">
              <ProgressBar
                progress={progress}
                size="sm"
                showLabel
                className="text-xs"
              />
            </div>
          )}

          {/* Course Features */}
          <div className="flex flex-wrap gap-1 mb-3">
            {course.hasCertificate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Certificate
              </span>
            )}
            {course.hasQuizzes && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Quizzes
              </span>
            )}
            {course.hasDownloads && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Downloads
              </span>
            )}
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              {course.totalLessons} lessons
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(course.pricing.basic.price)}
              </span>
              {course.pricing.premium && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {formatPrice(course.pricing.premium.price)}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {course.previewVideo && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle preview video modal
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Preview
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Enroll Button */}
      <div className="px-4 pb-4">
        <Link
          to={`/courses/${course.slug}`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors duration-200 font-medium text-sm block"
        >
          {showProgress ? 'Continue Learning' : 'Enroll Now'}
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;