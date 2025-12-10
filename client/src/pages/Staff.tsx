import { useState, useEffect } from 'react'
import BottomNavLayout from '@/components/BottomNavLayout';
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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Briefcase,
  Users,
  Shield,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

const API_URL = '/api'  // Use relative path to work from any device

export default function Staff({ onLogout, theme, toggleTheme }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [stats, setStats] = useState({
    total_staff: 0,
    instructors: 0,
    assistants: 0,
    admin_staff: 0
  })
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'Instructor',
    bio: '',
    photo_url: ''
  })
  
  const [staffMembers, setStaffMembers] = useState([])

  // Fetch staff and stats on mount
  useEffect(() => {
    fetchStaff()
    fetchStats()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/staff`)
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setStaffMembers(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast.error('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/staff/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'Instructor',
      bio: '',
      photo_url: ''
    })
  }

  const handleAddStaff = async () => {
    try {
      setSubmitting(true)
      
      const response = await fetch(`${API_URL}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to add staff member')
      
      toast.success('Staff member added successfully')
      setShowAddModal(false)
      resetForm()
      fetchStaff()
      fetchStats()
    } catch (error) {
      console.error('Error adding staff:', error)
      toast.error('Failed to add staff member')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (staff) => {
    setSelectedStaff(staff)
    setFormData({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role || 'Instructor',
      bio: staff.bio || '',
      photo_url: staff.photo_url || ''
    })
    setShowEditModal(true)
  }

  const handleEditStaff = async () => {
    try {
      setSubmitting(true)
      
      const response = await fetch(`${API_URL}/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to update staff member')
      
      toast.success('Staff member updated successfully')
      setShowEditModal(false)
      resetForm()
      setSelectedStaff(null)
      fetchStaff()
      fetchStats()
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update staff member')
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (staff) => {
    setSelectedStaff(staff)
    setShowDeleteDialog(true)
  }

  const handleDeleteStaff = async () => {
    try {
      setSubmitting(true)
      
      const response = await fetch(`${API_URL}/staff/${selectedStaff.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete staff member')
      
      toast.success('Staff member deleted successfully')
      setShowDeleteDialog(false)
      setSelectedStaff(null)
      fetchStaff()
      fetchStats()
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Failed to delete staff member')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStaff = staffMembers.filter(staff =>
    `${staff.first_name} ${staff.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <BottomNavLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground mt-1">Manage your dojo's staff members and instructors</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_staff}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Instructors</CardTitle>
              <Briefcase className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.instructors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assistants</CardTitle>
              <User className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.assistants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admin Staff</CardTitle>
              <Shield className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.admin_staff}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search staff by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Staff Members Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery ? 'Try adjusting your search query' : 'Get started by adding your first staff member'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowAddModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Staff Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((staff) => (
              <Card key={staff.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {staff.photo_url ? (
                        <img src={staff.photo_url} alt={staff.name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {staff.first_name} {staff.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">{staff.role}</p>
                      
                      <div className="space-y-2 text-sm">
                        {staff.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{staff.email}</span>
                          </div>
                        )}
                        {staff.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{staff.phone}</span>
                          </div>
                        )}
                      </div>

                      {staff.bio && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{staff.bio}</p>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(staff)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(staff)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Staff Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Enter the details for the new staff member
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="John"
                />
              </div>

              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Smith"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john.smith@dojo.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="555-0101"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Master Instructor">Master Instructor</SelectItem>
                    <SelectItem value="Instructor">Instructor</SelectItem>
                    <SelectItem value="Assistant Instructor">Assistant Instructor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Receptionist">Receptionist</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Brief description..."
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input
                  id="photo_url"
                  value={formData.photo_url}
                  onChange={(e) => handleInputChange('photo_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Staff Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update the staff member's information
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="edit_role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Master Instructor">Master Instructor</SelectItem>
                    <SelectItem value="Instructor">Instructor</SelectItem>
                    <SelectItem value="Assistant Instructor">Assistant Instructor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Receptionist">Receptionist</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="edit_bio">Bio</Label>
                <Input
                  id="edit_bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="edit_photo_url">Photo URL</Label>
                <Input
                  id="edit_photo_url"
                  value={formData.photo_url}
                  onChange={(e) => handleInputChange('photo_url', e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); setSelectedStaff(null); }}>
                Cancel
              </Button>
              <Button onClick={handleEditStaff} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Staff Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedStaff?.first_name} {selectedStaff?.last_name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedStaff(null); }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteStaff} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BottomNavLayout>
  )
}

