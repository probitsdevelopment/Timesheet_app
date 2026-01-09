import { Clock, Plus, Trash2, Send, Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
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
import { timesheetService, timesheetSubmissionService } from '@/services/api';

const TimeSheetsPage = () => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.auth);
  const { entries, timesheets, selectedMonth } = useAppSelector((state) => state.timesheet);
  const [currentMonth, setCurrentMonth] = useState(selectedMonth || new Date().toISOString().slice(0, 7));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDateLocal, setSelectedDateLocal] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: '', startDate: '', endDate: '', reason: '' });

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
        console.log('📥 Fetching time entries for user:', currentUser?.id);
        
        // Fetch time entries (required)
        const entriesData = await timesheetService.getAll();
        console.log('✅ Fetched entries:', entriesData);
        console.log('📋 Entry data shape:', entriesData?.[0]);
        dispatch(setEntries(entriesData));
        
        // Fetch timesheets (optional - might not exist yet)
        if (currentUser) {
          try {
            const timesheetsData = await timesheetSubmissionService.getByUserId(currentUser.id);
            console.log('✅ Fetched timesheets:', timesheetsData);
            if (timesheetsData) {
              dispatch(setTimesheets(timesheetsData));
            }
          } catch (tsError) {
            console.log('ℹ️ No timesheets found yet (this is normal for new users)');
          }
        }
      } catch (error) {
        dispatch(setError('Failed to load time entries'));
        console.error('❌ Fetch error:', error);
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

  // Handle submit timesheet
  const handleSubmitTimesheet = async () => {
    if (!currentUser) {
      alert('User not found');
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

      alert('✅ Timesheet submitted successfully!');
    } catch (error) {
      console.error('Failed to submit timesheet:', error);
      alert('Failed to submit timesheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: 'Month Total', value: `${totalMonthHours}h`, change: 'Current month' },
    { label: 'Status', value: timesheetStatus.charAt(0).toUpperCase() + timesheetStatus.slice(1), change: '' },
    { label: 'Entries', value: monthEntries.length.toString(), change: 'This month' },
    { label: 'Projects', value: new Set(monthEntries.map((e) => e.project_id)).size.toString(), change: 'Active' },
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

                return (
                  <button
                    key={day}
                    onClick={() => {
                      const newSelected = isSelected ? null : dateStr;
                      setSelectedDateLocal(newSelected);
                      dispatch(setSelectedDate(newSelected));
                      if (!isSelected) {
                        dispatch(toggleAddEntryModal(true));
                      }
                    }}
                    className={`aspect-square p-2 rounded-lg border-2 transition-colors flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : dayEntries.length > 0
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{day}</div>
                    {dayHours > 0 && (
                      <div className="text-xs text-blue-600 font-medium">{dayHours}h</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDateLocal && (
            <div className="mt-6 pt-6 border-t">
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">
                  {new Date(selectedDateLocal).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                {monthEntries
                  .filter((e) => e.date === selectedDateLocal)
                  .map((entry) => (
                    <div key={entry.id} className="p-3 bg-accent/5 rounded-lg mb-2 flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium capitalize">{entry.reason.replace('-', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{parseFloat(entry.hours?.toString() || '0').toFixed(2)}h</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await timesheetService.delete(entry.id);
                            dispatch(deleteEntry(entry.id));
                          } catch (error) {
                            alert('Failed to delete entry');
                            console.error(error);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                {monthEntries.filter((e) => e.date === selectedDateLocal).length === 0 && (
                  <p className="text-sm text-muted-foreground">No entries for this date</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEntryModal />

      {/* Apply Leave Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Request leave from your manager. This feature is coming soon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leave-type">Type of Leave</Label>
              <Select value={leaveForm.leaveType} onValueChange={(value) => setLeaveForm({ ...leaveForm, leaveType: value })}>
                <SelectTrigger id="leave-type">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="paid">Paid Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  <SelectItem value="maternity">Maternity Leave</SelectItem>
                  <SelectItem value="paternity">Paternity Leave</SelectItem>
                  <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="reason">Reason for Leave</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for your leave request..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLeaveModal(false);
                setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                alert('Leave request feature coming soon! 🚀\n\nYour request would be:\n' + 
                      `Type: ${leaveForm.leaveType || 'Not selected'}\n` +
                      `From: ${leaveForm.startDate || 'Not selected'}\n` +
                      `To: ${leaveForm.endDate || 'Not selected'}\n` +
                      `Reason: ${leaveForm.reason || 'Not provided'}`);
                setShowLeaveModal(false);
                setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
              }}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeSheetsPage;
