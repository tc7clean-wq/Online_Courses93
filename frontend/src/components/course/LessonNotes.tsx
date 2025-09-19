import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { progressService, Note } from '../../services/progress';
import { PlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface LessonNotesProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
}

const LessonNotes: React.FC<LessonNotesProps> = ({
  courseId,
  lessonId,
  lessonTitle
}) => {
  const [newNote, setNewNote] = useState('');
  const [timestamp, setTimestamp] = useState(0);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: notes = [], isLoading } = useQuery(
    ['lesson-notes', courseId, lessonId],
    () => progressService.getLessonNotes(courseId, lessonId),
    {
      staleTime: 30 * 1000,
    }
  );

  const addNoteMutation = useMutation(
    (data: { content: string; timestamp: number }) =>
      progressService.addNote(courseId, lessonId, data.content, data.timestamp),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lesson-notes', courseId, lessonId]);
        setNewNote('');
        setTimestamp(0);
        setIsAddingNote(false);
        showToast('Note added successfully', 'success');
      },
      onError: () => {
        showToast('Failed to add note', 'error');
      }
    }
  );

  useEffect(() => {
    if (isAddingNote && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAddingNote]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    addNoteMutation.mutate({
      content: newNote.trim(),
      timestamp
    });
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentVideoTime = () => {
    // This would be passed down from the parent component or accessed via context
    // For now, we'll use a placeholder
    return 0;
  };

  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Notes</h3>
        <p className="text-sm text-gray-600 truncate" title={lessonTitle}>
          {lessonTitle}
        </p>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : sortedNotes.length > 0 ? (
          sortedNotes.map((note) => (
            <div key={note._id} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <ClockIcon className="h-3 w-3" />
                  <span>{formatTimestamp(note.timestamp)}</span>
                  <span>•</span>
                  <span>{formatDate(note.createdAt)}</span>
                </div>
                <button
                  onClick={() => {
                    // TODO: Implement note deletion
                    showToast('Note deletion coming soon', 'info');
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No notes yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Add your first note below
            </p>
          </div>
        )}
      </div>

      {/* Add Note Section */}
      <div className="border-t border-gray-200 p-4">
        {!isAddingNote ? (
          <button
            onClick={() => setIsAddingNote(true)}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Note</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="0:00"
                value={timestamp > 0 ? formatTimestamp(timestamp) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const parts = value.split(':');
                  if (parts.length === 2) {
                    const minutes = parseInt(parts[0]) || 0;
                    const seconds = parseInt(parts[1]) || 0;
                    setTimestamp(minutes * 60 + seconds);
                  }
                }}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setTimestamp(getCurrentVideoTime())}
                className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Current Time
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note here..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            <div className="flex space-x-2">
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addNoteMutation.isLoading}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addNoteMutation.isLoading ? 'Adding...' : 'Add Note'}
              </button>
              <button
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote('');
                  setTimestamp(0);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonNotes;