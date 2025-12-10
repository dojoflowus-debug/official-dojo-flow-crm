import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaUserPlus, FaFileSignature, FaCreditCard, FaCalendarAlt, FaShoppingBag, FaUserFriends, FaStar, FaRobot, FaTimes, FaMicrophone, FaCog, FaBullhorn } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';

export default function KioskCheckIn() {
  const [activeTab, setActiveTab] = useState('home');
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showKai, setShowKai] = useState(false);
  const [kaiMessages, setKaiMessages] = useState([]);
  const [kaiInput, setKaiInput] = useState('');
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [staffStats, setStaffStats] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  
  // New student form
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  
  // Waiver form
  const [waiver, setWaiver] = useState({
    studentName: '',
    guardianName: ''
  });
  const [signature, setSignature] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Payment form
  const [payment, setPayment] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'Credit/Debit Card',
    description: ''
  });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load students
  useEffect(() => {
    fetchStudents();
    fetchEvents();
    fetchAnnouncements();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/kiosk/events/list?type=all`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/kiosk/announcements/active`);
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchStaffStats = async (pin) => {
    try {
      const response = await fetch(`${API_BASE_URL}/kiosk/stats/today`, {
        headers: {
          'X-Staff-PIN': pin
        }
      });
      const data = await response.json();
      if (data.success) {
        setStaffStats(data.stats);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching staff stats:', error);
      return false;
    }
  };

  const handleCheckIn = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/kiosk/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      });
      const data = await response.json();
      if (data.success) {
        const student = students.find(s => s.id === studentId);
        alert(`Welcome, ${student.first_name}! You're checked in.`);
        setTimeout(() => setActiveTab('home'), 2000);
      }
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const handleNewStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newStudent.firstName,
          last_name: newStudent.lastName,
          email: newStudent.email,
          phone: newStudent.phone,
          date_of_birth: newStudent.dateOfBirth,
          emergency_contact: newStudent.emergencyContactName,
          emergency_phone: newStudent.emergencyContactPhone
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Welcome to MyDojo!');
        setNewStudent({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          emergencyContactName: '',
          emergencyContactPhone: ''
        });
        fetchStudents();
        setTimeout(() => setActiveTab('home'), 2000);
      }
    } catch (error) {
      console.error('Error registering student:', error);
    }
  };

  const handleWaiverSubmit = async (e) => {
    e.preventDefault();
    if (!signature) {
      alert('Please sign the waiver');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/kiosk/waiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: waiver.studentName,
          guardian_name: waiver.guardianName,
          signature_data: signature
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Waiver signed successfully!');
        setWaiver({ studentName: '', guardianName: '' });
        clearSignature();
        setTimeout(() => setActiveTab('home'), 2000);
      }
    } catch (error) {
      console.error('Error submitting waiver:', error);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: payment.studentId,
          amount: parseFloat(payment.amount),
          payment_method: payment.paymentMethod,
          description: payment.description
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Payment of $${payment.amount} processed successfully!`);
        setPayment({
          studentId: '',
          amount: '',
          paymentMethod: 'Credit/Debit Card',
          description: ''
        });
        setTimeout(() => setActiveTab('home'), 2000);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (selectedRating === 0) {
      alert('Please select a rating');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/kiosk/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: students[0]?.id,
          rating: selectedRating,
          comment: feedbackComment,
          type: 'class'
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Thank you for your feedback!');
        setSelectedRating(0);
        setFeedbackComment('');
        setTimeout(() => setActiveTab('home'), 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Signature pad functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  // Kai Assistant functions
  const sendKaiMessage = async (message) => {
    setKaiMessages(prev => [...prev, { role: 'user', content: message }]);
    setKaiInput('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/kai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      if (data.response) {
        setKaiMessages(prev => [...prev, { role: 'kai', content: data.response }]);
        speakText(data.response);
      }
    } catch (error) {
      console.error('Error sending message to Kai:', error);
    }
  };

  const speakText = async (text) => {
    try {
      const response = await fetch(`${API_BASE_URL}/elevenlabs/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  const handleAdminPinSubmit = async (pin) => {
    const success = await fetchStaffStats(pin);
    if (success) {
      setShowAdminMenu(true);
    } else {
      alert('Invalid PIN');
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const phone = (student.phone || '').replace(/\D/g, ''); // Remove non-digits from phone
    const searchDigits = searchTerm.replace(/\D/g, ''); // Remove non-digits from search
    
    return fullName.includes(searchLower) || phone.includes(searchDigits);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-lg">
              <span className="text-3xl">🥋</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold">MyDojo Kiosk</h1>
              <p className="text-red-100">Self-Service Check-In & Registration</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentTime.toLocaleTimeString()}</div>
            <div className="text-red-100">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <div className="bg-yellow-500 text-black py-3 px-6">
          <div className="max-w-7xl mx-auto flex items-center space-x-3">
            <FaBullhorn className="text-2xl" />
            <div className="flex-1">
              <strong>{announcements[0].title}:</strong> {announcements[0].message}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center">What would you like to do?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <button onClick={() => setActiveTab('checkin')} className="bg-gradient-to-br from-blue-600 to-blue-800 p-12 rounded-2xl shadow-2xl hover:scale-105 transition transform">
                <FaUserPlus className="text-6xl mb-4 mx-auto" />
                <h3 className="text-2xl font-bold">Check In</h3>
                <p className="text-blue-200 mt-2">Existing students</p>
              </button>
              <button onClick={() => setActiveTab('newstudent')} className="bg-gradient-to-br from-green-600 to-green-800 p-12 rounded-2xl shadow-2xl hover:scale-105 transition transform">
                <FaUserPlus className="text-6xl mb-4 mx-auto" />
                <h3 className="text-2xl font-bold">New Student</h3>
                <p className="text-green-200 mt-2">Sign up today</p>
              </button>
              <button onClick={() => setActiveTab('waiver')} className="bg-gradient-to-br from-purple-600 to-purple-800 p-12 rounded-2xl shadow-2xl hover:scale-105 transition transform">
                <FaFileSignature className="text-6xl mb-4 mx-auto" />
                <h3 className="text-2xl font-bold">Sign Waiver</h3>
                <p className="text-purple-200 mt-2">Digital signature</p>
              </button>
              <button onClick={() => setActiveTab('payment')} className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-12 rounded-2xl shadow-2xl hover:scale-105 transition transform">
                <FaCreditCard className="text-6xl mb-4 mx-auto" />
                <h3 className="text-2xl font-bold">Make Payment</h3>
                <p className="text-cyan-200 mt-2">Classes & gear</p>
              </button>
              <button onClick={() => setActiveTab('events')} className="bg-gradient-to-br from-pink-600 to-pink-800 p-12 rounded-2xl shadow-2xl hover:scale-105 transition transform">
                <FaCalendarAlt className="text-6xl mb-4 mx-auto" />
                <h3 className="text-2xl font-bold">Events & Camps</h3>
                <p className="text-pink-200 mt-2">Register now</p>
              </button>
              <button onClick={() => alert('Shop coming soon!')} className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-12 rounded-2xl shadow-2xl hover:scale-105 transition transform">
                <FaShoppingBag className="text-6xl mb-4 mx-auto" />
                <h3 className="text-2xl font-bold">Shop Gear</h3>
                <p className="text-yellow-200 mt-2">Uniforms & belts</p>
              </button>
              <button onClick={() => alert('Referrals coming soon!')} className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 rounded-2xl shadow-2xl hover:scale-105 transition transform">
                <FaUserFriends className="text-6xl mb-4 mx-auto" />
                <h3 className="text-2xl font-bold">Refer a Friend</h3>
                <p className="text-indigo-200 mt-2">Earn rewards</p>
              </button>
              <button onClick={() => setActiveTab('feedback')} className="bg-gradient-to-br from-orange-600 to-orange-800 p-12 rounded-2xl shadow-2xl hover:scale-105 transition transform">
                <FaStar className="text-6xl mb-4 mx-auto" />
                <h3 className="text-2xl font-bold">Feedback</h3>
                <p className="text-orange-200 mt-2">Rate your class</p>
              </button>
            </div>
          </div>
        )}

        {/* CHECK IN TAB */}
        {activeTab === 'checkin' && (
          <div>
            <button onClick={() => setActiveTab('home')} className="mb-4 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition">
              ← Back to Home
            </button>
            <h2 className="text-3xl font-bold mb-6">Check In</h2>
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white text-xl mb-6"
            />
            {filteredStudents.length === 0 ? (
              <p className="text-center text-gray-400 text-xl">No students found</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleCheckIn(student.id)}
                    className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <h3 className="font-semibold text-lg">{student.first_name} {student.last_name}</h3>
                    <p className="text-sm text-gray-400">{student.belt_rank || 'White Belt'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEW STUDENT TAB */}
        {activeTab === 'newstudent' && (
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveTab('home')} className="mb-4 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition">
              ← Back to Home
            </button>
            <h2 className="text-3xl font-bold mb-6">New Student Registration</h2>
            <form onSubmit={handleNewStudentSubmit} className="bg-gray-800 p-8 rounded-lg space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={newStudent.dateOfBirth}
                  onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Emergency Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.emergencyContactName}
                    onChange={(e) => setNewStudent({...newStudent, emergencyContactName: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newStudent.emergencyContactPhone}
                    onChange={(e) => setNewStudent({...newStudent, emergencyContactPhone: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6 py-4 rounded-lg font-semibold transition">
                Submit Registration
              </button>
            </form>
          </div>
        )}

        {/* WAIVER TAB */}
        {activeTab === 'waiver' && (
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveTab('home')} className="mb-4 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition">
              ← Back to Home
            </button>
            <h2 className="text-3xl font-bold mb-6">Liability Waiver</h2>
            <form onSubmit={handleWaiverSubmit} className="bg-gray-800 p-8 rounded-lg space-y-6">
              <div className="bg-gray-700 p-6 rounded-lg max-h-64 overflow-y-auto text-sm">
                <h3 className="font-bold text-lg mb-3">ASSUMPTION OF RISK AND WAIVER OF LIABILITY</h3>
                <p>
                  I acknowledge that martial arts training involves inherent risks including but not limited to: physical injury, muscle strains, sprains, fractures, and other bodily harm. I voluntarily assume all risks associated with participation in martial arts classes and activities at MyDojo. I hereby release, waive, and discharge MyDojo, its owners, instructors, and staff from any and all liability for any injury, loss, or damage that I may incur during my participation. I certify that I am in good physical condition and have no medical conditions that would prevent safe participation.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={waiver.studentName}
                    onChange={(e) => setWaiver({...waiver, studentName: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Parent/Guardian Name (if under 18)</label>
                  <input
                    type="text"
                    value={waiver.guardianName}
                    onChange={(e) => setWaiver({...waiver, guardianName: e.target.value})}
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Signature *</label>
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full bg-white rounded border-2 border-gray-600 cursor-crosshair"
                />
              </div>
              <div className="flex space-x-4">
                <button type="button" onClick={clearSignature} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition">
                  Clear Signature
                </button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-6 py-4 rounded-lg font-semibold transition">
                  Sign Waiver
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PAYMENT TAB */}
        {activeTab === 'payment' && (
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveTab('home')} className="mb-4 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition">
              ← Back to Home
            </button>
            <h2 className="text-3xl font-bold mb-6">Make a Payment</h2>
            <form onSubmit={handlePaymentSubmit} className="bg-gray-800 p-8 rounded-lg space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Select Student *</label>
                <select
                  required
                  value={payment.studentId}
                  onChange={(e) => setPayment({...payment, studentId: e.target.value})}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                >
                  <option value="">Select a student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payment.amount}
                  onChange={(e) => setPayment({...payment, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Payment Method *</label>
                <select
                  required
                  value={payment.paymentMethod}
                  onChange={(e) => setPayment({...payment, paymentMethod: e.target.value})}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                >
                  <option>Credit/Debit Card</option>
                  <option>Cash</option>
                  <option>Check</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description *</label>
                <textarea
                  required
                  value={payment.description}
                  onChange={(e) => setPayment({...payment, description: e.target.value})}
                  placeholder="Monthly membership, class package, equipment, etc."
                  rows={3}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 px-6 py-4 rounded-lg font-semibold transition">
                Process Payment
              </button>
            </form>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            <button onClick={() => setActiveTab('home')} className="mb-4 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition">
              ← Back to Home
            </button>
            <h2 className="text-3xl font-bold mb-6">Upcoming Events & Camps</h2>
            {events.length === 0 ? (
              <p className="text-center text-gray-400 text-xl">No upcoming events</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(event => (
                  <div key={event.id} className="bg-gray-800 rounded-lg overflow-hidden">
                    {event.image_url && (
                      <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                      <p className="text-gray-400 mb-4">{event.description}</p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-400">{new Date(event.event_date).toLocaleDateString()}</span>
                        <span className="text-lg font-bold text-green-400">${event.price}</span>
                      </div>
                      <button className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 px-6 py-3 rounded-lg font-semibold transition">
                        Register Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveTab('home')} className="mb-4 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition">
              ← Back to Home
            </button>
            <h2 className="text-3xl font-bold mb-6">How was class today?</h2>
            <form onSubmit={handleFeedbackSubmit} className="bg-gray-800 p-8 rounded-lg space-y-6">
              <div className="text-center">
                <p className="text-lg mb-4">Rate your experience:</p>
                <div className="flex justify-center space-x-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className={`text-6xl transition ${selectedRating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Comments (optional)</label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-6 py-4 rounded-lg font-semibold transition">
                Submit Feedback
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Kai Assistant Button */}
      <button
        onClick={() => setShowKai(!showKai)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-full shadow-2xl hover:scale-110 transition transform z-50"
      >
        <FaRobot className="text-4xl" />
      </button>

      {/* Kai Chat Window */}
      {showKai && (
        <div className="fixed bottom-28 right-8 w-96 h-[500px] bg-gray-900 rounded-lg shadow-2xl border border-gray-700 flex flex-col z-50">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaRobot className="text-2xl" />
              <span className="font-bold text-lg">Ask Kai</span>
            </div>
            <button onClick={() => setShowKai(false)} className="hover:bg-white/20 p-2 rounded">
              <FaTimes />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {kaiMessages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <p className="mb-4">Hi! I'm Kai, your AI assistant.</p>
                <p>I can help you:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Check in for class</li>
                  <li>• Enroll in programs</li>
                  <li>• Answer questions</li>
                  <li>• Schedule appointments</li>
                </ul>
              </div>
            ) : (
              kaiMessages.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 ml-8' : 'bg-gray-800 mr-8'}`}>
                  {msg.content}
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={kaiInput}
                onChange={(e) => setKaiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && kaiInput && sendKaiMessage(kaiInput)}
                placeholder="Type your message..."
                className="flex-1 p-3 rounded bg-gray-800 border border-gray-700"
              />
              <button
                onClick={() => kaiInput && sendKaiMessage(kaiInput)}
                className="bg-purple-600 hover:bg-purple-700 px-4 rounded transition"
              >
                Send
              </button>
              <button
                onClick={() => alert('Voice input coming soon!')}
                className="bg-gray-700 hover:bg-gray-600 px-4 rounded transition"
              >
                <FaMicrophone />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Menu Button */}
      <button
        onClick={() => {
          const pin = prompt('Enter staff PIN:');
          if (pin) {
            handleAdminPinSubmit(pin);
          }
        }}
        className="fixed bottom-8 left-8 bg-gray-700 hover:bg-gray-600 p-4 rounded-full shadow-xl transition z-50"
      >
        <FaCog className="text-2xl" />
      </button>

      {/* Staff Stats Modal */}
      {showAdminMenu && staffStats && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Staff Dashboard</h2>
              <button onClick={() => setShowAdminMenu(false)} className="text-gray-400 hover:text-white">
                <FaTimes className="text-2xl" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Check-ins Today</p>
                <p className="text-3xl font-bold">{staffStats.checkins_today}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">New Students</p>
                <p className="text-3xl font-bold">{staffStats.new_students_today}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Waivers Signed</p>
                <p className="text-3xl font-bold">{staffStats.waivers_signed_today}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Payments Today</p>
                <p className="text-3xl font-bold">{staffStats.payments_today}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg col-span-2">
                <p className="text-gray-400 text-sm">Revenue Today</p>
                <p className="text-3xl font-bold text-green-400">${staffStats.revenue_today?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-500 text-sm">
        Having trouble? Please see the front desk for assistance.
      </div>
    </div>
  );
}

