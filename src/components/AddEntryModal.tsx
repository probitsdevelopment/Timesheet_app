import { useState } from 'react';
import { X } from 'lucide-react';
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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  toggleAddEntryModal,
  addEntry,
} from '@/store/reducers/timeSheetReducer';
import { TimeEntry } from '@/store/types';import { timesheetService } from '@/services/api';
const AddEntryModal = () => {
  const dispatch = useAppDispatch();
  const { showAddEntryModal } = useAppSelector((state) => state.timesheet);
  const { currentUser } = useAppSelector((state) => state.auth);
  const { projects } = useAppSelector((state) => state.projects);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    description: '',
    hours: '',
    projectId: '',
    projectName: '',
  });

  const handleClose = () => {
    dispatch(toggleAddEntryModal(false));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    if (field === 'projectId') {
      const selectedProject = projects.find((p) => p.id === value);
      setFormData((prev) => ({
        ...prev,
        projectId: value,
        projectName: selectedProject?.name || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted - Checking validation...');

    if (
      !formData.date ||
      !formData.reason ||
      !formData.description ||
      !formData.hours ||
      !formData.projectId
    ) {
      alert('Please fill in all required fields');
      console.log('❌ Validation failed:', formData);
      return;
    }

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      date: formData.date,
      reason: formData.reason,
      description: formData.description,
      hours: parseFloat(formData.hours),
      projectId: formData.projectId,
      projectName: formData.projectName,
      createdAt: new Date().toISOString(),
      userId: currentUser?.id || 'unknown',
    };

    console.log('✅ Validation passed. Sending data to API:', newEntry);
    try {
      const response = await timesheetService.create(newEntry);
      console.log('🎉 API Response received:', response);
      dispatch(addEntry(newEntry));
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reason: '',
        description: '',
        hours: '',
        projectId: '',
        projectName: '',
      });
      handleClose();
      alert('✅ Time entry created successfully!');
    } catch (error) {
      console.error('❌ API Error:', error);
      alert('Failed to create entry: ' + String(error));
    }
  };

  return (
    <Dialog open={showAddEntryModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Add Time Entry</DialogTitle>
          <button
            onClick={handleClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Field */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Reason Field */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.reason} onValueChange={(value) => handleSelectChange('reason', value)}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project-work">Project Work</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="admin">Admin Work</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Your Description for development"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Hours and Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours" className="text-sm font-medium">
                No of Hrs <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hours"
                name="hours"
                type="number"
                placeholder="8"
                min="0"
                step="0.5"
                value={formData.hours}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-medium">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.projectId} onValueChange={(value) => handleSelectChange('projectId', value)}>
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
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEntryModal;
