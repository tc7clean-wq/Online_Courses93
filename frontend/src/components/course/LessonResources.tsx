import React from 'react';
import {
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  LinkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface Resource {
  _id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'link' | 'zip' | 'other';
  url: string;
  size?: number;
  downloadable: boolean;
}

interface LessonResourcesProps {
  resources: Resource[];
  lessonTitle: string;
}

const LessonResources: React.FC<LessonResourcesProps> = ({
  resources,
  lessonTitle
}) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return DocumentTextIcon;
      case 'video':
        return FilmIcon;
      case 'audio':
        return MusicalNoteIcon;
      case 'image':
        return PhotoIcon;
      case 'zip':
        return ArchiveBoxIcon;
      case 'link':
        return LinkIcon;
      default:
        return DocumentIcon;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      case 'audio':
        return 'bg-green-100 text-green-800';
      case 'image':
        return 'bg-blue-100 text-blue-800';
      case 'document':
        return 'bg-gray-100 text-gray-800';
      case 'zip':
        return 'bg-yellow-100 text-yellow-800';
      case 'link':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.type === 'link') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else if (resource.downloadable) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = resource.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Open in new tab for viewing
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getResourceActionText = (resource: Resource) => {
    if (resource.type === 'link') return 'Open Link';
    if (resource.downloadable) return 'Download';
    return 'View';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Resources</h3>
        <p className="text-sm text-gray-600 truncate" title={lessonTitle}>
          {lessonTitle}
        </p>
      </div>

      {/* Resources List */}
      <div className="flex-1 overflow-y-auto p-4">
        {resources.length > 0 ? (
          <div className="space-y-3">
            {resources.map((resource) => {
              const IconComponent = getResourceIcon(resource.type);

              return (
                <div
                  key={resource._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-gray-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {resource.title}
                          </h4>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {resource.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
                              {resource.type.toUpperCase()}
                            </span>
                            {resource.size && (
                              <span className="text-xs text-gray-500">
                                {formatFileSize(resource.size)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleResourceClick(resource)}
                          className="ml-3 flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {resource.downloadable ? (
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          ) : resource.type === 'link' ? (
                            <LinkIcon className="h-4 w-4" />
                          ) : (
                            <DocumentIcon className="h-4 w-4" />
                          )}
                          <span>{getResourceActionText(resource)}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <DocumentIcon className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500 text-sm">No resources available</p>
            <p className="text-gray-400 text-xs mt-1">
              Check back later for downloadable materials
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {resources.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{resources.length} resource{resources.length !== 1 ? 's' : ''} available</span>
            <span>
              {resources.filter(r => r.downloadable).length} downloadable
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonResources;