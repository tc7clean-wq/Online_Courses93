import api from './api';

export interface EnrollmentData {
  tier: 'basic' | 'premium';
  paymentMethod: {
    type: 'card' | 'paypal';
    cardDetails?: {
      number: string;
      expiry: string;
      cvc: string;
      name: string;
    };
    billingAddress?: {
      country: string;
      state: string;
      city: string;
      zipCode: string;
    };
  };
}

export interface Enrollment {
  _id: string;
  user: string;
  course: string;
  tier: 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  enrolledAt: string;
  expiresAt?: string;
  paymentDetails: {
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paidAt: string;
  };
  progress: {
    completionPercentage: number;
    lastAccessedAt: string;
    certificateIssued: boolean;
  };
  access: {
    hasLifetimeAccess: boolean;
    canDownloadResources: boolean;
    canAccessCommunity: boolean;
  };
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

class EnrollmentService {
  // Enroll in a course
  async enrollInCourse(courseId: string, data: EnrollmentData): Promise<Enrollment> {
    const response = await api.post(`/enrollments/${courseId}`, data);
    return response.data;
  }

  // Create payment intent for Stripe
  async createPaymentIntent(courseId: string, tier: 'basic' | 'premium'): Promise<PaymentIntent> {
    const response = await api.post(`/enrollments/${courseId}/payment-intent`, { tier });
    return response.data;
  }

  // Confirm payment and complete enrollment
  async confirmPayment(courseId: string, paymentIntentId: string): Promise<Enrollment> {
    const response = await api.post(`/enrollments/${courseId}/confirm-payment`, {
      paymentIntentId
    });
    return response.data;
  }

  // Get user's enrollments
  async getUserEnrollments(): Promise<Enrollment[]> {
    const response = await api.get('/enrollments/my-courses');
    return response.data;
  }

  // Get specific enrollment
  async getEnrollment(courseId: string): Promise<Enrollment> {
    const response = await api.get(`/enrollments/${courseId}`);
    return response.data;
  }

  // Check if user is enrolled in course
  async checkEnrollment(courseId: string): Promise<{ enrolled: boolean; enrollment?: Enrollment }> {
    try {
      const enrollment = await this.getEnrollment(courseId);
      return { enrolled: true, enrollment };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { enrolled: false };
      }
      throw error;
    }
  }

  // Cancel enrollment
  async cancelEnrollment(courseId: string): Promise<void> {
    await api.delete(`/enrollments/${courseId}`);
  }

  // Request refund
  async requestRefund(courseId: string, reason: string): Promise<void> {
    await api.post(`/enrollments/${courseId}/refund`, { reason });
  }

  // Download certificate
  async downloadCertificate(courseId: string): Promise<Blob> {
    const response = await api.get(`/enrollments/${courseId}/certificate`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get enrollment analytics (for instructors)
  async getEnrollmentAnalytics(courseId: string, period: string = '30d'): Promise<any> {
    const response = await api.get(`/enrollments/${courseId}/analytics?period=${period}`);
    return response.data;
  }

  // Apply coupon code
  async applyCoupon(courseId: string, couponCode: string): Promise<{
    valid: boolean;
    discount: {
      type: 'percentage' | 'fixed';
      value: number;
      maxDiscount?: number;
    };
    finalPrice: number;
  }> {
    const response = await api.post(`/enrollments/${courseId}/apply-coupon`, {
      couponCode
    });
    return response.data;
  }

  // Get available payment methods
  async getPaymentMethods(): Promise<{
    cards: Array<{
      id: string;
      brand: string;
      last4: string;
      expiryMonth: number;
      expiryYear: number;
    }>;
    defaultPaymentMethod?: string;
  }> {
    const response = await api.get('/enrollments/payment-methods');
    return response.data;
  }

  // Add payment method
  async addPaymentMethod(paymentMethodId: string): Promise<void> {
    await api.post('/enrollments/payment-methods', { paymentMethodId });
  }

  // Update default payment method
  async updateDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await api.put('/enrollments/payment-methods/default', { paymentMethodId });
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await api.delete(`/enrollments/payment-methods/${paymentMethodId}`);
  }

  // Get enrollment history
  async getEnrollmentHistory(): Promise<Array<{
    _id: string;
    course: {
      _id: string;
      title: string;
      slug: string;
      thumbnail: string;
    };
    enrolledAt: string;
    completedAt?: string;
    certificateDownloadedAt?: string;
    status: string;
  }>> {
    const response = await api.get('/enrollments/history');
    return response.data;
  }

  // Get wishlist
  async getWishlist(): Promise<Array<{
    _id: string;
    course: {
      _id: string;
      title: string;
      slug: string;
      thumbnail: string;
      pricing: any;
    };
    addedAt: string;
  }>> {
    const response = await api.get('/enrollments/wishlist');
    return response.data;
  }

  // Add to wishlist
  async addToWishlist(courseId: string): Promise<void> {
    await api.post('/enrollments/wishlist', { courseId });
  }

  // Remove from wishlist
  async removeFromWishlist(courseId: string): Promise<void> {
    await api.delete(`/enrollments/wishlist/${courseId}`);
  }

  // Get course recommendations
  async getRecommendations(): Promise<Array<{
    _id: string;
    title: string;
    slug: string;
    thumbnail: string;
    instructor: any;
    pricing: any;
    averageRating: number;
    enrollmentCount: number;
    recommendationReason: string;
  }>> {
    const response = await api.get('/enrollments/recommendations');
    return response.data;
  }

  // Track course view for recommendations
  async trackCourseView(courseId: string): Promise<void> {
    await api.post(`/enrollments/track-view/${courseId}`);
  }

  // Get learning path progress
  async getLearningPathProgress(pathId: string): Promise<{
    path: any;
    progress: {
      completedCourses: string[];
      totalCourses: number;
      completionPercentage: number;
      estimatedTimeRemaining: number;
    };
  }> {
    const response = await api.get(`/enrollments/learning-paths/${pathId}/progress`);
    return response.data;
  }

  // Enroll in learning path
  async enrollInLearningPath(pathId: string): Promise<void> {
    await api.post(`/enrollments/learning-paths/${pathId}`);
  }

  // Gift course to someone
  async giftCourse(courseId: string, data: {
    recipientEmail: string;
    recipientName: string;
    message: string;
    deliveryDate?: string;
  }): Promise<{
    giftId: string;
    redemptionCode: string;
  }> {
    const response = await api.post(`/enrollments/${courseId}/gift`, data);
    return response.data;
  }

  // Redeem gift
  async redeemGift(redemptionCode: string): Promise<Enrollment> {
    const response = await api.post('/enrollments/redeem-gift', { redemptionCode });
    return response.data;
  }

  // Utility methods
  formatPrice(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  calculateDiscount(originalPrice: number, discount: { type: 'percentage' | 'fixed'; value: number; maxDiscount?: number }): number {
    if (discount.type === 'percentage') {
      const discountAmount = originalPrice * (discount.value / 100);
      return discount.maxDiscount ? Math.min(discountAmount, discount.maxDiscount) : discountAmount;
    } else {
      return Math.min(discount.value, originalPrice);
    }
  }

  isEnrollmentActive(enrollment: Enrollment): boolean {
    if (enrollment.status !== 'active') return false;
    if (!enrollment.expiresAt) return true; // No expiration
    return new Date(enrollment.expiresAt) > new Date();
  }

  getDaysUntilExpiration(enrollment: Enrollment): number | null {
    if (!enrollment.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(enrollment.expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  canAccessCourse(enrollment: Enrollment): boolean {
    return this.isEnrollmentActive(enrollment) && enrollment.status === 'active';
  }

  canDownloadCertificate(enrollment: Enrollment): boolean {
    return (
      this.canAccessCourse(enrollment) &&
      enrollment.progress.completionPercentage >= 80 &&
      !enrollment.progress.certificateIssued
    );
  }

  canRequestRefund(enrollment: Enrollment): boolean {
    const enrolledAt = new Date(enrollment.enrolledAt);
    const now = new Date();
    const daysSinceEnrollment = (now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24);

    return (
      enrollment.status === 'active' &&
      daysSinceEnrollment <= 30 && // 30-day refund policy
      enrollment.progress.completionPercentage < 20 // Less than 20% completed
    );
  }
}

export const enrollmentService = new EnrollmentService();
export default enrollmentService;