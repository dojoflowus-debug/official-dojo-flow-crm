import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import SimpleLayout from '../components/SimpleLayout'
import AddressAutocomplete from '../components/AddressAutocomplete'
import PhoneInput from '../components/PhoneInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// DropdownMenu removed - using direct buttons instead
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Search,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  Award,
  Calendar,
  DollarSign,
  // MoreVertical removed with dropdown
  Loader2,
  Edit,
  Trash2,
  CreditCard,
  Check,
  X,
  User,
  Camera,
  Upload
} from 'lucide-react'

export default function Students({ onLogout, theme, toggleTheme }) {
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [statusFilter, setStatusFilter] = useState(() => {
    // Check URL params for filter preset
    const filter = searchParams.get('filter')
    if (filter === 'needs-attention') {
      return 'on_hold' // Will show on_hold and inactive students
    }
    return 'all'
  })
  const [membershipFilter, setMembershipFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState({
    total_students: 0,
    active_students: 0,
    overdue_payments: 0,
    new_this_month: 0
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    belt_rank: 'White Belt',
    membership_status: 'Paid',
    status: 'Active'
  })
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    card_holder: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    billing_cycle: 'monthly',
    billing_amount: '',
    pass_fees_to_customer: false
  })

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents()
    fetchStats()
  }, [])

  const fetchStudents = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        // Force state update by creating new array reference
        setStudents([...data])
      } else {
        console.error('Failed to fetch students:', response.status)
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/students/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddStudent = async () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.phone || !formData.date_of_birth) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      const studentData = {
        first_name: firstName,
        last_name: lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        belt_rank: formData.belt_rank,
        status: formData.status,
        membership_status: formData.membership_status,
        street_address: formData.street_address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        photo_url: formData.photo_url || ''
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData)
      })

      if (response.ok) {
        await fetchStudents()
        await fetchStats()
        setShowAddModal(false)
        setFormData({
          name: '',
          email: '',
          phone: '',
          date_of_birth: '',
          street_address: '',
          city: '',
          state: '',
          zip_code: '',
          belt_rank: 'White Belt',
          membership_status: 'Paid',
          status: 'Active'
        })
      } else {
        const error = await response.json()
        let errorMessage = error.error || 'Unknown error'
        
        // Handle duplicate email error
        if (errorMessage.includes('UNIQUE constraint failed') && errorMessage.includes('email')) {
          errorMessage = 'A student with this email address already exists. Please use a different email.'
        }
        
        alert(`Error adding student: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Failed to add student. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditStudent = async () => {
    if (!selectedStudent) return

    setSubmitting(true)

    try {
      const nameParts = formData.name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      const studentData = {
        first_name: firstName,
        last_name: lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        belt_rank: formData.belt_rank,
        status: formData.status,
        membership_status: formData.membership_status,
        street_address: formData.street_address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        photo_url: formData.photo_url || ''
      }

      console.log('=== UPDATING STUDENT ===')
      console.log('photo_url length:', studentData.photo_url ? studentData.photo_url.length : 0)
      console.log('photo_url preview:', studentData.photo_url ? studentData.photo_url.substring(0, 100) : 'empty')

      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData)
      })

      if (response.ok) {
        await fetchStudents()
        await fetchStats()
        setShowEditModal(false)
        setSelectedStudent(null)
        alert('Student updated successfully!')
      } else {
        const error = await response.json()
        alert(`Error updating student: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStudent = async () => {
    console.log('=== DELETE STUDENT FUNCTION CALLED ===')
    console.log('selectedStudent:', selectedStudent)
    
    if (!selectedStudent) {
      console.log('ERROR: No selected student, returning')
      return
    }

    const studentId = selectedStudent.id
    console.log('Student ID to delete:', studentId)
    console.log('Setting submitting to true')
    setSubmitting(true)

    try {
      console.log('Making DELETE request to /api/students/' + studentId)
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      })
      console.log('Response received:', response.status, response.ok)

      if (response.ok) {
        console.log('DELETE successful! About to reload page...')
        console.log('Current URL:', window.location.href)
        
        // Try multiple reload methods to ensure it works
        alert('Student deleted successfully! Page will reload.')
        window.location.reload(true)
      } else {
        const error = await response.json()
        console.log('DELETE failed with error:', error)
        alert(`Error deleting student: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Exception during delete:', error)
      alert('Failed to delete student. Please try again.')
    } finally {
      console.log('Finally block - setting submitting to false')
      setSubmitting(false)
    }
  }

  const handleSavePayment = async () => {
    if (!selectedStudent) return

    // Validate payment form
    if (!paymentData.card_number || !paymentData.card_holder || !paymentData.expiry_month || 
        !paymentData.expiry_year || !paymentData.cvv || !paymentData.billing_amount) {
      alert('Please fill in all payment fields')
      return
    }

    setSubmitting(true)

    try {
      const paymentInfo = {
        student_id: selectedStudent.id,
        card_number_last4: paymentData.card_number.slice(-4),
        card_holder: paymentData.card_holder,
        expiry_month: paymentData.expiry_month,
        expiry_year: paymentData.expiry_year,
        billing_cycle: paymentData.billing_cycle,
        billing_amount: parseFloat(paymentData.billing_amount),
        pass_fees_to_customer: paymentData.pass_fees_to_customer
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentInfo)
      })

      if (response.ok) {
        setShowPaymentModal(false)
        setSelectedStudent(null)
        setPaymentData({
          card_number: '',
          card_holder: '',
          expiry_month: '',
          expiry_year: '',
          cvv: '',
          billing_cycle: 'monthly',
          billing_amount: '',
          pass_fees_to_customer: false
        })
        alert('Payment information saved successfully!')
      } else {
        const error = await response.json()
        alert(`Error saving payment: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving payment:', error)
      alert('Failed to save payment information. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (student) => {
    setSelectedStudent(student)
    setFormData({
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      phone: student.phone,
      date_of_birth: student.date_of_birth || '',
      street_address: student.street_address || '',
      city: student.city || '',
      state: student.state || '',
      zip_code: student.zip_code || '',
      belt_rank: student.belt_rank,
      membership_status: student.membership_status,
      status: student.status,
      photo_url: student.photo_url || ''
    })
    setShowEditModal(true)
  }

  const openPaymentModal = (student) => {
    setSelectedStudent(student)
    setShowPaymentModal(true)
  }

  const openDeleteDialog = (student) => {
    setSelectedStudent(student)
    setShowDeleteDialog(true)
  }

  const getBeltColor = (belt) => {
    const colors = {
      'White Belt': 'bg-gray-100 text-gray-800 border-gray-300',
      'Yellow Belt': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Orange Belt': 'bg-orange-100 text-orange-800 border-orange-300',
      'Green Belt': 'bg-green-100 text-green-800 border-green-300',
      'Blue Belt': 'bg-blue-100 text-blue-800 border-blue-300',
      'Brown Belt': 'bg-amber-100 text-amber-800 border-amber-300',
      'Black Belt': 'bg-gray-800 text-white border-gray-900',
    }
    return colors[belt] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const getMembershipColor = (status) => {
    const colors = {
      'Paid': 'bg-green-100 text-green-800',
      'Overdue': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
    const query = searchQuery.toLowerCase()
    const matchesSearch = fullName.includes(query) ||
           student.email.toLowerCase().includes(query) ||
           student.belt_rank.toLowerCase().includes(query)
    
    // Handle needs-attention filter (shows on_hold and inactive)
    let matchesStatus = false
    if (statusFilter === 'all') {
      matchesStatus = true
    } else if (statusFilter === 'on_hold') {
      // For needs-attention filter, show both on_hold and inactive
      matchesStatus = student.status === 'on_hold' || student.status === 'Inactive'
    } else {
      matchesStatus = student.status === statusFilter
    }
    
    const matchesMembership = membershipFilter === 'all' || student.membership_status === membershipFilter
    return matchesSearch && matchesStatus && matchesMembership
  })

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Age', 'Belt Rank', 'Status', 'Membership', 'Last Attendance']
    const rows = filteredStudents.map(student => [
      `${student.first_name} ${student.last_name}`,
      student.email,
      student.phone,
      student.age,
      student.belt_rank,
      student.status,
      student.membership_status,
      student.last_attendance ? new Date(student.last_attendance).toLocaleDateString() : 'N/A'
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SimpleLayout>
    )
  }

  return (
    <SimpleLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Students</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your dojo's student roster</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">Total Students</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.total_students}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg flex-shrink-0">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">Active</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.active_students}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">Overdue Payments</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.overdue_payments}</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg flex-shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">New This Month</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.new_this_month}</p>
                </div>
                <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, email, or belt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Button 
                    variant="outline"
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    {(statusFilter !== 'all' || membershipFilter !== 'all') && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
                    )}
                  </Button>
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg p-4 z-50">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Membership</Label>
                          <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Memberships</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Free Trial">Free Trial</SelectItem>
                              <SelectItem value="Overdue">Overdue</SelectItem>
                              <SelectItem value="Paid Trial">Paid Trial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setStatusFilter('all')
                              setMembershipFilter('all')
                            }}
                            className="flex-1"
                          >
                            Clear
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => setShowFilterMenu(false)}
                            className="flex-1"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline"
                  onClick={exportToCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>All Students ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Belt Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Membership</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Attendance</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-border hover:bg-accent/50 transition-all duration-150 hover:shadow-sm cursor-pointer">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <img 
                              src={student.photo_url} 
                              alt={`${student.first_name} ${student.last_name}`}
                              className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border flex-shrink-0">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-muted-foreground">Age: {student.age}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-2" />
                            {student.email}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-2" />
                            {student.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getBeltColor(student.belt_rank)}`}>
                          <Award className="h-3 w-3 mr-1" />
                          {student.belt_rank}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getMembershipColor(student.membership_status)}`}>
                          {student.membership_status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground">
                          {student.last_attendance ? new Date(student.last_attendance).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(student)}
                            className="h-8 px-2"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openPaymentModal(student)}
                            className="h-8 px-2"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Payment
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteDialog(student)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet/Mobile Card View */}
            <div className="xl:hidden space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                  <div className="flex gap-4 mb-3">
                    {/* Student Photo */}
                    <div className="flex-shrink-0">
                      {student.photo_url ? (
                        <img 
                          src={student.photo_url} 
                          alt={`${student.first_name} ${student.last_name}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{student.first_name} {student.last_name}</h3>
                          <p className="text-sm text-muted-foreground">Age: {student.age}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                            {student.status}
                          </span>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getMembershipColor(student.membership_status)}`}>
                            {student.membership_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        {student.phone}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getBeltColor(student.belt_rank)}`}>
                          {student.belt_rank}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        Last: {student.last_attendance ? new Date(student.last_attendance).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditModal(student)}
                      className="flex-1 min-w-[100px]"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openPaymentModal(student)}
                      className="flex-1 min-w-[100px]"
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Payment
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDeleteDialog(student)}
                      className="flex-1 min-w-[100px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Student Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary" />
                Add New Student
              </DialogTitle>
              <DialogDescription className="text-sm">
                Enter the student's information to add them to your dojo roster.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4 overflow-y-auto flex-1 px-1">
              {/* Photo Upload */}
              <div className="grid gap-2">
                <Label>Student Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {formData.photo_url ? (
                      <img 
                        src={formData.photo_url} 
                        alt="Student" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5">
                      <Camera className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      id="photo-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            handleInputChange('photo_url', reader.result)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      disabled={submitting}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">Or paste an image URL:</p>
                    <Input
                      id="photo-url"
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={formData.photo_url && !formData.photo_url.startsWith('data:') ? formData.photo_url : ''}
                      onChange={(e) => handleInputChange('photo_url', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter student's full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  country="United States"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="street_address">Street Address</Label>
                <Input
                  id="street_address"
                  placeholder="123 Main St"
                  value={formData.street_address}
                  onChange={(e) => handleInputChange('street_address', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="IL"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={submitting}
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zip_code">Zip Code</Label>
                <Input
                  id="zip_code"
                  placeholder="62701"
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  disabled={submitting}
                  maxLength={10}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="belt">Belt Rank</Label>
                <Select 
                  value={formData.belt_rank} 
                  onValueChange={(value) => handleInputChange('belt_rank', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select belt rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="White Belt">White Belt</SelectItem>
                    <SelectItem value="Yellow Belt">Yellow Belt</SelectItem>
                    <SelectItem value="Orange Belt">Orange Belt</SelectItem>
                    <SelectItem value="Green Belt">Green Belt</SelectItem>
                    <SelectItem value="Blue Belt">Blue Belt</SelectItem>
                    <SelectItem value="Brown Belt">Brown Belt</SelectItem>
                    <SelectItem value="Black Belt">Black Belt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="membership">Membership Status</Label>
                <Select 
                  value={formData.membership_status} 
                  onValueChange={(value) => handleInputChange('membership_status', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Student Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                onClick={handleAddStudent}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Student Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center">
                <Edit className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary" />
                Edit Student
              </DialogTitle>
              <DialogDescription className="text-sm">
                Update the student's information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4 overflow-y-auto flex-1 px-1">
              {/* Photo Upload */}
              <div className="grid gap-2">
                <Label>Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {formData.photo_url ? (
                      <img 
                        src={formData.photo_url} 
                        alt="Student" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5">
                      <Camera className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      id="edit-photo-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            handleInputChange('photo_url', reader.result)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      disabled={submitting}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">Or paste an image URL:</p>
                    <Input
                      id="edit-photo-url"
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={formData.photo_url && !formData.photo_url.startsWith('data:') ? formData.photo_url : ''}
                      onChange={(e) => handleInputChange('photo_url', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter student's full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="student@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  country="United States"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Address Fields with Autocomplete */}
              <AddressAutocomplete
                value={formData.street_address || ''}
                onChange={(value) => handleInputChange('street_address', value)}
                onAddressSelect={(address) => {
                  // Auto-fill all address fields
                  handleInputChange('street_address', address.street_address)
                  handleInputChange('city', address.city)
                  handleInputChange('state', address.state)
                  handleInputChange('zip_code', address.zip_code)
                }}
                disabled={submitting}
                label="Street Address"
                placeholder="Start typing an address..."
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    type="text"
                    placeholder="Tomball"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    type="text"
                    placeholder="TX"
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={submitting}
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-zip">ZIP Code</Label>
                <Input
                  id="edit-zip"
                  type="text"
                  placeholder="77377"
                  value={formData.zip_code || ''}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  disabled={submitting}
                  maxLength={10}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-age">Age *</Label>
                <Input
                  id="edit-age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  min="1"
                  max="120"
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-belt">Belt Rank</Label>
                <Select 
                  value={formData.belt_rank} 
                  onValueChange={(value) => handleInputChange('belt_rank', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select belt rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="White Belt">White Belt</SelectItem>
                    <SelectItem value="Yellow Belt">Yellow Belt</SelectItem>
                    <SelectItem value="Orange Belt">Orange Belt</SelectItem>
                    <SelectItem value="Green Belt">Green Belt</SelectItem>
                    <SelectItem value="Blue Belt">Blue Belt</SelectItem>
                    <SelectItem value="Brown Belt">Brown Belt</SelectItem>
                    <SelectItem value="Black Belt">Black Belt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-membership">Membership Status</Label>
                <Select 
                  value={formData.membership_status} 
                  onValueChange={(value) => handleInputChange('membership_status', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Student Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                onClick={handleEditStudent}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Management Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center">
                <CreditCard className="h-6 w-6 mr-2 text-primary" />
                Manage Payment Information
              </DialogTitle>
              <DialogDescription>
                {selectedStudent && `Set up recurring billing for ${selectedStudent.first_name} ${selectedStudent.last_name}`}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="card" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="card">Card Information</TabsTrigger>
                <TabsTrigger value="billing">Billing Cycle</TabsTrigger>
              </TabsList>
              
              <TabsContent value="card" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="card-number">Card Number *</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.card_number}
                      onChange={(e) => handlePaymentChange('card_number', e.target.value)}
                      maxLength="19"
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="card-holder">Cardholder Name *</Label>
                    <Input
                      id="card-holder"
                      placeholder="John Doe"
                      value={paymentData.card_holder}
                      onChange={(e) => handlePaymentChange('card_holder', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="expiry-month">Month *</Label>
                      <Select 
                        value={paymentData.expiry_month} 
                        onValueChange={(value) => handlePaymentChange('expiry_month', value)}
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="expiry-year">Year *</Label>
                      <Select 
                        value={paymentData.expiry_year} 
                        onValueChange={(value) => handlePaymentChange('expiry_year', value)}
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                        maxLength="4"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="billing" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="billing-cycle">Billing Cycle *</Label>
                    <Select 
                      value={paymentData.billing_cycle} 
                      onValueChange={(value) => handlePaymentChange('billing_cycle', value)}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="billing-amount">Billing Amount *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="billing-amount"
                        type="number"
                        placeholder="0.00"
                        value={paymentData.billing_amount}
                        onChange={(e) => handlePaymentChange('billing_amount', e.target.value)}
                        className="pl-10"
                        step="0.01"
                        min="0"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-accent/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="pass-fees"
                      checked={paymentData.pass_fees_to_customer}
                      onChange={(e) => handlePaymentChange('pass_fees_to_customer', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                      disabled={submitting}
                    />
                    <Label htmlFor="pass-fees" className="cursor-pointer">
                      Pass credit card processing fees to customer (typically 2.9% + $0.30)
                    </Label>
                  </div>

                  {paymentData.pass_fees_to_customer && paymentData.billing_amount && (
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm font-medium text-foreground mb-2">Fee Calculation:</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Base Amount: ${parseFloat(paymentData.billing_amount).toFixed(2)}</p>
                        <p>Processing Fee (2.9% + $0.30): ${(parseFloat(paymentData.billing_amount) * 0.029 + 0.30).toFixed(2)}</p>
                        <p className="font-bold text-foreground pt-2 border-t border-border">
                          Total Charged: ${(parseFloat(paymentData.billing_amount) + (parseFloat(paymentData.billing_amount) * 0.029 + 0.30)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleSavePayment}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Payment Info
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center text-red-600">
                <Trash2 className="h-6 w-6 mr-2" />
                Delete Student
              </DialogTitle>
              <DialogDescription>
                {selectedStudent && `Are you sure you want to delete ${selectedStudent.first_name} ${selectedStudent.last_name}? This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={submitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteStudent}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Student
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SimpleLayout>
  )
}

