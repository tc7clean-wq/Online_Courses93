import api from './api';

export interface LessonProgress {
  lessonId: string;
  completedAt: string;
  watchTime: number;
  watchPercentage: number;
}

export interface CourseProgress {
  _id: string;
  user: string;
  course: string;
  enrollment: string;
  completedLessons: LessonProgress[];
  currentLesson: {
    moduleIndex: number;
    lessonIndex: number;
    lessonId: string;
    currentTime: number;
  };
  lastAccessedLesson: {
    moduleIndex: number;
    lessonIndex: number;
    lessonId: string;
    accessedAt: string;
  };
  studyTime: {
    totalSeconds: number;
    lastUpdated: string;
  };
  notes: Note[];
  bookmarks: Bookmark[];
  preferences: {
    playbackSpeed: number;
    autoplay: boolean;
    quality: string;
    subtitles: boolean;
    language: string;
  };
  createdAt: string;
  updatedAt: string;
  formattedStudyTime: string;
}

export interface Note {
  _id: string;
  lessonId: string;
  content: string;
  timestamp: number;
  createdAt: string;
}

export interface Bookmark {
  _id: string;
  lessonId: string;
  title: string;
  timestamp: number;
  createdAt: string;
}

export interface ProgressResponse {
  progress: CourseProgress;
  completionPercentage: number;
  nextLesson?: {
    moduleIndex: number;
    lessonIndex: number;
    lesson: any;
  };
  stats: {
    totalStudyTime: string;
    completedLessons: number;
    totalNotes: number;
    totalBookmarks: number;
  };
}

export interface StudyStats {
  totalStudyTime: number;
  totalCompletedLessons: number;
  activeCourses: number;
  totalNotes: number;
  totalBookmarks: number;
}

export interface ProgressOverview {
  courses: CourseProgressSummary[];
  overallStats: StudyStats;
}

export interface CourseProgressSummary {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string;
  completionPercentage: number;
  studyTime: string;
  lastAccessed?: string;
  nextLesson?: any;
  totalNotes: number;
  totalBookmarks: number;
}

export interface QuizResult {
  _id: string;
  lessonId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  attemptedAt: string;
  timeSpent: number;
}

class ProgressService {
  // Get progress for a specific course
  async getCourseProgress(courseId: string): Promise<ProgressResponse> {
    const response = await api.get(`/progress/course/${courseId}`);
    return response.data;
  }

  // Update lesson progress
  async updateLessonProgress(
    courseId: string,
    lessonId: string,
    data: {
      watchTime?: number;
      watchPercentage?: number;
      currentTime?: number;
    }
  ): Promise<any> {
    const response = await api.post(`/progress/lesson/${lessonId}`, {
      courseId,
      ...data
    });
    return response.data;
  }

  // Add note to lesson
  async addNote(
    courseId: string,
    lessonId: string,
    content: string,
    timestamp: number = 0
  ): Promise<Note> {
    const response = await api.post('/progress/notes', {
      courseId,
      lessonId,
      content,
      timestamp
    });
    return response.data;
  }

  // Get notes for a lesson
  async getLessonNotes(courseId: string, lessonId: string): Promise<Note[]> {
    const response = await api.get(`/progress/notes/${courseId}/${lessonId}`);
    return response.data;
  }

  // Add bookmark
  async addBookmark(
    courseId: string,
    lessonId: string,
    title: string,
    timestamp: number
  ): Promise<Bookmark> {
    const response = await api.post('/progress/bookmarks', {
      courseId,
      lessonId,
      title,
      timestamp
    });
    return response.data;
  }

  // Get bookmarks for a lesson
  async getLessonBookmarks(courseId: string, lessonId: string): Promise<Bookmark[]> {
    const response = await api.get(`/progress/bookmarks/${courseId}/${lessonId}`);
    return response.data;
  }

  // Delete bookmark
  async deleteBookmark(bookmarkId: string, courseId: string): Promise<void> {
    await api.delete(`/progress/bookmarks/${bookmarkId}?courseId=${courseId}`);
  }

  // Update video preferences
  async updatePreferences(
    courseId: string,
    preferences: {
      playbackSpeed?: number;
      autoplay?: boolean;
      quality?: string;
      subtitles?: boolean;
      language?: string;
    }
  ): Promise<any> {
    const response = await api.put('/progress/preferences', {
      courseId,
      ...preferences
    });
    return response.data;
  }

  // Get progress overview (dashboard)
  async getProgressOverview(): Promise<ProgressOverview> {
    const response = await api.get('/progress/overview');
    return response.data;
  }

  // Record quiz score
  async recordQuizScore(
    courseId: string,
    lessonId: string,
    data: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      timeSpent?: number;
    }
  ): Promise<QuizResult> {
    const response = await api.post(`/progress/quiz/${lessonId}`, {
      courseId,
      ...data
    });
    return response.data;
  }

  // Get study analytics
  async getStudyAnalytics(period: string = '30d'): Promise<any> {
    const response = await api.get(`/progress/analytics?period=${period}`);
    return response.data;
  }

  // Utility methods
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  formatTimestamp(timestamp: number): string {
    const minutes = Math.floor(timestamp / 60);
    const seconds = Math.floor(timestamp % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  calculateWatchPercentage(currentTime: number, duration: number): number {
    if (duration === 0) return 0;
    return Math.round((currentTime / duration) * 100);
  }

  isLessonCompleted(lessonId: string, completedLessons: LessonProgress[]): boolean {
    return completedLessons.some(lesson => lesson.lessonId === lessonId);
  }

  getLessonProgress(lessonId: string, completedLessons: LessonProgress[]): LessonProgress | null {
    return completedLessons.find(lesson => lesson.lessonId === lessonId) || null;
  }

  calculateCourseCompletion(completedLessons: LessonProgress[], totalLessons: number): number {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.length / totalLessons) * 100);
  }

  // Local storage helpers for offline progress
  saveOfflineProgress(courseId: string, lessonId: string, currentTime: number): void {
    try {
      const key = `offline_progress_${courseId}_${lessonId}`;
      const data = {
        currentTime,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save offline progress:', error);
    }
  }

  getOfflineProgress(courseId: string, lessonId: string): number {
    try {
      const key = `offline_progress_${courseId}_${lessonId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        // Only return progress if it's from the last 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.currentTime;
        }
      }
    } catch (error) {
      console.warn('Failed to get offline progress:', error);
    }
    return 0;
  }

  clearOfflineProgress(courseId: string, lessonId: string): void {
    try {
      const key = `offline_progress_${courseId}_${lessonId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear offline progress:', error);
    }
  }

  // Sync offline progress when coming back online
  async syncOfflineProgress(courseId: string): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith(`offline_progress_${courseId}_`)
      );

      for (const key of keys) {
        const lessonId = key.split('_').pop();
        if (lessonId) {
          const currentTime = this.getOfflineProgress(courseId, lessonId);
          if (currentTime > 0) {
            await this.updateLessonProgress(courseId, lessonId, { currentTime });
            this.clearOfflineProgress(courseId, lessonId);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to sync offline progress:', error);
    }
  }
}

export const progressService = new ProgressService();
export default progressService;