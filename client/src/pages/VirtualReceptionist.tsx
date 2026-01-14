import React, { useState } from 'react';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, UserPlus, Calendar, Clock, User, CheckCircle } from 'lucide-react';

export default function VirtualReceptionist({ onLogout, theme, toggleTheme }) {
  const [recentActivity] = useState([
    {
      id: 1,
      type: 'call',
      contact: 'Sarah Johnson',
      action: 'Incoming call answered',
      time: '2 minutes ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'email',
      contact: 'Mike Chen',
      action: 'Email sent about class schedule',
      time: '15 minutes ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'sms',
      contact: 'Emily Davis',
      action: 'SMS reminder sent',
      time: '1 hour ago',
      status: 'completed'
    },
    {
      id: 4,
      type: 'enrollment',
      contact: 'Tom Wilson',
      action: 'New student enrolled',
      time: '2 hours ago',
      status: 'completed'
    }
  ]);

  const [stats] = useState({
    callsToday: 24,
    emailsSent: 18,
    smsMessages: 32,
    newEnrollments: 3
  });

  return (
    <BottomNavLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Virtual Receptionist</h1>
            <p className="text-gray-400">Manage communications and student enrollment</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <UserPlus className="h-5 w-5" />
            Enroll New Student
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Calls Today</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.callsToday}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Emails Sent</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.emailsSent}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Mail className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">SMS Messages</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.smsMessages}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">New Enrollments</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.newEnrollments}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <UserPlus className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Make a Call</h3>
                <p className="text-sm text-gray-400">Contact students or leads</p>
              </div>
            </div>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <Mail className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Send Email</h3>
                <p className="text-sm text-gray-400">Email campaigns and updates</p>
              </div>
            </div>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Send SMS</h3>
                <p className="text-sm text-gray-400">Quick text messages</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <p className="text-gray-400 text-sm mt-1">Latest communications and actions</p>
          </div>

          <div className="divide-y divide-gray-700">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-750 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    activity.type === 'call' ? 'bg-blue-500/10' :
                    activity.type === 'email' ? 'bg-green-500/10' :
                    activity.type === 'sms' ? 'bg-purple-500/10' :
                    'bg-yellow-500/10'
                  }`}>
                    {activity.type === 'call' && <Phone className="h-5 w-5 text-blue-500" />}
                    {activity.type === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                    {activity.type === 'sms' && <MessageSquare className="h-5 w-5 text-purple-500" />}
                    {activity.type === 'enrollment' && <UserPlus className="h-5 w-5 text-yellow-500" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium">{activity.contact}</h4>
                        <p className="text-gray-400 text-sm mt-1">{activity.action}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-gray-400">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-750 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-white font-medium">Follow up with trial class attendees</p>
                <p className="text-gray-400 text-sm">5 contacts to reach out to</p>
              </div>
              <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                View
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-750 rounded-lg">
              <Clock className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-white font-medium">Send monthly newsletter</p>
                <p className="text-gray-400 text-sm">Scheduled for tomorrow</p>
              </div>
              <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                Edit
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-750 rounded-lg">
              <User className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <p className="text-white font-medium">Review pending enrollment applications</p>
                <p className="text-gray-400 text-sm">3 applications waiting</p>
              </div>
              <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </BottomNavLayout>
  );
}

