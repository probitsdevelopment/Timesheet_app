import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import {
  toggleAddEntryModal,
  addEntry,
  setSelectedDate,
  deleteEntry,
  addTempFormEntry,
  removeTempFormEntry,
  clearTempFormEntries,
} from '@/store/reducers/timeSheetReducer';
import { TimeEntry } from '@/store/types';
import { timesheetService } from '@/services/api';

interface FormEntry {
  taskStart: string;
  taskEnd: string;
  hours: number;
  project_id: string;
  projectName: string;
  description: string;
  work_location: 'office' | 'work_from_home';
}

const AddEntryModal = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { showAddEntryModal, selectedDate, entries, tempFormEntries } = useAppSelector((state) => state.timesheet);
  const { currentUser } = useAppSelector((state) => state.auth);
  const { projects } = useAppSelector((state) => state.projects);
  const { users } = useAppSelector((state) => state.users);

  // Get manager's name from currentUser.manager_name (returned in login response)
  const getManagerName = () => {
    if (!currentUser?.managerid) {
      return 'Not Assigned';
    }
    
    // Priority 1: Use manager_name from login response
    if (currentUser.manager_name) {
      return currentUser.manager_name;
    }
    
    // Priority 2: Try to find in users array (fallback)
    const manager = users.find((u) => u.id === currentUser.managerid || u.id?.toString() === currentUser.managerid?.toString());
    if (manager?.name) {
      return manager.name;
    }
    
    // Priority 3: Show that manager is assigned but name not available
    return 'Manager Assigned';
  };

  const [formData, setFormData] = useState<FormEntry>({
    taskStart: '',
    taskEnd: '',
    hours: 0,
    project_id: '',
    projectName: '',
    description: '',
    work_location: 'office',
  });

  // Use local date (not UTC) to avoid timezone shift — toISOString() converts to UTC which can shift the day
  const getLocalDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const [date, setDate] = useState(selectedDate || getLocalDateStr());

  // Update date when selectedDate from Redux changes
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate, showAddEntryModal]);

  // Calculate hours from start and end time
  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;

    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);

    if (startParts.length !== 2 || endParts.length !== 2) return 0;

    const [startHour, startMin] = startParts;
    const [endHour, endMin] = endParts;

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    let minutes = endTotalMin - startTotalMin;

    // Handle overnight shift
    if (minutes < 0) {
      minutes += 24 * 60;
    }

    const hours = minutes / 60;

    return Number(hours.toFixed(2));
  };

  // Format hours to always show 2 decimal places
  const formatHours = (hours: number): string => {
    return hours.toFixed(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'taskStart' || name === 'taskEnd') {
      const newData = {
        ...formData,
        [name]: value,
      };

      if (newData.taskStart && newData.taskEnd) {
        newData.hours = calculateHours(newData.taskStart, newData.taskEnd);
      }

      setFormData(newData);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    if (field === 'project_id') {
      const selectedProject = projects.find((p) => p.id === value);
      setFormData((prev) => ({
        ...prev,
        project_id: value,
        projectName: selectedProject?.name || '',
      }));
    }
  };

  const handleAddEntry = () => {
    // Validate
    if (!formData.taskStart || !formData.taskEnd || !formData.project_id || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.hours <= 0) {
      toast({
        title: 'Validation Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }

    // Add to Redux temp entries (persists across modal close/open)
    dispatch(addTempFormEntry({ ...formData }));

    // Reset form
    setFormData({
      taskStart: '',
      taskEnd: '',
      hours: 0,
      project_id: '',
      projectName: '',
      description: '',
      work_location: 'office',
    });
  };

  const handleDeleteEntry = (index: number) => {
    dispatch(removeTempFormEntry(index));
  };

  const handleSaveAll = async () => {
    if (tempFormEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one time entry',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Save all entries
      for (const entry of tempFormEntries) {
        const backendData = {
          project_id: parseInt(entry.project_id),
          date: date,
          task_start: entry.taskStart,
          task_end: entry.taskEnd,
          hours: entry.hours,
          description: entry.description,
          reason: 'Development',
          status: 'pending',
          work_location: entry.work_location,
        };

        const response = await timesheetService.create(backendData);
        console.log('✅ Entry saved:', response);

        // Use the backend response so we have real IDs and consistent data
        // Always use the local `date` variable (from selectedDate) as the source of truth
        // to avoid timezone shifts from PostgreSQL DATE → JS Date → UTC ISO string
        const savedEntry: TimeEntry = {
          id: response.id?.toString() || Date.now().toString(),
          user_id: response.user_id?.toString() || currentUser?.id || 'unknown',
          project_id: response.project_id?.toString() || entry.project_id,
          date: date,
          task_start: response.task_start || entry.taskStart,
          task_end: response.task_end || entry.taskEnd,
          hours: parseFloat(response.hours) || entry.hours,
          description: response.description || entry.description,
          reason: response.reason || 'Development',
          status: response.status || 'pending',
          created_at: response.created_at || new Date().toISOString(),
          work_location: response.work_location || entry.work_location,
        };
        dispatch(addEntry(savedEntry));
      }

      toast({
        title: 'Success',
        description: 'All entries saved successfully!',
      });
      dispatch(clearTempFormEntries());
      handleClose();
    } catch (error) {
      console.error('❌ Error saving entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to save entries',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    dispatch(toggleAddEntryModal(false));
    dispatch(setSelectedDate(null));
    setFormData({
      taskStart: '',
      taskEnd: '',
      hours: 0,
      project_id: '',
      projectName: '',
      description: '',
      work_location: 'office',
    });
  };

  const totalHours = (() => {
    // Calculate total from all entries by summing minutes first, then converting to hours
    const totalMinutes = tempFormEntries.reduce((sum, entry) => {
      const [startHour, startMin] = entry.taskStart.split(':').map(Number);
      const [endHour, endMin] = entry.taskEnd.split(':').map(Number);
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;
      let minutes = endTotalMin - startTotalMin;
      // Handle overnight shift
      if (minutes < 0) {
        minutes += 24 * 60;
      }
      return sum + minutes;
    }, 0);
    const hours = totalMinutes / 60;
    return Math.round(hours * 100) / 100; // Round to 2 decimals
  })();

  return (
    <Dialog open={showAddEntryModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Display */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-gray-700">
              Date: <span className="font-bold">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>

          {/* Form Section */}
          <div className="bg-white border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-lg">Add New Entry</h3>

            {/* Task Start and End Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskStart" className="text-sm font-medium">
                  Task Start <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="taskStart"
                  name="taskStart"
                  type="time"
                  value={formData.taskStart}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskEnd" className="text-sm font-medium">
                  Task End <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="taskEnd"
                  name="taskEnd"
                  type="time"
                  value={formData.taskEnd}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-medium">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.project_id} onValueChange={(value) => handleSelectChange('project_id', value)}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="no-project" disabled>
                      No projects available
                    </SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Manager Display */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Manager</Label>
              <div className={`border rounded px-3 py-2 ${
                getManagerName() === 'Not Assigned' 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <p className="text-sm font-medium">{getManagerName()}</p>
                {getManagerName() === 'Not Assigned' && (
                  <p className="text-xs text-yellow-700 mt-1">Please contact your HR to assign a manager</p>
                )}
                {getManagerName() === 'Manager Assigned' && (
                  <p className="text-xs text-blue-700 mt-1">Manager name will appear after next login</p>
                )}
              </div>
            </div>

            {/* Work Location */}
            <div className="space-y-2">
              <Label htmlFor="work-location" className="text-sm font-medium">
                Work Location <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.work_location} onValueChange={(value) => setFormData((prev) => ({ ...prev, work_location: value as 'office' | 'work_from_home' }))}>
                <SelectTrigger id="work-location">
                  <SelectValue placeholder="Select work location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">🏢 Office</SelectItem>
                  <SelectItem value="work_from_home">🏠 Work from Home</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter task description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Hours Display and Add Button */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-600">
                  Hours: <span className="text-lg font-bold text-primary">{formatHours(formData.hours)}h</span>
                </Label>
              </div>
              <Button
                type="button"
                onClick={handleAddEntry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Entry
              </Button>
            </div>
          </div>

          {/* Table Section - Show Submitted Entries */}
          {tempFormEntries.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-semibold text-lg">Submitted Time Sheet</h3>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="font-semibold">Time</TableHead>
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold">Work Location</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold text-right">Hours</TableHead>
                      <TableHead className="font-semibold text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tempFormEntries.map((entry, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {entry.taskStart} - {entry.taskEnd}
                        </TableCell>
                        <TableCell>{entry.projectName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            entry.work_location === 'office'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {entry.work_location === 'office' ? '🏢 Office' : '🏠 Work from Home'}
                          </span>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-semibold">{formatHours(entry.hours)}h</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total Hours */}
              <div className="bg-blue-50 p-4 border-t">
                <div className="text-right">
                  <p className="text-lg font-bold">
                    Total No of Hrs: <span className="text-blue-600">{formatHours(totalHours)}h</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={tempFormEntries.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEntryModal;
