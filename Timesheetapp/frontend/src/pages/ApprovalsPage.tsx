import { CheckSquare, Clock, ThumbsUp, ThumbsDown, Calendar, X, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import {
  setTimesheets,
  setLoading,
  setError,
  approveTimesheet,
  rejectTimesheet,
} from '@/store/reducers/timeSheetReducer';
import { timesheetSubmissionService, timesheetService, leaveService } from '@/services/api';

const ApprovalsPage = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { currentUser } = useAppSelector((state) => state.auth);
  const { timesheets, isLoading } = useAppSelector((state) => state.timesheet);
  
  // Timesheet states
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [viewTimesheetOpen, setViewTimesheetOpen] = useState(false);
  const [timesheetEntries, setTimesheetEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [viewCurrentMonth, setViewCurrentMonth] = useState<string>('');
  
  // Leave states
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [leaveRejectionDialogOpen, setLeaveRejectionDialogOpen] = useState(false);
  const [leaveRejectionReason, setLeaveRejectionReason] = useState('');
  const [leaveProcessing, setLeaveProcessing] = useState(false);

  // Fetch pending timesheets on component mount
  useEffect(() => {
    const fetchPendingTimesheets = async () => {
      try {
        dispatch(setLoading(true));
        if (currentUser) {
          // For managers, get timesheets submitted to them
          console.log('Fetching pending timesheets for manager:', { userId: currentUser.id, name: currentUser.name, role: currentUser.role });
          const data = await timesheetSubmissionService.getPendingApprovals(currentUser.id);
          console.log('Pending timesheets found:', data?.length || 0, data);
          if (data && data.length > 0) {
            console.log('First timesheet:', data[0]);
          }
          dispatch(setTimesheets(data || []));
        } else {
          console.log('No current user');
        }
      } catch (error) {
        dispatch(setError('Failed to load pending timesheets'));
        console.error('Error fetching timesheets:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchPendingTimesheets();
  }, [dispatch, currentUser]);

  // Fetch pending leaves on component mount
  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        setLeavesLoading(true);
        console.log('Fetching pending leaves for manager');
        const data = await leaveService.getPending();
        console.log('Pending leaves found:', data?.length || 0, data);
        setPendingLeaves(data || []);
      } catch (error) {
        console.error('Error fetching leaves:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending leaves',
          variant: 'destructive',
        });
      } finally {
        setLeavesLoading(false);
      }
    };

    fetchPendingLeaves();
  }, [toast]);

  // Get days in month
  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (dateString: string) => {
    const [year, month] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1).getDay();
  };

  // Open timesheet calendar view
  const handleViewTimesheet = async (timesheet: any) => {
    try {
      setLoadingEntries(true);
      setSelectedTimesheet(timesheet);
      setViewCurrentMonth(timesheet.month);
      
      // Fetch entries for the specific user (not current user)
      console.log('Fetching entries for user:', timesheet.user_id);
      
      // Use the API to get specific user's entries via apiClient
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const token = localStorage.getItem('authToken');
      const userEntries = await fetch(`${API_BASE_URL}/time-entries/user/${timesheet.user_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) throw new Error('Failed to fetch user entries');
        return res.json();
      });
      console.log('Fetched entries for user', timesheet.user_id, ':', userEntries);
      
      // Filter entries for the selected month
      const filteredEntries = userEntries.filter((e: any) => e.date.startsWith(timesheet.month));
      console.log('Filtered entries for month', timesheet.month, ':', filteredEntries);
      console.log('Sample entry:', filteredEntries[0]);
      
      setTimesheetEntries(filteredEntries);
      setViewTimesheetOpen(true);
      console.log('Loaded timesheet entries:', filteredEntries);
    } catch (error) {
      console.error('Failed to load timesheet entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load timesheet details',
        variant: 'destructive',
      });
    } finally {
      setLoadingEntries(false);
    }
  };

  // Filter timesheets by status
  const pendingTimesheets = timesheets.filter(
    (ts) => ts.status === 'submitted' && ts.submitted_to === currentUser?.id
  );
  const approvedTimesheets = timesheets.filter(
    (ts) => ts.status === 'approved' && ts.submitted_to === currentUser?.id
  );
  const rejectedTimesheets = timesheets.filter(
    (ts) => ts.status === 'rejected' && ts.submitted_to === currentUser?.id
  );

  // Handle approve timesheet
  const handleApprove = async (timesheetId: string) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'User not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      await timesheetSubmissionService.approve(timesheetId, currentUser.id);
      dispatch(approveTimesheet({ id: timesheetId, approvedBy: currentUser.id }));
      toast({
        title: 'Success',
        description: 'Timesheet approved successfully!',
      });
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve timesheet',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject timesheet
  const handleReject = async () => {
    if (!selectedTimesheet || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      await timesheetSubmissionService.reject(selectedTimesheet.id, rejectionReason);
      dispatch(rejectTimesheet({ id: selectedTimesheet.id, reason: rejectionReason }));
      setRejectionDialogOpen(false);
      setRejectionReason('');
      setSelectedTimesheet(null);
      toast({
        title: 'Success',
        description: 'Timesheet rejected!',
      });
    } catch (error) {
      console.error('Failed to reject timesheet:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject timesheet',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle approve leave
  const handleApproveLeave = async (leaveId: string) => {
    try {
      setLeaveProcessing(true);
      await leaveService.approve(leaveId);
      setPendingLeaves(pendingLeaves.filter(l => l.id !== leaveId));
      toast({
        title: 'Success',
        description: 'Leave approved successfully',
      });
    } catch (error) {
      console.error('Failed to approve leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve leave',
        variant: 'destructive',
      });
    } finally {
      setLeaveProcessing(false);
    }
  };

  // Handle reject leave
  const handleRejectLeave = async () => {
    if (!selectedLeave || !leaveRejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLeaveProcessing(true);
      await leaveService.reject(selectedLeave.id, leaveRejectionReason);
      setPendingLeaves(pendingLeaves.filter(l => l.id !== selectedLeave.id));
      setLeaveRejectionDialogOpen(false);
      setLeaveRejectionReason('');
      setSelectedLeave(null);
      toast({
        title: 'Success',
        description: 'Leave rejected successfully',
      });
    } catch (error) {
      console.error('Failed to reject leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject leave',
        variant: 'destructive',
      });
    } finally {
      setLeaveProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
        <p className="text-muted-foreground">Review and approve timesheets and leave requests from your team</p>
      </div>

      <Tabs defaultValue="timesheets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timesheets">
            <Clock className="w-4 h-4 mr-2" />
            Timesheets ({pendingTimesheets.length})
          </TabsTrigger>
          <TabsTrigger value="leaves">
            <Calendar className="w-4 h-4 mr-2" />
            Leaves ({pendingLeaves.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timesheets" className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTimesheets.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedTimesheets.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedTimesheets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Time entries waiting for your approval</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin inline-block">
                <CheckSquare className="w-12 h-12 opacity-40" />
              </div>
              <p className="mt-4">Loading timesheets...</p>
            </div>
          ) : pendingTimesheets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No pending approvals</p>
              <p className="text-sm">All caught up! Time entries will appear here when submitted</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTimesheets.map((timesheet) => (
                <div
                  key={timesheet.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => handleViewTimesheet(timesheet)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{(timesheet as any).user_name || 'Unknown User'}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        Pending
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(timesheet.month + '-01').toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {timesheet.total_hours}h total
                      </span>
                      <span>{(timesheet as any).entries_count || 0} entries</span>
                    </div>
                    {timesheet.submitted_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted on {new Date(timesheet.submitted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(String(timesheet.id))}
                      disabled={isProcessing}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTimesheet(timesheet);
                        setRejectionDialogOpen(true);
                      }}
                      disabled={isProcessing}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Timesheets */}
      {approvedTimesheets.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Approved Timesheets</CardTitle>
            <CardDescription>Previously approved timesheets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedTimesheets.map((timesheet) => (
                <div
                  key={timesheet.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                >
                  <div>
                    <h4 className="font-semibold text-foreground">{(timesheet as any).user_name || 'Unknown User'}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>
                        {new Date(timesheet.month + '-01').toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span>{timesheet.total_hours}h</span>
                      <span className="text-green-600">✓ Approved</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected Timesheets */}
      {rejectedTimesheets.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Rejected Timesheets</CardTitle>
            <CardDescription>Timesheets that were rejected and need resubmission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rejectedTimesheets.map((timesheet) => (
                <div
                  key={timesheet.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                >
                  <div>
                    <h4 className="font-semibold text-foreground">{(timesheet as any).user_name || 'Unknown User'}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>
                        {new Date(timesheet.month + '-01').toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span>{timesheet.total_hours}h</span>
                      <span className="text-red-600">✗ Rejected</span>
                    </div>
                    {timesheet.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {timesheet.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* View Timesheet Calendar Modal */}
      <Dialog open={viewTimesheetOpen} onOpenChange={setViewTimesheetOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(selectedTimesheet as any)?.user_name} - 
              {selectedTimesheet && 
                new Date(selectedTimesheet.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </DialogTitle>
            <DialogDescription>
              Review submitted timesheet entries
            </DialogDescription>
          </DialogHeader>

          {loadingEntries ? (
            <div className="text-center py-8">
              <p>Loading timesheet details...</p>
            </div>
          ) : (
            <div className="space-y-6">
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
                  {Array.from({ length: getFirstDayOfMonth(viewCurrentMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Days of month */}
                  {Array.from({ length: getDaysInMonth(viewCurrentMonth) }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${viewCurrentMonth}-${String(day).padStart(2, '0')}`;
                    const dayEntries = timesheetEntries.filter((e) => e.date === dateStr);
                    const dayHours = Math.round(dayEntries.reduce((sum, e) => sum + parseFloat(e.hours?.toString() || '0'), 0) * 10) / 10;

                    return (
                      <div
                        key={day}
                        className={`aspect-square p-2 rounded-lg border-2 transition-colors flex flex-col items-center justify-center ${
                          dayEntries.length > 0
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-sm">{day}</div>
                        {dayHours > 0 && (
                          <div className="text-xs text-blue-600 font-medium">{dayHours}h</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">{selectedTimesheet?.total_hours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                    <p className="text-2xl font-bold">{timesheetEntries.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>Review and approve leave requests from your team</CardDescription>
            </CardHeader>
            <CardContent>
              {leavesLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin opacity-40" />
                  <p>Loading leave requests...</p>
                </div>
              ) : pendingLeaves.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No pending leave requests</p>
                  <p className="text-sm">All caught up! Leave requests will appear here when submitted</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{leave.user_name}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                              {leave.leave_type}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              {leave.number_of_days} day{leave.number_of_days !== 1 ? 's' : ''}
                            </span>
                            {leave.is_paid_leave === false && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                                Loss of Pay
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(leave.start_date).toLocaleDateString()} → {new Date(leave.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          {leave.reason && (
                            <p className="text-sm text-muted-foreground italic">
                              Reason: {leave.reason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested by {leave.user_email} on {new Date(leave.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            onClick={() => handleApproveLeave(leave.id)}
                            disabled={leaveProcessing}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            {leaveProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ThumbsUp className="w-4 h-4" />
                            )}
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Timesheet Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this timesheet. The employee will need to resubmit with corrections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Timesheet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Rejection Dialog */}
      <Dialog open={leaveRejectionDialogOpen} onOpenChange={setLeaveRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this leave request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLeave && (
              <div className="p-3 bg-accent/5 rounded-lg">
                <p className="text-sm font-medium">{selectedLeave.user_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedLeave.start_date).toLocaleDateString()} → {new Date(selectedLeave.end_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <Textarea
              placeholder="Enter rejection reason..."
              value={leaveRejectionReason}
              onChange={(e) => setLeaveRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setLeaveRejectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRejectLeave}
                disabled={leaveProcessing || !leaveRejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {leaveProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Leave'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalsPage;
