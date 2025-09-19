import api from './api';
import { User } from './auth';

export interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  instructor: User;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  thumbnail: string;
  previewVideo?: string;
  modules: Module[];
  pricing: {
    basic: {
      price: number;
      priceId?: string;
      features: string[];
    };
    premium?: {
      price: number;
      priceId?: string;
      features: string[];
    };
    vip?: {
      price: number;
      priceId?: string;
      features: string[];
    };
  };
  totalDuration: number;
  totalLessons: number;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  hasCertificate: boolean;
  hasQuizzes: boolean;
  hasDownloads: boolean;
  launchDate?: string;
  createdAt: string;
  updatedAt: string;
  formattedDuration: string;
  url: string;
}

export interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoDuration: number;
  order: number;
  resources: Resource[];
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  title: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'excel' | 'zip' | 'other';
}

export interface CourseFilters {
  category?: string;
  level?: string;
  sortBy?: 'popular' | 'rating' | 'newest' | 'price-low' | 'price-high';
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CourseCategory {
  name: string;
  count: number;
  averageRating: number;
}

export interface CourseDetail extends Course {
  enrollmentStatus?: {
    isEnrolled: boolean;
    packageType?: string;
    enrollmentStatus?: string;
    enrolledAt?: string;
  };
  progress?: {
    completedLessons: string[];
    completionPercentage: number;
    lastAccessedLesson?: any;
  };
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  wouldRecommend: boolean;
  difficulty: 'too-easy' | 'just-right' | 'too-hard';
  completionPercentage: number;
  isVerifiedPurchase: boolean;
  helpfulVotes: {
    count: number;
  };
  unhelpfulVotes: {
    count: number;
  };
  response?: {
    content: string;
    respondedBy: {
      name: string;
    };
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  stats: {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  pagination: {
    current: number;
    hasNext: boolean;
  };
}

export interface CreateCourseData {
  title: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  level: string;
  language?: string;
  thumbnail: string;
  previewVideo?: string;
  pricing: {
    basic: {
      price: number;
      features: string[];
    };
    premium?: {
      price: number;
      features: string[];
    };
    vip?: {
      price: number;
      features: string[];
    };
  };
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  hasCertificate?: boolean;
  hasQuizzes?: boolean;
  hasDownloads?: boolean;
}

export interface CreateModuleData {
  title: string;
  description: string;
  order: number;
}

export interface CreateLessonData {
  title: string;
  description: string;
  videoUrl: string;
  videoDuration: number;
  order: number;
  resources?: Resource[];
  isPreview?: boolean;
}

class CourseService {
  // Public course methods
  async getAllCourses(filters: CourseFilters = {}): Promise<CoursesResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/courses?${params.toString()}`);
    return response.data;
  }

  async getFeaturedCourses(limit: number = 6): Promise<Course[]> {
    const response = await api.get(`/courses/featured?limit=${limit}`);
    return response.data;
  }

  async getCategories(): Promise<CourseCategory[]> {
    const response = await api.get('/courses/categories');
    return response.data;
  }

  async searchCourses(query: string, page: number = 1, limit: number = 12): Promise<CoursesResponse> {
    const response = await api.get(`/courses/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  }

  async getCourseBySlug(slug: string, includeModules: boolean = false): Promise<CourseDetail> {
    const response = await api.get(`/courses/${slug}?includeModules=${includeModules}`);
    return response.data;
  }

  async getCourseReviews(
    slug: string,
    options: {
      rating?: number;
      sortBy?: 'helpful' | 'recent' | 'rating-high' | 'rating-low';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ReviewsResponse> {
    const params = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/courses/${slug}/reviews?${params.toString()}`);
    return response.data;
  }

  // Enrolled student methods
  async enrollInCourse(courseId: string, packageType: string, paymentIntentId?: string): Promise<any> {
    const response = await api.post(`/courses/${courseId}/enroll`, {
      packageType,
      paymentIntentId
    });
    return response.data;
  }

  async checkCourseAccess(courseId: string): Promise<any> {
    const response = await api.get(`/courses/${courseId}/access`);
    return response.data;
  }

  async getCourseProgress(courseId: string): Promise<any> {
    const response = await api.get(`/courses/${courseId}/progress`);
    return response.data;
  }

  async updateLessonProgress(
    courseId: string,
    lessonId: string,
    data: {
      watchTime?: number;
      watchPercentage?: number;
      currentTime?: number;
    }
  ): Promise<any> {
    const response = await api.post(`/courses/${courseId}/progress/lesson/${lessonId}`, data);
    return response.data;
  }

  async createReview(courseId: string, reviewData: {
    rating: number;
    title: string;
    content: string;
    pros?: string[];
    cons?: string[];
    wouldRecommend?: boolean;
  }): Promise<Review> {
    const response = await api.post(`/courses/${courseId}/reviews`, reviewData);
    return response.data;
  }

  // Instructor methods
  async createCourse(courseData: CreateCourseData): Promise<Course> {
    const response = await api.post('/courses', courseData);
    return response.data;
  }

  async updateCourse(courseId: string, courseData: Partial<CreateCourseData>): Promise<Course> {
    const response = await api.put(`/courses/${courseId}`, courseData);
    return response.data;
  }

  async deleteCourse(courseId: string): Promise<void> {
    await api.delete(`/courses/${courseId}`);
  }

  async publishCourse(courseId: string): Promise<Course> {
    const response = await api.post(`/courses/${courseId}/publish`);
    return response.data;
  }

  async unpublishCourse(courseId: string): Promise<Course> {
    const response = await api.post(`/courses/${courseId}/unpublish`);
    return response.data;
  }

  // Module management
  async addModule(courseId: string, moduleData: CreateModuleData): Promise<Module> {
    const response = await api.post(`/courses/${courseId}/modules`, moduleData);
    return response.data;
  }

  async updateModule(courseId: string, moduleId: string, moduleData: Partial<CreateModuleData>): Promise<Module> {
    const response = await api.put(`/courses/${courseId}/modules/${moduleId}`, moduleData);
    return response.data;
  }

  async deleteModule(courseId: string, moduleId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/modules/${moduleId}`);
  }

  // Lesson management
  async addLesson(courseId: string, moduleId: string, lessonData: CreateLessonData): Promise<Lesson> {
    const response = await api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, lessonData);
    return response.data;
  }

  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    lessonData: Partial<CreateLessonData>
  ): Promise<Lesson> {
    const response = await api.put(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, lessonData);
    return response.data;
  }

  async deleteLesson(courseId: string, moduleId: string, lessonId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  }

  // Analytics
  async getCourseAnalytics(courseId: string, period: string = '30d'): Promise<any> {
    const response = await api.get(`/courses/${courseId}/analytics?period=${period}`);
    return response.data;
  }

  async getCourseStudents(courseId: string, page: number = 1, limit: number = 20): Promise<any> {
    const response = await api.get(`/courses/${courseId}/students?page=${page}&limit=${limit}`);
    return response.data;
  }
}

export const courseService = new CourseService();
export default courseService;