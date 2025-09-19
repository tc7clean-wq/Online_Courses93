import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { courseService, CourseFilters } from '../services/course';
import CourseCard from '../components/course/CourseCard';
import CourseFiltersPanel from '../components/course/CourseFiltersPanel';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Pagination from '../components/ui/Pagination';

const CourseCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<CourseFilters>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 12,
    category: searchParams.get('category') || undefined,
    level: searchParams.get('level') || undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'popular',
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
  });

  const {
    data: coursesData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['courses', filters],
    () => courseService.getAllCourses(filters),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: categories } = useQuery(
    ['course-categories'],
    courseService.getCategories,
    {
      staleTime: 30 * 60 * 1000,
    }
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });

    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (newFilters: Partial<CourseFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sortBy: 'popular',
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage
          message="Failed to load courses"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
            <p className="mt-2 text-lg text-gray-600">
              Discover courses to advance your skills and career
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <CourseFiltersPanel
              filters={filters}
              categories={categories || []}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 mt-8 lg:mt-0">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                {coursesData && (
                  <p className="text-sm text-gray-600">
                    Showing {((filters.page! - 1) * filters.limit!) + 1} - {Math.min(filters.page! * filters.limit!, coursesData.pagination.total)} of {coursesData.pagination.total} courses
                  </p>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="mt-4 sm:mt-0">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {/* Course Grid */}
            {coursesData && coursesData.courses.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {coursesData.courses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>

                {/* Pagination */}
                {coursesData.pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={coursesData.pagination.current}
                      totalPages={coursesData.pagination.pages}
                      onPageChange={handlePageChange}
                      hasNext={coursesData.pagination.hasNext}
                      hasPrev={coursesData.pagination.hasPrev}
                    />
                  </div>
                )}
              </>
            )}

            {/* No Results */}
            {coursesData && coursesData.courses.length === 0 && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
                  <p className="mt-2 text-gray-600">
                    Try adjusting your filters or search terms to find more courses.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCatalog;