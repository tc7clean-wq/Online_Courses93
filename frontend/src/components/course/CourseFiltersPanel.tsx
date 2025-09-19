import React from 'react';
import { CourseFilters } from '../../services/course';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Category {
  _id: string;
  name: string;
  slug: string;
  courseCount?: number;
}

interface CourseFiltersPanelProps {
  filters: CourseFilters;
  categories: Category[];
  onFilterChange: (filters: Partial<CourseFilters>) => void;
  onClearFilters: () => void;
}

const CourseFiltersPanel: React.FC<CourseFiltersPanelProps> = ({
  filters,
  categories,
  onFilterChange,
  onClearFilters
}) => {
  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const priceRanges = [
    { min: 0, max: 25, label: 'Free - $25' },
    { min: 25, max: 50, label: '$25 - $50' },
    { min: 50, max: 100, label: '$50 - $100' },
    { min: 100, max: 200, label: '$100 - $200' },
    { min: 200, max: undefined, label: '$200+' }
  ];

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.level ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.search
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          id="search"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          placeholder="Search courses..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => onFilterChange({ category: undefined })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category._id} className="flex items-center">
              <input
                type="radio"
                name="category"
                checked={filters.category === category.slug}
                onChange={() => onFilterChange({ category: category.slug })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700 flex-1">
                {category.name}
              </span>
              {category.courseCount && (
                <span className="text-xs text-gray-500">({category.courseCount})</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Level</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="level"
              checked={!filters.level}
              onChange={() => onFilterChange({ level: undefined })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">All Levels</span>
          </label>
          {levels.map((level) => (
            <label key={level.value} className="flex items-center">
              <input
                type="radio"
                name="level"
                checked={filters.level === level.value}
                onChange={() => onFilterChange({ level: level.value })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="priceRange"
              checked={!filters.minPrice && !filters.maxPrice}
              onChange={() => onFilterChange({ minPrice: undefined, maxPrice: undefined })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Any Price</span>
          </label>
          {priceRanges.map((range, index) => (
            <label key={index} className="flex items-center">
              <input
                type="radio"
                name="priceRange"
                checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                onChange={() => onFilterChange({ minPrice: range.min, maxPrice: range.max })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Custom Price Range</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="minPrice" className="sr-only">Minimum price</label>
            <input
              type="number"
              id="minPrice"
              min="0"
              step="1"
              value={filters.minPrice || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                onFilterChange({ minPrice: value });
              }}
              placeholder="Min $"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="maxPrice" className="sr-only">Maximum price</label>
            <input
              type="number"
              id="maxPrice"
              min="0"
              step="1"
              value={filters.maxPrice || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                onFilterChange({ maxPrice: value });
              }}
              placeholder="Max $"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.hasCertificate || false}
              onChange={(e) => onFilterChange({ hasCertificate: e.target.checked || undefined })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Certificate of Completion</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.hasQuizzes || false}
              onChange={(e) => onFilterChange({ hasQuizzes: e.target.checked || undefined })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Quizzes & Assessments</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.hasDownloads || false}
              onChange={(e) => onFilterChange({ hasDownloads: e.target.checked || undefined })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Downloadable Resources</span>
          </label>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {categories.find(c => c.slug === filters.category)?.name || filters.category}
                <button
                  onClick={() => onFilterChange({ category: undefined })}
                  className="ml-1 hover:text-blue-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.level && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {levels.find(l => l.value === filters.level)?.label || filters.level}
                <button
                  onClick={() => onFilterChange({ level: undefined })}
                  className="ml-1 hover:text-blue-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                ${filters.minPrice || 0} - ${filters.maxPrice || '∞'}
                <button
                  onClick={() => onFilterChange({ minPrice: undefined, maxPrice: undefined })}
                  className="ml-1 hover:text-blue-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseFiltersPanel;