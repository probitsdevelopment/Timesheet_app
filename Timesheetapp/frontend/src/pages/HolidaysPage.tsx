import { Calendar, Plus, PartyPopper, Trash2, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import { holidayService, apiClient } from '@/services/api';

const HolidaysPage = () => {
  const { toast } = useToast();
  const { currentUser } = useAppSelector((state) => state.auth);
  const isAdmin = currentUser?.role === 'admin';

  const [holidays, setHolidays] = useState<any[]>([]);
  const [formData, setFormData] = useState({ date: '', title: '', type: 'holiday' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Bulk leave allocation states
  const [leaveType, setLeaveType] = useState<string>('Casual');
  const [allocatedDays, setAllocatedDays] = useState<string>('');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [isAllocating, setIsAllocating] = useState(false);

  const leaveTypes = ['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity', 'Personal', 'Special'];

  // Fetch holidays on component mount
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setIsLoading(true);
        console.log(' Fetching holidays');
        const data = await holidayService.getAll();
        console.log('Holidays fetched:', data);
        setHolidays(data || []);
      } catch (error) {
        console.error(' Error fetching holidays:', error);
        toast({
          title: 'Error',
          description: 'Failed to load holidays',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolidays();
  }, [toast]);

  // Format date to readable format
  const formatDate = (dateStr: string) => {
    try {
      // Handle both YYYY-MM-DD and ISO date formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get future holidays (after today), sorted by date
  const futureHolidays = holidays
    .filter((h) => {
      const holidayDate = new Date(h.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return holidayDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Handle add holiday
  const handleAddHoliday = async () => {
    if (!formData.date || !formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Creating holiday:', formData);
      const newHoliday = await holidayService.create({
        date: formData.date,
        title: formData.title,
        type: formData.type,
      });
      console.log('Holiday created:', newHoliday);
      setHolidays([...holidays, newHoliday]);
      setFormData({ date: '', title: '', type: 'holiday' });
      toast({
        title: 'Success',
        description: 'Holiday added successfully',
      });
    } catch (error) {
      console.error(' Error adding holiday:', error);
      toast({
        title: 'Error',
        description: 'Failed to add holiday. Make sure date is unique.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete holiday
  const handleDeleteHoliday = async (id: number) => {
    try {
      console.log('Deleting holiday:', id);
      await holidayService.delete(id.toString());
      setHolidays(holidays.filter(h => h.id !== id));
      toast({
        title: 'Success',
        description: 'Holiday deleted',
      });
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete holiday',
        variant: 'destructive',
      });
    }
  };

  // Handle bulk leave allocation for all org users
  const handleBulkAllocateLeaves = async () => {
    if (!allocatedDays.trim() || parseInt(allocatedDays) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter valid number of days',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAllocating(true);
      console.log(`Bulk allocating ${leaveType} leaves: ${allocatedDays} days for year ${year}`);
      
      const response = await apiClient.post('/leave-allocation/bulk', {
        leaveType,
        allocatedDays: parseInt(allocatedDays),
        year: parseInt(year),
      });

      console.log('Bulk allocation response:', response);
      toast({
        title: 'Success',
        description: `${leaveType} leaves allocated to all users`,
      });
      
      // Reset form
      setAllocatedDays('');
      setLeaveType('Casual');
    } catch (error: any) {
      console.error('Error allocating leaves:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to allocate leaves',
        variant: 'destructive',
      });
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Holidays</h1>
          <p className="text-muted-foreground">Manage company holidays</p>
        </div>
      </div>

      {/* Holiday Entry Form - Admin Only */}
      {isAdmin && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>Holiday Entry</CardTitle>
            <CardDescription>Add new holidays or RH (Regular Holiday)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., New Year"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Holiday / RH</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="rh">RH (Regular Holiday)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddHoliday}
                disabled={isSubmitting}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                SAVE
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Leave Allocation Form - Admin Only */}
      {isAdmin && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-600" />
              Bulk Leave Allocation
            </CardTitle>
            <CardDescription>Allocate leave days to all organization employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leave-type">Leave Type</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger id="leave-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days</Label>
                  <Input
                    id="days"
                    type="number"
                    placeholder="e.g., 5"
                    value={allocatedDays}
                    onChange={(e) => setAllocatedDays(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="2024"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleBulkAllocateLeaves}
                    disabled={isAllocating || !allocatedDays.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {isAllocating ? 'Allocating...' : 'Allocate'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Total Holidays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holidays.length}</div>
            <p className="text-xs text-muted-foreground mt-1">This year</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Next Holiday</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{futureHolidays[0]?.title || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">{futureHolidays[0] ? formatDate(futureHolidays[0]?.date) : 'No upcoming holidays'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{futureHolidays.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Holidays left</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Holidays List</CardTitle>
          <CardDescription>{isAdmin ? 'Manage holidays' : 'View holidays'}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading holidays...</div>
          ) : holidays.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No holidays added yet</p>
          ) : (
            <div className="space-y-3">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PartyPopper className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{holiday.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(holiday.date)}</p>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded mt-1 inline-block">
                        {holiday.type === 'rh' ? 'RH' : 'Holiday'}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HolidaysPage;
