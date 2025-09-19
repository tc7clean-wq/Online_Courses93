import React, { useState } from 'react';

const Help: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'learning', label: 'Learning', icon: '🎓' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'technical', label: 'Technical Issues', icon: '🔧' },
    { id: 'contact', label: 'Contact Support', icon: '💬' }
  ];

  const helpContent = {
    'getting-started': [
      {
        question: 'How do I get started with LearnHub?',
        answer: 'Welcome to LearnHub! Start by browsing our course catalog, enrolling in courses that interest you, and begin your learning journey. Your progress is automatically tracked in your dashboard.'
      },
      {
        question: 'How do I navigate the platform?',
        answer: 'Use the navigation bar at the top to access courses, your dashboard, and profile settings. The dashboard shows your enrolled courses and learning progress.'
      },
      {
        question: 'What types of courses are available?',
        answer: 'We offer a wide range of self-paced courses including programming, design, business, marketing, and more. All courses include video lessons, resources, and progress tracking.'
      }
    ],
    'courses': [
      {
        question: 'How do I enroll in a course?',
        answer: 'Browse our course catalog, click on a course that interests you, review the details, and click "Enroll Now". You can start learning immediately after enrollment.'
      },
      {
        question: 'Are courses self-paced?',
        answer: 'Yes! All our courses are designed for self-paced learning. You can learn at your own speed and revisit lessons anytime.'
      },
      {
        question: 'Do I get a certificate upon completion?',
        answer: 'Yes, you receive a certificate of completion for each course you finish. Certificates can be downloaded from your dashboard.'
      }
    ],
    'learning': [
      {
        question: 'How do I track my progress?',
        answer: 'Your progress is automatically tracked as you complete lessons. Check your dashboard to see completion percentages and learning analytics.'
      },
      {
        question: 'Can I download course materials?',
        answer: 'Many courses include downloadable resources like PDFs, code files, and supplementary materials available in each lesson.'
      },
      {
        question: 'What if I get stuck on a lesson?',
        answer: 'You can replay lessons anytime, access course resources, or use our help feature to get assistance. Each course also has a community discussion area.'
      }
    ],
    'account': [
      {
        question: 'How do I update my profile?',
        answer: 'Go to your Profile page from the navigation menu. You can update your personal information, preferences, and account settings there.'
      },
      {
        question: 'How do I change my password?',
        answer: 'In your Profile page, go to the Security tab where you can change your password and update security settings.'
      },
      {
        question: 'Can I change my email address?',
        answer: 'Yes, you can update your email address in the Profile settings. You\'ll receive a confirmation email to verify the new address.'
      }
    ],
    'technical': [
      {
        question: 'Videos won\'t play or are buffering',
        answer: 'Try refreshing the page, checking your internet connection, or switching to a different browser. Clear your browser cache if issues persist.'
      },
      {
        question: 'I\'m having trouble logging in',
        answer: 'Make sure you\'re using the correct email and password. If you forgot your password, use the "Forgot Password" link on the login page.'
      },
      {
        question: 'The website is running slowly',
        answer: 'This could be due to internet connectivity. Try refreshing the page, clearing your browser cache, or trying a different browser.'
      }
    ],
    'contact': [
      {
        question: 'How can I contact support?',
        answer: 'You can reach our support team at support@learnhub.com or use the contact form below. We typically respond within 24 hours.'
      },
      {
        question: 'What are your support hours?',
        answer: 'Our support team is available Monday through Friday, 9 AM to 6 PM EST. For urgent issues, please mark your message as "urgent".'
      }
    ]
  };

  const filteredContent = helpContent[activeCategory as keyof typeof helpContent]?.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium">{category.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Help Content */}
          <div className="lg:col-span-3">
            {activeCategory === 'contact' ? (
              <ContactForm />
            ) : (
              <div className="space-y-4">
                {filteredContent.length > 0 ? (
                  filteredContent.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {item.question}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or browse by category.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Help Actions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setActiveCategory('contact')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
              <a
                href="mailto:support@learnhub.com"
                className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Support request submitted:', formData);
    alert('Your support request has been submitted. We\'ll get back to you within 24 hours!');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      priority: 'normal'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Support</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={formData.message}
            onChange={handleChange}
            placeholder="Please describe your issue or question in detail..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
};

export default Help;