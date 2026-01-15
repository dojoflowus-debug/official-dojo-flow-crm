import { useState } from 'react';
import { useKioskFlow } from '@/lib/kioskFlowContext';
import * as kioskDataProvider from '@/lib/kioskDataProvider';

interface KioskFlowScreensProps {
  logoDataUrl?: string;
  contentData?: { headline: string; subheadline: string; helper?: string; footer?: string };
  kioskConfig?: any; // Full kiosk config with theme values
}

export function KioskFlowScreens({ logoDataUrl, contentData, kioskConfig }: KioskFlowScreensProps) {
  const { state, navigateTo, updateFlowData, goHome, goBack, recordActivity, enterStaffMode, exitStaffMode } = useKioskFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPressDuration, setLogoPressDuration] = useState(0);

  // Default content
  const defaultContent = {
    headline: 'Welcome',
    subheadline: 'Tap the screen to begin',
    helper: '',
    footer: '',
  };

  const content = contentData || defaultContent;

  // Record activity on any interaction
  const handleInteraction = () => {
    recordActivity();
  };

  // Home Screen
  if (state.currentScreen === 'home') {
    // Get background image from kioskConfig or use fallback gradient
    const backgroundImage = kioskConfig?.backgroundImage || 'linear-gradient(to bottom, rgb(120, 53, 15), rgb(92, 51, 23))';
    
    // DEBUG: Log the background image value
    if (process.env.NODE_ENV === 'development') {
      console.log('[KioskFlowScreens] Background image value:', {
        value: backgroundImage,
        type: typeof backgroundImage,
        length: typeof backgroundImage === 'string' ? backgroundImage.length : 'N/A',
        isGradient: typeof backgroundImage === 'string' && (backgroundImage.startsWith('linear-gradient') || backgroundImage.startsWith('radial-gradient')),
      });
    }
    
    // Handle bundled image imports and gradients properly
    let bgImageValue = backgroundImage;
    if (typeof backgroundImage === 'string' && !backgroundImage.startsWith('linear-gradient') && !backgroundImage.startsWith('radial-gradient')) {
      bgImageValue = `url(${backgroundImage})`;
    }
    
    const backgroundStyle: React.CSSProperties = {
      backgroundImage: bgImageValue,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    };

    return (
      <div className="flex flex-col items-center justify-center h-full p-8" style={backgroundStyle} onClick={handleInteraction}>
        {/* DEBUG: Show environment and background info in dev mode */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: '6px 10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: 999,
            maxWidth: '220px'
          }}>
            <div>Env: {kioskConfig?.environmentId || 'none'}</div>
            <div style={{ fontSize: '9px', marginTop: '3px', opacity: 0.7 }}>BG: {kioskConfig?.backgroundImage ? 'loaded' : 'fallback'}</div>
          </div>
        )}
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
          {logoDataUrl ? (
            <img 
              src={logoDataUrl} 
              alt="School Logo" 
              className="w-24 h-24 rounded-full shadow-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-5xl shadow-lg">
              🥋
            </div>
          )}
        </div>

        {/* Time Display */}
        <div className="text-white text-4xl font-bold mb-16">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>

        {/* Headline */}
        {content.headline && (
          <div className="text-white text-3xl font-bold mb-4 text-center">
            {content.headline}
          </div>
        )}

        {/* Subheadline */}
        {content.subheadline && (
          <div className="text-amber-100 text-lg mb-12 text-center">
            {content.subheadline}
          </div>
        )}

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

        {/* Helper Text */}
        {content.helper && (
          <div className="text-amber-100 text-sm mt-8 text-center">
            {content.helper}
          </div>
        )}

        {/* Footer Text */}
        {content.footer && (
          <div className="text-amber-100 text-xs mt-4 text-center opacity-75">
            {content.footer}
          </div>
        )}
      </div>
    );
  }

  // Attract Mode Screen
  if (state.currentScreen === 'attract') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8" onClick={handleInteraction}>
        <div className="text-white text-5xl font-bold mb-8 animate-pulse">{content.headline || 'Welcome'}</div>
        <div className="text-amber-100 text-2xl mb-16">{content.subheadline || 'Tap the screen to begin'}</div>
        {logoDataUrl ? (
          <img 
            src={logoDataUrl} 
            alt="School Logo" 
            className="w-32 h-32 rounded-full shadow-lg object-cover animate-bounce"
          />
        ) : (
          <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center text-7xl shadow-lg animate-bounce">
            🥋
          </div>
        )}
      </div>
    );
  }

  // Check In - Search Screen
  if (state.currentScreen === 'check-in-search') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8">
        <button onClick={goBack} className="absolute top-4 left-4 text-white text-lg">← Back</button>
        <h1 className="text-white text-3xl font-bold mb-8">Find Your Name</h1>
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className="w-full max-w-md px-4 py-3 rounded-lg mb-8"
          onChange={(e) => updateFlowData({ searchQuery: e.target.value })}
        />
        <div className="space-y-2 w-full max-w-md">
          {kioskDataProvider.mockStudents.map(student => (
            <button
              key={student.id}
              onClick={() => {
                updateFlowData({ selectedStudentId: student.id });
                navigateTo('check-in-confirm');
              }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white p-4 rounded-lg text-left"
            >
              {student.name} - {student.phone}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Check In - Confirm Screen
  if (state.currentScreen === 'check-in-confirm') {
    const student = kioskDataProvider.mockStudents.find(s => s.id === state.flowData.selectedStudentId);
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8">
        <button onClick={goBack} className="absolute top-4 left-4 text-white text-lg">← Back</button>
        <h1 className="text-white text-3xl font-bold mb-8">Confirm Check In</h1>
        <div className="bg-amber-700 rounded-lg p-8 text-center mb-8">
          <div className="text-white text-2xl font-bold">{student?.name}</div>
          <div className="text-amber-100 text-lg mt-2">{student?.phone}</div>
        </div>
        <button
          onClick={() => {
            kioskDataProvider.checkInStudent(student?.id || 0, 1);
            navigateTo('check-in-success');
          }}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-12 rounded-full text-lg"
        >
          Confirm Check In
        </button>
      </div>
    );
  }

  // Check In - Success Screen
  if (state.currentScreen === 'check-in-success') {
    setTimeout(() => goHome(), 5000);
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-900 to-green-800 p-8">
        <div className="text-6xl mb-8">✓</div>
        <h1 className="text-white text-4xl font-bold mb-4">Check In Successful!</h1>
        <div className="text-green-100 text-lg">Returning to home in 5 seconds...</div>
      </div>
    );
  }

  // Start Training - Lead Capture Screen
  if (state.currentScreen === 'start-training-lead') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8">
        <button onClick={goBack} className="absolute top-4 left-4 text-white text-lg">← Back</button>
        <h1 className="text-white text-3xl font-bold mb-8">Start Your Training</h1>
        <input 
          type="text" 
          placeholder="Full Name" 
          className="w-full max-w-md px-4 py-3 rounded-lg mb-4"
          onChange={(e) => updateFlowData({ leadName: e.target.value })}
        />
        <input 
          type="tel" 
          placeholder="Phone Number" 
          className="w-full max-w-md px-4 py-3 rounded-lg mb-4"
          onChange={(e) => updateFlowData({ leadPhone: e.target.value })}
        />
        <input 
          type="email" 
          placeholder="Email Address" 
          className="w-full max-w-md px-4 py-3 rounded-lg mb-8"
          onChange={(e) => updateFlowData({ leadEmail: e.target.value })}
        />
        <button
          onClick={() => navigateTo('start-training-program')}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-12 rounded-full text-lg"
        >
          Next
        </button>
      </div>
    );
  }

  // Start Training - Program Selection Screen
  if (state.currentScreen === 'start-training-program') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8">
        <button onClick={goBack} className="absolute top-4 left-4 text-white text-lg">← Back</button>
        <h1 className="text-white text-3xl font-bold mb-8">Select a Program</h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {['Kids', 'Teens', 'Adults', 'Kickboxing'].map(program => (
            <button
              key={program}
              onClick={() => {
                updateFlowData({ selectedProgram: program });
                navigateTo('start-training-schedule');
              }}
              className="bg-amber-700 hover:bg-amber-600 text-white font-bold py-4 px-4 rounded-lg"
            >
              {program}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Start Training - Schedule Screen
  if (state.currentScreen === 'start-training-schedule') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-amber-900 to-amber-800 p-8">
        <button onClick={goBack} className="absolute top-4 left-4 text-white text-lg">← Back</button>
        <h1 className="text-white text-3xl font-bold mb-8">Schedule Intro Class</h1>
        <input 
          type="datetime-local" 
          className="w-full max-w-md px-4 py-3 rounded-lg mb-8"
          onChange={(e) => updateFlowData({ scheduledTime: e.target.value })}
        />
        <button
          onClick={() => {
            kioskDataProvider.createLead(state.flowData);
            navigateTo('start-training-confirmation');
          }}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-12 rounded-full text-lg"
        >
          Schedule Class
        </button>
      </div>
    );
  }

  // Start Training - Confirmation Screen
  if (state.currentScreen === 'start-training-confirmation') {
    setTimeout(() => goHome(), 5000);
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-900 to-green-800 p-8">
        <div className="text-6xl mb-8">✓</div>
        <h1 className="text-white text-4xl font-bold mb-4">Class Scheduled!</h1>
        <div className="text-green-100 text-lg">We'll see you soon!</div>
        <div className="text-green-100 text-sm mt-4">Returning to home in 5 seconds...</div>
      </div>
    );
  }

  // Staff Login - PIN Entry Screen
  if (state.currentScreen === 'staff-pin-entry') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800 p-8">
        <h1 className="text-white text-3xl font-bold mb-8">Staff Login</h1>
        <input 
          type="password" 
          placeholder="Enter PIN" 
          maxLength={4}
          className="w-full max-w-md px-4 py-3 rounded-lg mb-8 text-center text-2xl"
          onChange={(e) => {
            if (e.target.value.length === 4) {
              if (kioskDataProvider.verifyStaffPin(e.target.value)) {
                navigateTo('staff-tools');
              } else {
                alert('Invalid PIN');
              }
            }
          }}
        />
        <button
          onClick={exitStaffMode}
          className="text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Staff Tools Screen
  if (state.currentScreen === 'staff-tools') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800 p-8">
        <button onClick={exitStaffMode} className="absolute top-4 left-4 text-white text-lg">← Exit</button>
        <h1 className="text-white text-3xl font-bold mb-8">Staff Tools</h1>
        <div className="bg-gray-700 rounded-lg p-8 w-full max-w-md">
          <div className="text-white mb-4">
            <h2 className="font-bold mb-2">Recent Check-Ins:</h2>
            <div className="text-sm text-gray-300">
              {kioskDataProvider.mockAttendance.slice(-3).map(a => (
                <div key={a.id}>{a.studentName} - {new Date(a.timestamp).toLocaleTimeString()}</div>
              ))}
            </div>
          </div>
          <div className="text-white mt-4">
            <h2 className="font-bold mb-2">Recent Leads:</h2>
            <div className="text-sm text-gray-300">
              {kioskDataProvider.mockLeads.slice(-3).map(l => (
                <div key={l.id}>{l.name} - {l.program}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-white">Unknown screen: {state.currentScreen}</div>;
}
