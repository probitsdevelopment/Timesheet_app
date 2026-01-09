import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUsers, addUser, deleteUser, updateUser, setLoading, setError } from '@/store/reducers/userReducer';
import { userService } from '@/services/api';
import { AppUser } from '@/store/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Users, Loader2, Trash2, MoreHorizontal, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const UsersPage = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Use Redux state
  const { users, isLoading } = useAppSelector((state) => state.users);

  const [isOpen, setIsOpen] = useState(false);
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppUser['role']>('employee');
  const [managerId, setManagerId] = useState<string>('');
  const [numberOfHours, setNumberOfHours] = useState<string>('');

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('👥 Fetching users from API...');
        const token = localStorage.getItem('authToken');
        console.log('🔑 Token available:', !!token);
        dispatch(setLoading(true));
        const data = await userService.getAll();
        console.log('✅ Users loaded:', data);
        console.log('📊 User data shape:', data?.[0]);
        dispatch(setUsers(data));
      } catch (error) {
        console.error('❌ Failed to load users:', error);
        dispatch(setError('Failed to load users'));
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchUsers();
  }, [dispatch, toast]);

  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  const handleCreateUser = async () => {
    if (!name || !email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('👤 Creating user via API...');
      dispatch(setLoading(true));
      console.log('✅ Dispatched setLoading(true)');
      
      const newUser = await userService.create({
        name,
        email,
        password,
        role,
        managerId: managerId || null,
        numberOfHours: numberOfHours ? parseInt(numberOfHours) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ User created:', newUser);

      // Fetch updated users list
      console.log('📥 Fetching updated users from API...');
      const updatedUsers = await userService.getAll();
      console.log('✅ Updated users fetched:', updatedUsers);
      
      console.log('📤 Dispatching setUsers action...');
      dispatch(setUsers(updatedUsers));
      console.log('✅ Dispatched setUsers action');

      toast({
        title: 'User Created',
        description: `${name} has been added successfully.`,
      });
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      dispatch(setError('Failed to create user'));
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      dispatch(setLoading(false));
      console.log('✅ Dispatched setLoading(false)');
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    try {
      console.log('🗑️ Deleting user via API...');
      dispatch(setLoading(true));
      await userService.delete(user.id);
      console.log('✅ User deleted');

      // Fetch updated users list
      const updatedUsers = await userService.getAll();
      dispatch(setUsers(updatedUsers));

      toast({
        title: 'User Deleted',
        description: `${user.name} has been removed.`,
      });
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      dispatch(setError('Failed to delete user'));
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAssignManager = async () => {
    if (!selectedUser || !managerId) return;

    try {
      console.log('👨‍💼 Assigning manager via API...');
      dispatch(setLoading(true));
      await userService.assignManager(selectedUser.id, managerId);
      console.log('✅ Manager assigned');

      // Fetch updated users list
      const updatedUsers = await userService.getAll();
      console.log('📋 Updated users after assignment:', updatedUsers);
      console.log('🔍 User with managerId:', updatedUsers.find(u => u.id === selectedUser.id));
      dispatch(setUsers(updatedUsers));

      toast({
        title: 'Manager Assigned',
        description: `Manager has been assigned to ${selectedUser.name}.`,
      });
      setIsManagerDialogOpen(false);
      setSelectedUser(null);
      setManagerId('');
    } catch (error) {
      console.error('❌ Failed to assign manager:', error);
      dispatch(setError('Failed to assign manager'));
      toast({
        title: 'Error',
        description: 'Failed to assign manager',
        variant: 'destructive',
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setManagerId('');
    setNumberOfHours('');
  };

  const getRoleBadge = (role: AppUser['role']) => {
    const variants = {
      admin: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
      manager: 'bg-primary/10 text-primary hover:bg-primary/20',
      employee: 'bg-muted text-muted-foreground hover:bg-muted/80',
    };
    return variants[role];
  };

  const getManagerName = (mId?: string | number) => {
    if (!mId) return '-';
    console.log('🔎 Looking for manager with ID:', mId, 'Type:', typeof mId);
    const manager = users.find((u) => u.id === mId || u.id?.toString() === mId?.toString());
    console.log('🧑 Found manager:', manager?.name);
    return manager?.name || '-';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage team members and their roles</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2">
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription className="text-xs">Add a new team member</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="numberOfHours" className="text-sm">Number of Hours</Label>
                <Input
                  id="numberOfHours"
                  type="number"
                  placeholder="Enter hours"
                  value={numberOfHours}
                  onChange={(e) => setNumberOfHours(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as AppUser['role'])}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === 'employee' && managers.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm">Assign Manager (Optional)</Label>
                  <Select value={managerId} onValueChange={setManagerId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {users.filter((u) => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Managers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {users.filter((u) => u.role === 'manager').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {users.filter((u) => u.role === 'employee').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all team members</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No users yet</p>
              <p className="text-sm">Create your first team member to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleBadge(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getManagerName(user.managerid)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.createdAt ? format(new Date(user.createdAt + (user.createdAt.includes('T') ? '' : 'T00:00:00')), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role === 'employee' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsManagerDialogOpen(true);
                                }}
                              >
                                <UserCog className="w-4 h-4 mr-2" />
                                Assign Manager
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Manager Dialog */}
      <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
            <DialogDescription>
              Assign a manager to {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Select Manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManagerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignManager} disabled={!managerId}>
              Assign Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
