import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Trash2, Save, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
import { apiClient, salaryProcessingService } from '@/services/api';
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

  // Salary Processing States
  const [processingEmployeeId, setProcessingEmployeeId] = useState<string>('');
  const [processingMonth, setProcessingMonth] = useState<string>(
    new Date().toISOString().split('T')[0].substring(0, 7)
  );
  const [processingLoading, setProcessingLoading] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [timesheetStatus, setTimesheetStatus] = useState<string>('');

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

  const handleProcessSalary = async () => {
    if (!processingEmployeeId || !processingMonth) {
      toast({
        title: 'Validation Error',
        description: 'Please select an employee and month',
        variant: 'destructive',
      });
      return;
    }

    setProcessingLoading(true);
    try {
      const result = await salaryProcessingService.process({
        userId: parseInt(processingEmployeeId),
        month: processingMonth,
      });
      setProcessingResult(result);
      setTimesheetStatus(result.timesheet_approved ? 'APPROVED' : 'PENDING');
      
      toast({
        title: '✅ Salary Processed',
        description: `Salary processed for ${getEmployeeName(parseInt(processingEmployeeId))} - ${processingMonth}`,
      });
    } catch (error: any) {
      console.error('Error processing salary:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to process salary',
        variant: 'destructive',
      });
    } finally {
      setProcessingLoading(false);
    }
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

      {/* Salary Processing Section */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Monthly Salary Processing
          </CardTitle>
          <CardDescription>Process monthly salary for employees based on leaves and timesheet approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="processing-employee">Employee</Label>
                <Select value={processingEmployeeId} onValueChange={setProcessingEmployeeId}>
                  <SelectTrigger id="processing-employee" className="h-10">
                    <SelectValue placeholder="Select employee..." />
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

              {/* Month Selection */}
              <div className="space-y-2">
                <Label htmlFor="processing-month">Month</Label>
                <Input
                  id="processing-month"
                  type="month"
                  value={processingMonth}
                  onChange={(e) => setProcessingMonth(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Process Button */}
              <div className="flex items-end">
                <Button
                  onClick={handleProcessSalary}
                  disabled={processingLoading || !processingEmployeeId || !processingMonth}
                  className="w-full h-10"
                >
                  {processingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Process Salary
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Processing Result */}
            {processingResult && (
              <div className="space-y-4 mt-6 p-4 bg-slate-50 rounded-lg border">
                <h3 className="font-semibold flex items-center gap-2">
                  {processingResult.status === 'PROCESSED' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Salary Processed Successfully</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span>Salary On Hold</span>
                    </>
                  )}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Basic Salary */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Basic Salary</p>
                    <p className="text-lg font-semibold">
                      ₹{processingResult.basicSalary?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Working Days */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Working Days</p>
                    <p className="text-lg font-semibold">{processingResult.workingDays}</p>
                  </div>

                  {/* Per Day Salary */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Per Day Salary</p>
                    <p className="text-lg font-semibold">
                      ₹{Math.round(processingResult.basicSalary / processingResult.workingDays).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Yearly Allocation */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Yearly Allocation</p>
                    <p className="text-lg font-semibold">{processingResult.yearlyAllocated || 0} days</p>
                  </div>

                  {/* Yearly Used */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Used in Year</p>
                    <p className="text-lg font-semibold">{processingResult.yearlyUsed || 0} days</p>
                  </div>

                  {/* This Month Leaves */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">This Month Leaves</p>
                    <p className="text-lg font-semibold">{processingResult.totalLeaves} days</p>
                  </div>

                  {/* Paid from Allocation */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Paid (from Allocation)</p>
                    <p className="text-lg font-semibold text-green-600">{processingResult.paidLeavesThisMonth || 0} days</p>
                  </div>

                  {/* Unpaid / Loss of Pay */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Loss of Pay</p>
                    <p className="text-lg font-semibold text-red-600">{processingResult.unpaidLeaves} days</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  {/* Deduction */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-muted-foreground">Deduction (Unpaid Leaves)</span>
                    <span className="font-semibold text-red-600">
                      - ₹{processingResult.deduction?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Final Salary */}
                  <div className="flex justify-between items-center p-3 bg-white rounded border-2 border-green-200">
                    <span className="font-semibold text-lg">Final Monthly Salary</span>
                    <span className="font-bold text-2xl text-green-600">
                      ₹{processingResult.finalSalary?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Timesheet Status */}
                <div className="mt-4 p-3 rounded bg-white border flex items-center justify-between">
                  <span className="text-sm font-medium">Timesheet Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      processingResult.timesheet_approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {processingResult.timesheet_approved ? '✅ Approved' : '⏳ Pending'}
                  </span>
                </div>

                {processingResult.status === 'HOLD' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
                    <p className="font-medium mb-1">⚠️ Status: On Hold</p>
                    <p>This salary is on hold because the timesheet for {processingMonth} is not approved yet. It will be finalized once the timesheet is approved by the manager.</p>
                  </div>
                )}
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
