import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

interface Staff {
  id: string;
  user_id: string;
  staff_number?: string;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'nurse' | 'admin';
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ManageStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: Staff;
}

const ManageStaffModal: React.FC<ManageStaffModalProps> = ({ isOpen, onClose, currentStaff }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'nurse' as 'doctor' | 'nurse' | 'admin',
    staffNumber: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const staffData = await response.json();
        setStaff(staffData.map((member: any) => ({
          id: member.id,
          user_id: member.userId || '',
          staff_number: member.staffNumber,
          first_name: member.firstName,
          last_name: member.lastName,
          role: member.role as 'doctor' | 'nurse' | 'admin',
          phone: member.phone,
          is_active: member.isActive,
          created_at: member.createdAt,
          updated_at: member.updatedAt
        })));
      } else {
        throw new Error('Failed to fetch staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (name, email, and password)",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error", 
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call the edge function to create staff user
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://yhsyeovshmoyseusytpd.supabase.co/functions/v1/create-staff-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          staff_number: formData.staffNumber
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create staff member');
      }

      toast({
        title: "Success",
        description: "Staff member added successfully with the provided credentials.",
      });
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'nurse',
        staffNumber: ''
      });
      setShowAddForm(false);
      fetchStaff();
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaff = async (staffId: string, updates: Partial<Staff>) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
      fetchStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
    }
  };

  const toggleStaffStatus = async (staffMember: Staff) => {
    await handleUpdateStaff(staffMember.id, { is_active: !staffMember.is_active });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'doctor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'nurse': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'doctor': return 'Doctor';
      case 'nurse': return 'Nurse';
      default: return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Manage Staff</span>
          </DialogTitle>
          <DialogDescription>
            View, add, and manage clinic staff members
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="staff-list" className="w-full">
          <TabsList className={`grid w-full ${currentStaff.role === 'admin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="staff-list">Staff Members</TabsTrigger>
            {currentStaff.role === 'admin' && (
              <TabsTrigger value="add-staff">Add New Staff</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="staff-list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff Members ({staff.filter(s => s.is_active).length} active)</CardTitle>
                <CardDescription>
                  Manage existing staff members and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading staff members...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Staff #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              No staff members found
                            </TableCell>
                          </TableRow>
                        ) : (
                          staff.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {member.first_name} {member.last_name}
                              </TableCell>
                              <TableCell>
                                <Badge className={getRoleColor(member.role)}>
                                  {getRoleDisplayName(member.role)}
                                </Badge>
                              </TableCell>
                              <TableCell>{member.phone || 'N/A'}</TableCell>
                              <TableCell>{member.staff_number || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={member.is_active}
                                    onCheckedChange={() => toggleStaffStatus(member)}
                                    disabled={currentStaff.role !== 'admin'}
                                  />
                                  <span className="text-sm">
                                    {member.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingStaff(member)}
                                    disabled={currentStaff.role !== 'admin'}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-staff" className="space-y-4">
            {currentStaff.role === 'admin' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Staff Member</CardTitle>
                  <CardDescription>
                    Create a new staff account. They will receive login credentials via email.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="email">Email Address *</Label>
                     <Input
                       id="email"
                       type="email"
                       value={formData.email}
                       onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                       required
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="password">Password *</Label>
                     <Input
                       id="password"
                       type="password"
                       value={formData.password}
                       onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                       placeholder="Minimum 8 characters"
                       required
                     />
                   </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="staffNumber">Staff Number</Label>
                      <Input
                        id="staffNumber"
                        value={formData.staffNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, staffNumber: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'doctor' | 'nurse' | 'admin') => 
                        setFormData(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Adding...' : 'Add Staff Member'}
                    </Button>
                  </div>
                </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                    <p className="text-muted-foreground">
                      Only administrators can add new staff members.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Staff Modal */}
        {editingStaff && (
          <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Staff Member</DialogTitle>
                <DialogDescription>
                  Update staff member information
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={editingStaff.first_name}
                      onChange={(e) => setEditingStaff(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={editingStaff.last_name}
                      onChange={(e) => setEditingStaff(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editingStaff.phone || ''}
                      onChange={(e) => setEditingStaff(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Staff Number</Label>
                    <Input
                      value={editingStaff.staff_number || ''}
                      onChange={(e) => setEditingStaff(prev => prev ? { ...prev, staff_number: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editingStaff.role}
                    onValueChange={(value: 'doctor' | 'nurse' | 'admin') => 
                      setEditingStaff(prev => prev ? { ...prev, role: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingStaff(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (editingStaff) {
                        handleUpdateStaff(editingStaff.id, {
                          first_name: editingStaff.first_name,
                          last_name: editingStaff.last_name,
                          phone: editingStaff.phone,
                          staff_number: editingStaff.staff_number,
                          role: editingStaff.role
                        });
                        setEditingStaff(null);
                      }
                    }}
                  >
                    Update Staff
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageStaffModal;