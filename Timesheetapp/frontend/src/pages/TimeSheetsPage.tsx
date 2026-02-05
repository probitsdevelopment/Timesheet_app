import { Clock, Plus, Trash2, Send, Calendar, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import {
  toggleAddEntryModal,
  deleteEntry,
  setEntries,
  setLoading,
  setError,
  setTimesheets,
  setSelectedMonth,
  setSelectedDate,
  submitTimesheet,
} from '@/store/reducers/timeSheetReducer';
import AddEntryModal from '@/components/AddEntryModal';
import LocationFilter from '@/components/LocationFilter';
import LocationStats from '@/components/LocationStats';
import { timesheetService, timesheetSubmissionService, leaveService, leaveAllocationService } from '@/services/api';

const TimeSheetsPage = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { currentUser } = useAppSelector((state) => state.auth);
  const { entries, timesheets, selectedMonth } = useAppSelector((state) => state.timesheet);
  const [currentMonth, setCurrentMonth] = useState(selectedMonth || new Date().toISOString().slice(0, 7));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [selectedDateLocal, setSelectedDateLocal] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: '', startDate: '', endDate: '', reason: '' });
  const [approvedLeaves, setApprovedLeaves] = useState<any[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [requestedDays, setRequestedDays] = useState<number>(0);
  const [isLossOfPayLeave, setIsLossOfPayLeave] = useState(false);
  const [locationFilter, setLocationFilter] = useState<'all' | 'office' | 'work_from_home'>('all');

  // Get days in month
  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (dateString: string) => {
    const [year, month] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1).getDay();
  };

  // Fetch time entries and timesheets on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(setLoading(true));
        console.log(' Fetching time entries for user:', currentUser?.id);
        
        // Fetch time entries (required)
        const entriesData = await timesheetService.getAll();
        console.log(' Fetched entries:', entriesData);
        console.log(' Entry data shape:', entriesData?.[0]);
        dispatch(setEntries(entriesData));
        
        // Fetch timesheets (optional - might not exist yet)
        if (currentUser) {
          try {
            const timesheetsData = await timesheetSubmissionService.getByUserId(currentUser.id);
            console.log(' Fetched timesheets:', timesheetsData);
            if (timesheetsData) {
              dispatch(setTimesheets(timesheetsData));
            }
          } catch (tsError) {
            console.log('ℹ️ No timesheets found yet (this is normal for new users)');
          }

          // Fetch approved leaves
          try {
            setLeavesLoading(true);
            const leavesData = await leaveService.getAll();
            const approved = leavesData?.filter((leave: any) => leave.status === 'approved') || [];
            console.log('✅ Fetched approved leaves:', approved);
            setApprovedLeaves(approved);
          } catch (leavesError) {
            console.log('ℹ️ Could not fetch leaves');
            setApprovedLeaves([]);
          } finally {
            setLeavesLoading(false);
          }

          // Fetch leave balance
          try {
            setBalanceLoading(true);
            const balanceData = await leaveAllocationService.getBalance();
            console.log('✅ Fetched leave balance:', balanceData);
            setLeaveBalance(balanceData);
          } catch (balanceError) {
            console.log('ℹ️ Could not fetch leave balance');
            setLeaveBalance(null);
          } finally {
            setBalanceLoading(false);
          }
        }
      } catch (error) {
        dispatch(setError('Failed to load time entries'));
        console.error('Fetch error:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchData();
  }, [dispatch, currentUser]);

  // Get entries for current month (dates are already in YYYY-MM-DD format from backend)
  const monthEntries = entries.filter((entry) => entry.date.startsWith(currentMonth));
  const totalMonthHours = Math.round(monthEntries.reduce((sum, entry) => sum + parseFloat(entry.hours?.toString() || '0'), 0) * 100) / 100;

  // Check if timesheet for current month exists and its status
  const currentTimesheet = timesheets.find(
    (ts) => ts.month === currentMonth && ts.user_id === currentUser?.id
  );
  const timesheetStatus = currentTimesheet?.status || 'draft';
  const canSubmit = timesheetStatus === 'draft' && monthEntries.length > 0;

  // Map leave type names between form and allocation system
  const mapLeaveType = (formLeaveType: string): string => {
    // Leave types now match database exactly, so just return as-is
    return formLeaveType || 'Leave';
  };

  // Calculate requested days for current form
  const calculateRequestedDays = (): number => {
    if (!leaveForm.startDate || !leaveForm.endDate) return 0;
    const startDate = new Date(leaveForm.startDate);
    const endDate = new Date(leaveForm.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  // Get available balance for selected leave type
  const getAvailableBalance = (): number => {
    if (!leaveBalance || !leaveForm.leaveType) return 0;
    
    // Leave types now match database exactly
    const typeBalance = leaveBalance.byType?.[leaveForm.leaveType];
    const remaining = typeBalance?.remaining || 0;
    
    console.log(`🔍 Balance for ${leaveForm.leaveType}:`, remaining);
    return remaining;
  };

  // Calculate actual requested days
  const daysRequested = calculateRequestedDays();
  const availableBalance = getAvailableBalance();
  const hasInsufficientBalance = daysRequested > 0 && daysRequested > availableBalance;

  // Handle submit timesheet
  const handleSubmitTimesheet = async () => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'User not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      let timesheet = currentTimesheet;

      if (!timesheet) {
        // Create new timesheet
        const newTimesheet: any = {
          user_id: currentUser.id,
          month: currentMonth,
          year: new Date(currentMonth).getFullYear(),
          total_hours: totalMonthHours,
          status: 'submitted' as const,
          submitted_to: currentUser.managerid || null,
          organization: currentUser.organization,
        };
        const response = await timesheetSubmissionService.create(newTimesheet);
        dispatch(submitTimesheet(response));
      } else {
        // Update existing timesheet
        const updatedTimesheet = {
          ...timesheet,
          total_hours: totalMonthHours,
          status: 'submitted' as const,
          submitted_at: new Date().toISOString(),
          submitted_to: currentUser.managerid || null,
        };
        await timesheetSubmissionService.submit(String(timesheet.id), updatedTimesheet);
        dispatch(submitTimesheet(updatedTimesheet));
      }

      toast({
        title: 'Success',
        description: 'Timesheet submitted successfully!',
      });
    } catch (error) {
      console.error('Failed to submit timesheet:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit timesheet',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: 'Month Total', value: `${totalMonthHours}h`, change: 'Current month' },
    { label: 'Status', value: timesheetStatus.charAt(0).toUpperCase() + timesheetStatus.slice(1), change: '' },
    { label: 'Total Leaves', value: leaveBalance?.totalAllocated || '0', change: 'Allocated' },
    { label: 'Remaining Leaves', value: leaveBalance?.remainingLeaves || '0', change: `Used: ${leaveBalance?.usedLeaves || 0}` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Sheets</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.name}! Track your time efficiently.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowLeaveModal(true)}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <AlertCircle className="w-4 h-4" />
            Apply Leave
          </Button>
          <Button
            onClick={handleSubmitTimesheet}
            disabled={!canSubmit || isSubmitting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-primary" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => {
                setCurrentMonth(e.target.value);
                dispatch(setSelectedMonth(e.target.value));
              }}
              className="px-4 py-2 border rounded-lg"
            />
            <span className="text-sm text-muted-foreground">
              {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium">{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Work Location Statistics */}
      <LocationStats entries={entries} />

      {/* Calendar View */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Monthly Calendar</CardTitle>
          <CardDescription>
            {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days of month */}
              {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                const dayEntries = monthEntries.filter((e) => e.date === dateStr);
                const dayHours = Math.round(dayEntries.reduce((sum, e) => sum + parseFloat(e.hours?.toString() || '0'), 0) * 10) / 10;
                const isSelected = selectedDateLocal === dateStr;
                
                // Get work location indicators for this day
                const hasOffice = dayEntries.some((e) => e.work_location === 'office');
                const hasWFH = dayEntries.some((e) => e.work_location === 'work_from_home');

                // Check if this date has approved leave
                const isLeaveTaken = approvedLeaves.some((leave) => {
                  const startDate = leave.start_date.split('T')[0];
                  const endDate = leave.end_date.split('T')[0];
                  return dateStr >= startDate && dateStr <= endDate;
                });

                return (
                  <button
                    key={day}
                    onClick={() => {
                      // Don't allow adding entries on leave days
                      if (isLeaveTaken) return;
                      
                      const newSelected = isSelected ? null : dateStr;
                      setSelectedDateLocal(newSelected);
                      dispatch(setSelectedDate(newSelected));
                      if (!isSelected) {
                        dispatch(toggleAddEntryModal(true));
                      }
                    }}
                    className={`aspect-square p-2 rounded-lg border-2 transition-colors flex flex-col items-center justify-center cursor-pointer ${
                      isLeaveTaken
                        ? 'border-blue-500 bg-blue-100 hover:bg-blue-200 cursor-not-allowed'
                        : isSelected
                        ? 'border-primary bg-primary/10'
                        : dayEntries.length > 0
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{day}</div>
                    {isLeaveTaken && (
                      <div className="text-xs text-blue-600 font-medium">Leave</div>
                    )}
                    {!isLeaveTaken && dayHours > 0 && (
                      <div>
                        <div className="text-xs text-blue-600 font-medium">{dayHours}h</div>
                        <div className="text-xs mt-1 flex gap-1">
                          {hasOffice && <span>🏢</span>}
                          {hasWFH && <span>🏠</span>}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <AddEntryModal />

      {/* Apply Leave Modal */}
      <Dialog open={showLeaveModal} onOpenChange={(open) => {
        setShowLeaveModal(open);
        if (!open) {
          setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
          setIsLossOfPayLeave(false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Submit a leave request to your manager for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="leave-type">Type of Leave</Label>
              <Select value={leaveForm.leaveType} onValueChange={(value) => setLeaveForm({ ...leaveForm, leaveType: value })}>
                <SelectTrigger id="leave-type">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual Leave</SelectItem>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Personal">Personal Leave</SelectItem>
                  <SelectItem value="Special">Special Leave</SelectItem>
                </SelectContent>
              </Select>
              {leaveForm.leaveType && leaveBalance && (
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded">
                  Available {mapLeaveType(leaveForm.leaveType)} Leave: <span className="font-semibold text-blue-700">{getAvailableBalance()} days</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave <span className="text-red-500">*</span></Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for your leave request..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                className="resize-none"
                required
              />
            </div>

            {/* Days summary and balance warning */}
            {leaveForm.startDate && leaveForm.endDate && (
              <div className="space-y-3 mt-4">
                <div className="text-sm p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-2">Leave Summary</p>
                  <p className="text-muted-foreground">
                    Days requested: <span className="font-semibold text-gray-900">{calculateRequestedDays()} days</span>
                  </p>
                  {leaveForm.leaveType && leaveBalance && (
                    <p className="text-muted-foreground">
                      Available: <span className={`font-semibold ${hasInsufficientBalance ? 'text-red-600' : 'text-green-600'}`}>
                        {getAvailableBalance()} days
                      </span>
                    </p>
                  )}
                </div>

                {hasInsufficientBalance && (
                  <div className="space-y-3">
                    <div className="text-sm p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-800">
                        <span className="font-semibold">Insufficient Balance:</span> You don't have enough {mapLeaveType(leaveForm.leaveType)} leave days. You need {calculateRequestedDays()} days but only have {getAvailableBalance()} days available.
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLossOfPayLeave}
                          onChange={(e) => setIsLossOfPayLeave(e.target.checked)}
                          className="mt-1 w-4 h-4 accent-orange-600"
                        />
                        <span className="text-sm text-orange-800">
                          <span className="font-semibold">I acknowledge this will be Loss of Pay</span>
                          <p className="text-xs mt-1 text-orange-700">
                            By checking this, I understand that the leave days exceeding my allocated balance will be marked as unpaid and will be deducted from my salary.
                          </p>
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLeaveModal(false);
                setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
                setIsLossOfPayLeave(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  setIsSubmittingLeave(true);
                  
                  // Validate all required fields
                  if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
                    toast({
                      title: 'Validation Error',
                      description: 'Please fill in all fields including reason for leave',
                      variant: 'destructive',
                    });
                    setIsSubmittingLeave(false);
                    return;
                  }

                  if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
                    toast({
                      title: 'Invalid Dates',
                      description: 'Start date must be before end date',
                      variant: 'destructive',
                    });
                    setIsSubmittingLeave(false);
                    return;
                  }

                  // Calculate requested days
                  const requestedDays = calculateRequestedDays();
                  const availableBalance = getAvailableBalance();
                  const mappedType = mapLeaveType(leaveForm.leaveType);

                  // Check if user has sufficient balance (allow Loss of Pay if checkbox is checked)
                  const hasInsufficientBalance = requestedDays > availableBalance;
                  
                  if (hasInsufficientBalance && !isLossOfPayLeave) {
                    toast({
                      title: 'Insufficient Leave Balance',
                      description: `You requested ${requestedDays} days of ${mappedType} leave, but only have ${availableBalance} days available. Check "Loss of Pay" to continue.`,
                      variant: 'destructive',
                    });
                    setIsSubmittingLeave(false);
                    return;
                  }

                  const response = await leaveService.create({
                    leave_type: leaveForm.leaveType,
                    start_date: leaveForm.startDate,
                    end_date: leaveForm.endDate,
                    reason: leaveForm.reason,
                    is_paid_leave: !hasInsufficientBalance,
                  });

                  toast({
                    title: 'Success',
                    description: `Leave request submitted successfully! Days: ${requestedDays}`,
                  });

                  setShowLeaveModal(false);
                  setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
                  setIsLossOfPayLeave(false);
                } catch (error) {
                  console.error('Error submitting leave:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to submit leave request. Please try again.',
                    variant: 'destructive',
                  });
                } finally {
                  setIsSubmittingLeave(false);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || isSubmittingLeave || (hasInsufficientBalance && !isLossOfPayLeave)}
            >
              {isSubmittingLeave ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeSheetsPage;
