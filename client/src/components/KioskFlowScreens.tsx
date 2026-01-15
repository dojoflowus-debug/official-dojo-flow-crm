import React, { useState, useEffect } from 'react';
import { useKioskFlow } from '@/lib/kioskFlowContext';
import * as kioskDataProvider from '@/lib/kioskDataProvider';

export function KioskFlowScreens() {
  const { state, navigateTo, updateFlowData, goHome, goBack, recordActivity, enterStaffMode, exitStaffMode } = useKioskFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPressDuration, setLogoPressDuration] = useState(0);

  // Record activity on any interaction
  const handleInteraction = () => {
    recordActivity();
  };

  // Home Screen
  if (state.currentScreen === 'home') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8" onClick={handleInteraction}>
        {/* Logo with hidden staff login activation */}
        <div
          className="mb-8 cursor-pointer select-none"
          onMouseDown={() => setLogoPressDuration(0)}
          onMouseUp={() => {
            if (logoPressDuration > 3000) {
              enterStaffMode();
            }
          }}
          onTouchStart={() => setLogoPressDuration(0)}
          onTouchEnd={() => {
            if (logoPressDuration > 3000) {
              enterStaffMode();
            }
          }}
        >
          <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-5xl shadow-lg">
            🥋
          </div>
        </div>

        {/* Time Display */}
        <div className="text-white text-4xl font-bold mb-16">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Check In Card */}
          <button
            onClick={() => {
              handleInteraction();
              navigateTo('check-in-search');
            }}
            className="bg-amber-700 hover:bg-amber-600 rounded-2xl p-8 text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-5xl mb-4">✓</div>
            <div className="text-white text-2xl font-bold">Check In</div>
            <div className="text-amber-100 text-sm mt-2">Tap here to check into class</div>
          </button>

          {/* Start Training Card */}
          <button
            onClick={() => {
              handleInteraction();
              navigateTo('start-training-lead');
            }}
            className="bg-amber-700 hover:bg-amber-600 rounded-2xl p-8 text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-5xl mb-4">+</div>
            <div className="text-white text-2xl font-bold">Start Training</div>
            <div className="text-amber-100 text-sm mt-2">New students start here</div>
          </button>
        </div>

        {/* Get Started Button */}
        <button
          onClick={() => {
            handleInteraction();
            navigateTo('start-training-lead');
          }}
          className="mt-12 bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-12 rounded-full text-lg shadow-lg transition-all"
        >
          Get Started
        </button>
      </div>
    );
  }

  // Attract Mode Screen
  if (state.currentScreen === 'attract') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8" onClick={handleInteraction}>
        <div className="text-white text-5xl font-bold mb-8 animate-pulse">Welcome to DojoFlow</div>
        <div className="text-amber-100 text-2xl mb-16">Tap the screen to begin</div>
        <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center text-7xl shadow-lg animate-bounce">
          🥋
        </div>
      </div>
    );
  }

  // Check In - Search Screen
  if (state.currentScreen === 'check-in-search') {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const handleSearch = async (query: string) => {
      setSearchQuery(query);
      if (query.length > 1) {
        setLoading(true);
        try {
          const results = await kioskDataProvider.searchStudents(query);
          setSearchResults(results);
        } catch (err) {
          setError('Search failed');
        } finally {
          setLoading(false);
        }
      }
    };

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8" onClick={handleInteraction}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Find Your Name</h1>
          <button onClick={() => { handleInteraction(); goBack(); }} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg">
            Back
          </button>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-4 rounded-lg text-lg mb-6 focus:outline-none focus:ring-2 focus:ring-red-500"
          autoFocus
        />

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {searchResults.map(student => (
            <button
              key={student.id}
              onClick={() => {
                handleInteraction();
                updateFlowData({ selectedStudent: student });
                navigateTo('check-in-class');
              }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white p-4 rounded-lg text-left transition-all"
            >
              <div className="font-bold text-lg">{student.name}</div>
              <div className="text-amber-100 text-sm">{student.phone} • {student.belt} belt</div>
            </button>
          ))}
          {searchQuery && searchResults.length === 0 && !loading && (
            <div className="text-white text-center py-8">No students found</div>
          )}
        </div>

        {/* Home Button */}
        <button
          onClick={() => { handleInteraction(); goHome(); }}
          className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg"
        >
          Home
        </button>
      </div>
    );
  }

  // Check In - Class Selection Screen
  if (state.currentScreen === 'check-in-class') {
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
      kioskDataProvider.getClasses().then(setClasses);
    }, []);

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8" onClick={handleInteraction}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Select Class</h1>
          <button onClick={() => { handleInteraction(); goBack(); }} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg">
            Back
          </button>
        </div>

        <div className="text-white text-xl mb-6">
          Checking in: <span className="font-bold">{state.flowData.selectedStudent?.name}</span>
        </div>

        <div className="flex-1 space-y-4">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => {
                handleInteraction();
                updateFlowData({ selectedClass: cls });
                navigateTo('check-in-success');
              }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white p-6 rounded-lg text-left transition-all"
            >
              <div className="font-bold text-lg">{cls.name}</div>
              <div className="text-amber-100">{cls.time}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => { handleInteraction(); goHome(); }}
          className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg"
        >
          Home
        </button>
      </div>
    );
  }

  // Check In - Success Screen
  if (state.currentScreen === 'check-in-success') {
    useEffect(() => {
      const checkIn = async () => {
        try {
          await kioskDataProvider.checkInStudent(
            state.flowData.selectedStudent.id,
            state.flowData.selectedClass.id
          );
        } catch (err) {
          setError('Check-in failed');
        }
      };
      checkIn();

      const timer = setTimeout(() => {
        goHome();
      }, 5000);

      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-900 to-green-800 p-8" onClick={handleInteraction}>
        <div className="text-7xl mb-8">✓</div>
        <h1 className="text-white text-4xl font-bold mb-4">Check In Successful!</h1>
        <p className="text-green-100 text-2xl mb-8">{state.flowData.selectedStudent?.name}</p>
        <p className="text-green-100 text-lg">Returning to home in 5 seconds...</p>
      </div>
    );
  }

  // Start Training - Lead Capture Screen
  if (state.currentScreen === 'start-training-lead') {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8" onClick={handleInteraction}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">New Student Registration</h1>
          <button onClick={() => { handleInteraction(); goBack(); }} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg">
            Back
          </button>
        </div>

        <div className="flex-1 space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => {
              handleInteraction();
              updateFlowData(formData);
              navigateTo('start-training-program');
            }}
            disabled={!formData.name || !formData.phone || !formData.email}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white py-4 rounded-lg font-bold text-lg"
          >
            Next
          </button>
          <button
            onClick={() => { handleInteraction(); goHome(); }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  // Start Training - Program Selection Screen
  if (state.currentScreen === 'start-training-program') {
    const [programs, setPrograms] = useState<any[]>([]);

    useEffect(() => {
      kioskDataProvider.getPrograms().then(setPrograms);
    }, []);

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8" onClick={handleInteraction}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Select Program</h1>
          <button onClick={() => { handleInteraction(); goBack(); }} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg">
            Back
          </button>
        </div>

        <div className="flex-1 space-y-4">
          {programs.map(program => (
            <button
              key={program.id}
              onClick={() => {
                handleInteraction();
                updateFlowData({ selectedProgram: program });
                navigateTo('start-training-schedule');
              }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white p-6 rounded-lg text-left transition-all"
            >
              <div className="font-bold text-lg">{program.name}</div>
              <div className="text-amber-100">{program.ageRange}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => { handleInteraction(); goHome(); }}
          className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg"
        >
          Home
        </button>
      </div>
    );
  }

  // Start Training - Schedule Screen
  if (state.currentScreen === 'start-training-schedule') {
    const [selectedTime, setSelectedTime] = useState('');
    const times = ['10:00 AM', '2:00 PM', '4:00 PM', '6:00 PM', '7:30 PM'];

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8" onClick={handleInteraction}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Schedule Intro Class</h1>
          <button onClick={() => { handleInteraction(); goBack(); }} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg">
            Back
          </button>
        </div>

        <div className="text-white text-lg mb-6">
          Program: <span className="font-bold">{state.flowData.selectedProgram?.name}</span>
        </div>

        <div className="flex-1 space-y-3">
          {times.map(time => (
            <button
              key={time}
              onClick={() => {
                setSelectedTime(time);
                handleInteraction();
              }}
              className={`w-full p-4 rounded-lg font-bold text-lg transition-all ${
                selectedTime === time
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-700 hover:bg-amber-600 text-white'
              }`}
            >
              {time}
            </button>
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => {
              handleInteraction();
              updateFlowData({ scheduledTime: selectedTime });
              navigateTo('start-training-confirmation');
            }}
            disabled={!selectedTime}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white py-4 rounded-lg font-bold text-lg"
          >
            Confirm
          </button>
          <button
            onClick={() => { handleInteraction(); goHome(); }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  // Start Training - Confirmation Screen
  if (state.currentScreen === 'start-training-confirmation') {
    useEffect(() => {
      const createLead = async () => {
        try {
          await kioskDataProvider.createLead({
            name: state.flowData.name,
            phone: state.flowData.phone,
            email: state.flowData.email,
            program: state.flowData.selectedProgram.id,
            scheduledTime: state.flowData.scheduledTime,
          });
        } catch (err) {
          setError('Failed to create lead');
        }
      };
      createLead();

      const timer = setTimeout(() => {
        goHome();
      }, 5000);

      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-900 to-green-800 p-8" onClick={handleInteraction}>
        <div className="text-7xl mb-8">✓</div>
        <h1 className="text-white text-4xl font-bold mb-4">Welcome!</h1>
        <p className="text-green-100 text-2xl mb-2">{state.flowData.name}</p>
        <p className="text-green-100 text-lg mb-8">Your intro class is scheduled for {state.flowData.scheduledTime}</p>
        <p className="text-green-100">Staff will contact you shortly</p>
        <p className="text-green-100 text-sm mt-8">Returning to home in 5 seconds...</p>
      </div>
    );
  }

  // Staff Login - PIN Screen
  if (state.currentScreen === 'staff-login-pin') {
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);

    const handlePinSubmit = async () => {
      const isValid = await kioskDataProvider.verifyStaffPin(pin);
      if (isValid) {
        navigateTo('staff-tools');
      } else {
        setPinError(true);
        setTimeout(() => setPinError(false), 2000);
        setPin('');
      }
    };

    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-900 to-slate-800 p-8" onClick={handleInteraction}>
        <h1 className="text-white text-4xl font-bold mb-12">Staff Login</h1>
        
        <div className="bg-slate-700 p-8 rounded-lg mb-8 min-w-80">
          <div className="text-white text-center text-4xl tracking-widest font-mono mb-8">
            {pin.padEnd(4, '•')}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => {
                  if (pin.length < 4) {
                    setPin(pin + num);
                    handleInteraction();
                  }
                }}
                className="bg-slate-600 hover:bg-slate-500 text-white p-4 rounded-lg text-2xl font-bold"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => {
                if (pin.length < 4) {
                  setPin(pin + '0');
                  handleInteraction();
                }
              }}
              className="col-span-2 bg-slate-600 hover:bg-slate-500 text-white p-4 rounded-lg text-2xl font-bold"
            >
              0
            </button>
            <button
              onClick={() => setPin(pin.slice(0, -1))}
              className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-lg text-xl font-bold"
            >
              ← Del
            </button>
          </div>

          {pinError && <div className="text-red-400 text-center mb-4">Invalid PIN</div>}

          <button
            onClick={handlePinSubmit}
            disabled={pin.length !== 4}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-bold text-lg"
          >
            Enter
          </button>
        </div>

        <button
          onClick={() => { handleInteraction(); exitStaffMode(); }}
          className="mt-8 bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Staff Tools Screen
  if (state.currentScreen === 'staff-tools') {
    const [leads, setLeads] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);

    useEffect(() => {
      kioskDataProvider.getAllLeads().then(setLeads);
      kioskDataProvider.getAttendanceRecords().then(setAttendance);
    }, []);

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 p-8" onClick={handleInteraction}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Staff Tools</h1>
          <button
            onClick={() => { handleInteraction(); exitStaffMode(); }}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg"
          >
            Exit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8 flex-1">
          {/* Recent Leads */}
          <div className="bg-slate-700 p-6 rounded-lg overflow-y-auto">
            <h2 className="text-white text-xl font-bold mb-4">Recent Leads ({leads.length})</h2>
            <div className="space-y-3">
              {leads.slice(-5).reverse().map(lead => (
                <div key={lead.id} className="bg-slate-600 p-3 rounded text-white text-sm">
                  <div className="font-bold">{lead.name}</div>
                  <div className="text-slate-300">{lead.phone}</div>
                  <div className="text-slate-400 text-xs">{lead.program} @ {lead.scheduledTime}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance */}
          <div className="bg-slate-700 p-6 rounded-lg overflow-y-auto">
            <h2 className="text-white text-xl font-bold mb-4">Today's Attendance ({attendance.length})</h2>
            <div className="space-y-3">
              {attendance.slice(-5).reverse().map((record, idx) => (
                <div key={idx} className="bg-slate-600 p-3 rounded text-white text-sm">
                  <div className="font-bold">Student ID: {record.studentId}</div>
                  <div className="text-slate-300">Class ID: {record.classId}</div>
                  <div className="text-slate-400 text-xs">{new Date(record.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => { handleInteraction(); exitStaffMode(); }}
          className="mt-8 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return null;
}
