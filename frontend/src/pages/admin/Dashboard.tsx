import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'courses' && <AdminCourses />}
        {activeTab === 'payments' && <AdminPayments />}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
};

const AdminOverview: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-2xl font-bold text-blue-600 mb-2">1,234</div>
        <div className="text-sm text-gray-600">Total Users</div>
        <div className="text-green-600 text-sm">+12% from last month</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-2xl font-bold text-green-600 mb-2">89</div>
        <div className="text-sm text-gray-600">Active Courses</div>
        <div className="text-green-600 text-sm">+5% from last month</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-2xl font-bold text-purple-600 mb-2">$45,678</div>
        <div className="text-sm text-gray-600">Revenue (This Month)</div>
        <div className="text-green-600 text-sm">+18% from last month</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-2xl font-bold text-orange-600 mb-2">456</div>
        <div className="text-sm text-gray-600">New Enrollments</div>
        <div className="text-green-600 text-sm">+22% from last month</div>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">U</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New user registration</p>
                <p className="text-xs text-gray-500">john.doe@example.com • 2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AdminUsers: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <p className="text-gray-600">User management interface would go here.</p>
      </div>
    </div>
  </div>
);

const AdminCourses: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Management</h2>
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <p className="text-gray-600">Course management interface would go here.</p>
      </div>
    </div>
  </div>
);

const AdminPayments: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Management</h2>
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <p className="text-gray-600">Payment management interface would go here.</p>
      </div>
    </div>
  </div>
);

const AdminAnalytics: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <p className="text-gray-600">Analytics dashboard would go here.</p>
      </div>
    </div>
  </div>
);

const AdminSettings: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <p className="text-gray-600">System settings would go here.</p>
      </div>
    </div>
  </div>
);

export default AdminDashboard;