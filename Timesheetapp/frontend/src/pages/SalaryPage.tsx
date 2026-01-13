import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import { setUsers, setLoading } from '@/store/reducers/userReducer';
import { userService } from '@/services/api';

const SalaryPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.users);
  const { currentUser } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [basicSalary, setBasicSalary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [salaries, setSalaries] = useState<any[]>([]);

  // Check if user is admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only admins can access salary management',
        variant: 'destructive',
      });
      navigate('/dashboard/timesheets');
    }
  }, [currentUser, navigate, toast]);

  // Get only employees and managers from same organization
  const employees = users.filter((u) => (u.role === 'employee' || u.role === 'manager') && u.organization === currentUser?.organization);

  // Fetch users on mount if not already loaded
  useEffect(() => {
    if (users.length === 0) {
      const fetchUsers = async () => {
        try {
          dispatch(setLoading(true));
          const data = await userService.getAll();
          dispatch(setUsers(data));
        } catch (error) {
          console.error('Failed to load users:', error);
        } finally {
          dispatch(setLoading(false));
        }
      };
      fetchUsers();
    }
  }, [dispatch, users.length]);

  // Fetch existing salaries on mount
  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const data = await apiClient.get('/salaries');
        setSalaries(data);
      } catch (error) {
        console.error('Failed to load salaries:', error);
      }
    };
    fetchSalaries();
  }, []);

  // Load salary when employee is selected
  useEffect(() => {
    if (selectedEmployeeId) {
      const existingSalary = salaries.find((s) => s.user_id === parseInt(selectedEmployeeId));
      if (existingSalary) {
        setBasicSalary(existingSalary.basic_salary.toString());
      } else {
        setBasicSalary('');
      }
    }
  }, [selectedEmployeeId, salaries]);

  const handleSaveSalary = async () => {
    if (!selectedEmployeeId || !basicSalary) {
      toast({
        title: 'Validation Error',
        description: 'Please select an employee and enter basic salary',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const salaryAmount = parseFloat(basicSalary);
      if (isNaN(salaryAmount) || salaryAmount <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid salary amount',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const existingSalary = salaries.find((s) => s.user_id === parseInt(selectedEmployeeId));

      if (existingSalary) {
        // Update existing salary
        await apiClient.put(`/salaries/${existingSalary.id}`, {
          basic_salary: salaryAmount,
        });
      } else {
        // Create new salary
        await apiClient.post('/salaries', {
          user_id: parseInt(selectedEmployeeId),
          basic_salary: salaryAmount,
        });
      }

      // Refresh salaries
      const updatedSalaries = await apiClient.get('/salaries');
      setSalaries(updatedSalaries);

      toast({
        title: '✅ Success',
        description: 'Salary saved successfully',
      });

      setBasicSalary('');
      setSelectedEmployeeId('');
    } catch (error) {
      console.error('Error saving salary:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to save salary',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSalary = async (salaryId: number) => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/salaries/${salaryId}`);

      // Refresh salaries
      const updatedSalaries = await apiClient.get('/salaries');
      setSalaries(updatedSalaries);

      toast({
        title: '✅ Deleted',
        description: 'Salary record deleted successfully',
      });

      setBasicSalary('');
      setSelectedEmployeeId('');
    } catch (error) {
      console.error('Error deleting salary:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to delete salary',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeName = (userId: number) => {
    return users.find((u) => parseInt(u.id) === userId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Salary</h1>
        <p className="text-muted-foreground">Manage employee salaries</p>
      </div>

      {/* Salary Management Section */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">₹</span>
            Salary Part Admin
          </CardTitle>
          <CardDescription>Add or update employee basic salary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee">Employees</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee" className="h-10">
                  <SelectValue placeholder="Select an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No employees found</div>
                  ) : (
                    employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Salary Input */}
            {selectedEmployeeId && (
              <div className="space-y-2">
                <Label htmlFor="salary">Basic Salary</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="Enter basic salary"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                      className="pl-7"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedEmployeeId && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveSalary}
                  disabled={isLoading || !basicSalary}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Salary'}
                </Button>

                {salaries.find((s) => s.user_id === parseInt(selectedEmployeeId)) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isLoading}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Salary
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Salary Record</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this salary record? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogAction
                        onClick={() => {
                          const salary = salaries.find((s) => s.user_id === parseInt(selectedEmployeeId));
                          if (salary) {
                            handleDeleteSalary(salary.id);
                          }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedEmployeeId('');
                    setBasicSalary('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Salary List Section */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>All employee salary records for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {salaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No salary records yet. Create one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries
                    .filter((s) => {
                      const emp = users.find((u) => u.id === s.user_id);
                      return emp?.organization === currentUser?.organization;
                    })
                    .map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell className="font-medium">{getEmployeeName(salary.user_id)}</TableCell>
                        <TableCell>₹{parseFloat(salary.basic_salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{new Date(salary.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployeeId(salary.user_id.toString());
                              setBasicSalary(salary.basic_salary.toString());
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryPage;
