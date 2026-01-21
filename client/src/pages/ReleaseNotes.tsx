import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export default function ReleaseNotes() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [marked, setMarked] = useState(false);

  const handleMarkAsRead = () => {
    setMarked(true);
    // Navigate back after a brief delay
    setTimeout(() => {
      navigate('/kai');
    }, 500);
  };

  return (
    <div 
      className="min-h-screen p-8"
      style={{
        backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
        color: isDark ? '#ffffff' : '#000000'
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/kai')}
          className="flex items-center gap-2 mb-8 hover:opacity-70 transition-opacity"
          style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Kai</span>
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Kai v0.9.0-beta</h1>
          <p 
            className="text-lg"
            style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
          >
            Released January 21, 2026
          </p>
        </div>

        {/* Release notes content */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">✨ New Features</h2>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  <strong>Light Mode Command Center:</strong> A beautiful new interface with a centered Kai icon, title, and prompt carousel showing 3 cards at a time with intuitive arrow navigation.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  <strong>Enhanced Chat Input:</strong> Send button now shows loading spinner and disables during message submission to prevent duplicate sends.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  <strong>Prompt Paging System:</strong> Navigate through prompt directives with left/right arrows. Arrows are always visible and show disabled state at boundaries.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">🔧 Improvements</h2>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  <strong>Better Arrow Positioning:</strong> Fixed left arrow clipping issues in Light mode command center.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  <strong>Responsive Layout:</strong> Command stage now properly centers with adjustable width for optimal viewing.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  <strong>Visual Feedback:</strong> Loading states and disabled buttons provide clear feedback during interactions.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">🐛 Bug Fixes</h2>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  Fixed send button not triggering message submission
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  Resolved overflow clipping issues in Light mode container
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  Corrected carousel arrow positioning and visibility
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">📝 Known Issues</h2>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  Prompt cards may not trigger conversations in some cases (under investigation)
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">•</span>
                <div>
                  Enter key submission not yet implemented for chat input
                </div>
              </li>
            </ul>
          </section>

          {/* Feedback section */}
          <section 
            className="p-6 rounded-lg mt-12"
            style={{
              backgroundColor: isDark ? 'rgba(255, 76, 76, 0.1)' : 'rgba(255, 76, 76, 0.1)',
              border: '1px solid rgba(255, 76, 76, 0.2)'
            }}
          >
            <h3 className="text-xl font-semibold mb-2">We'd love your feedback!</h3>
            <p style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}>
              As a beta tester, your input is invaluable. Report issues or share suggestions through the feedback button in the app.
            </p>
          </section>
        </div>

        {/* Mark as read button */}
        <div className="mt-12 flex justify-center">
          <Button
            onClick={handleMarkAsRead}
            disabled={marked}
            className="h-12 px-8 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white font-medium rounded-lg"
          >
            {marked ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Marked as read
              </>
            ) : (
              'Mark as read'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
