import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import StatusBadge from "../components/StatusBadge";

export default function ActiveStaffList() {
  const [activeStaff, setActiveStaff] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [peakHours, setPeakHours] = useState({ current: 0, peak: 0 });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "attendance"), where("date", "==", today));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data());
      
      // Your existing logic for active staff
      const latestStatus = {};
      logs.forEach(log => {
        if (!latestStatus[log.userId] || log.timestamp > latestStatus[log.userId].timestamp) {
          latestStatus[log.userId] = log;
        }
      });

      const currentlyIn = Object.values(latestStatus).filter(log => log.type === "IN");
      setActiveStaff(currentlyIn);
      
      // Calculate stats (you can fetch total employees from another collection)
      const uniqueUsers = new Set(logs.map(log => log.userId));
      setTotalEmployees(uniqueUsers.size);
      
      // Calculate peak hours (simplified example)
      const hourCounts = {};
      logs.forEach(log => {
        const hour = log.timestamp?.toDate().getHours() || 0;
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const maxHour = Object.keys(hourCounts).reduce((a, b) => 
        hourCounts[a] > hourCounts[b] ? a : b, 0
      );
      setPeakHours({
        current: activeStaff.length,
        peak: hourCounts[maxHour] || 0
      });
    });

    return () => unsubscribe();
  }, [activeStaff.length]);

  const getCurrentHour = () => {
    return new Date().getHours();
  };

  const isPeakHour = () => {
    const hour = getCurrentHour();
    return hour >= 9 && hour <= 11;
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-xl p-6 mt-8">
      {/* Header Section with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Active Workforce Dashboard</h2>
          <p className="text-slate-600 text-sm mt-1">Real-time employee presence tracking</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">Live Updates</span>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isPeakHour() ? 'bg-amber-50' : 'bg-emerald-50'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              isPeakHour() ? 'bg-amber-500' : 'bg-emerald-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              isPeakHour() ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {isPeakHour() ? 'Peak Hours' : 'Normal Hours'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Currently Active</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{activeStaff.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">Out of {totalEmployees} total employees</p>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-5 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Peak Today</p>
              <p className="text-3xl font-bold text-emerald-900 mt-2">{peakHours.peak}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-3">Highest concurrent attendance</p>
        </div>

        <div className="bg-gradient-to-r from-violet-50 to-violet-100/50 p-5 rounded-xl border border-violet-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-violet-700 font-medium">Current Time</p>
              <p className="text-2xl font-bold text-violet-900 mt-2">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-violet-600 mt-3">Office hours: 9:00 AM - 6:00 PM</p>
        </div>
      </div>

      {/* Active Staff Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Currently Clocked In</h3>
          <div className="text-sm text-slate-500">
            <span className="font-medium">{activeStaff.length}</span> of {totalEmployees} present
          </div>
        </div>

        {activeStaff.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeStaff.map((staff) => {
              const clockInTime = staff.timestamp?.toDate();
              const hoursActive = clockInTime ? 
                Math.floor((new Date() - clockInTime) / (1000 * 60 * 60)) : 0;
              
              return (
                <div 
                  key={staff.userId} 
                  className="group bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Status Indicator */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {staff.userId.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Staff Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{staff.userId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-slate-600">
                          Active for {hoursActive}h
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Clocked In</p>
                        <p className="text-sm font-medium text-slate-800">
                          {clockInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <StatusBadge status={staff.status} />
                    </div>
                    
                    {/* Progress bar for work duration */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Work Duration</span>
                        <span>{hoursActive}h / 8h</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(hoursActive * 12.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-slate-700 mb-2">No Active Employees</h4>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              All employees are currently clocked out. Office hours are from 9:00 AM to 6:00 PM.
            </p>
          </div>
        )}
      </div>

      {/* Footer with Live Status */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-700">Connected to Firestore</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
            <span className="text-sm text-slate-500">
              Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Report
            </button>
            <button className="text-sm text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}