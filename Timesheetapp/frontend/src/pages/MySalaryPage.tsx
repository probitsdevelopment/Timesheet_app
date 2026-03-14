import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, Download, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient, salaryProcessingService } from '@/services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BasicSalary {
  id: number;
  user_id: number;
  basic_salary: number;
  organization: string;
  created_at: string;
  updated_at: string;
}

interface SalaryRecord {
  id: number;
  userId: number;
  month: string;
  basicSalary: number;
  workingDays: number;
  totalLeaves: number;
  yearlyAllocated?: number;
  yearlyUsed?: number;
  paidLeavesThisMonth?: number;
  paidLeavesAllowed?: number;
  unpaidLeaves: number;
  deduction: number;
  finalSalary: number;
  timesheet_approved: boolean;
  status: string;
  processedAt: string;
}

const MySalaryPage = () => {
  const { currentUser } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [basicSalary, setBasicSalary] = useState<BasicSalary | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [salaryRecord, setSalaryRecord] = useState<SalaryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingBasicSalary, setFetchingBasicSalary] = useState(true);

  // Fetch basic salary on mount
  useEffect(() => {
    const fetchBasicSalary = async () => {
      try {
        if (!currentUser?.id) return;
        const response = await apiClient.get(`/salaries/user/${currentUser.id}`);
        if (response) {
          setBasicSalary(response);
        }
      } catch (error) {
        console.error('Error fetching basic salary:', error);
      } finally {
        setFetchingBasicSalary(false);
      }
    };

    fetchBasicSalary();
  }, [currentUser?.id]);

  // Fetch salary record when month is selected
  useEffect(() => {
    const fetchSalaryRecord = async () => {
      if (!selectedMonth || !currentUser?.id) {
        setSalaryRecord(null);
        return;
      }

      setIsLoading(true);
      try {
        const record = await salaryProcessingService.getByUserAndMonth(parseInt(currentUser.id), selectedMonth);
        setSalaryRecord(record);
      } catch (error) {
        console.error('Error fetching salary record:', error);
        setSalaryRecord(null);
        toast({
          title: 'No Salary Record',
          description: `No processed salary found for ${selectedMonth}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalaryRecord();
  }, [selectedMonth, currentUser?.id, toast]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()));
  };

  const monthName = currentDate.toLocaleDateString('en-US', { year: 'numeric' });

  const downloadSalarySlip = async () => {
    if (!salaryRecord || !currentUser) return;

    try {
      // Create a temporary container for rendering
      const element = document.createElement('div');
      element.style.padding = '40px';
      element.style.backgroundColor = '#ffffff';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.maxWidth = '800px';

      // Create HTML structure
      element.innerHTML = `
        <div style="border: 1px solid #ddd; padding: 30px; background: white;">
          <!-- Company Header -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333;">
            <img src="/probits-logo.png" style="height: 50px; margin-bottom: 10px; object-fit: contain;" alt="ProBits Logo" />
            <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #000;">ProBits Technologies Pvt Ltd</h2>
            <p style="margin: 5px 0; color: #666; font-size: 13px;">No 136, Road, 14, Hobli, Kengeri, Doddabale, Karnataka 560060</p>
            <p style="margin: 5px 0; color: #666; font-size: 13px;">Bengaluru, Karnataka</p>
            <p style="margin: 5px 0; color: #666; font-size: 13px;">Phone: 099005 24255</p>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Salary Payslip</h1>
            <p style="margin: 10px 0; color: #666; font-size: 14px;">Month: ${salaryRecord.month}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
              <span style="font-weight: bold;">Employee Name:</span>
              <span>${currentUser.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
              <span style="font-weight: bold;">Email:</span>
              <span>${currentUser.email}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
              <span style="font-weight: bold;">Role:</span>
              <span>${currentUser.role}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
              <span style="font-weight: bold;">Status:</span>
              <span style="display: inline-block; padding: 5px 10px; border-radius: 4px; background-color: ${salaryRecord.status === 'PROCESSED' ? '#d1fae5' : '#fef3c7'}; color: ${salaryRecord.status === 'PROCESSED' ? '#065f46' : '#92400e'};">${salaryRecord.status}</span>
            </div>
          </div>

          <div style="margin: 30px 0;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px;">Salary Breakdown</div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span>Basic Salary</span>
              <span>₹${salaryRecord.basicSalary.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span>Working Days</span>
              <span>${salaryRecord.workingDays}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span>Per Day Salary</span>
              <span>₹${Math.round(salaryRecord.basicSalary / salaryRecord.workingDays).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span>Yearly Leave Allocation</span>
              <span>${salaryRecord.yearlyAllocated || 0} days</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span>This Month Leaves</span>
              <span>${salaryRecord.totalLeaves} days</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span>Paid (from Allocation)</span>
              <span>${salaryRecord.paidLeavesThisMonth || 0} days</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span>Loss of Pay</span>
              <span>${salaryRecord.unpaidLeaves} days</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; color: #d32f2f;">
              <span>Deduction (Unpaid Leaves)</span>
              <span>-₹${salaryRecord.deduction.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; font-size: 16px;">
              <span>Final Monthly Salary</span>
              <span>₹${salaryRecord.finalSalary.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
            <p style="margin: 5px 0;">This is an auto-generated salary payslip. Please do not modify.</p>
          </div>
        </div>
      `;

      document.body.appendChild(element);

      // Convert HTML to canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Convert canvas to PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
      pdf.save(`Salary_Payslip_${currentUser.name}_${salaryRecord.month}.pdf`);

      // Clean up
      document.body.removeChild(element);

      toast({
        title: '✅ Downloaded',
        description: 'Salary payslip downloaded as PDF successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to download salary payslip',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Salary</h1>
        <p className="text-muted-foreground">View your salary details and payslips</p>
      </div>

      {/* Basic Salary Card */}
      {fetchingBasicSalary ? (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : basicSalary ? (
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Basic Monthly Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">
              ₹{basicSalary.basic_salary.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Your fixed monthly salary</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No basic salary record found</p>
          </CardContent>
        </Card>
      )}

      {/* Month Selection Section */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Select Month</CardTitle>
          <CardDescription>Click on a month to view your salary payslip</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold">{monthName}</h3>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Month Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(currentDate.getFullYear(), i);
                const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                const monthValue = `${monthDate.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
                const isSelected = selectedMonth === monthValue;

                return (
                  <Button
                    key={i}
                    onClick={() => setSelectedMonth(monthValue)}
                    variant={isSelected ? 'default' : 'outline'}
                    className="h-12 text-sm font-medium"
                  >
                    {monthStr}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Payslip */}
      {isLoading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : salaryRecord ? (
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {salaryRecord.status === 'PROCESSED' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Salary Payslip - {salaryRecord.month}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span>Salary On Hold - {salaryRecord.month}</span>
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {salaryRecord.timesheet_approved ? '✅ Timesheet Approved' : '⏳ Timesheet Pending'}
              </CardDescription>
            </div>
            <Button
              onClick={downloadSalarySlip}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Salary Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                {/* Basic Salary */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Basic Salary</p>
                  <p className="text-lg font-semibold">₹{salaryRecord.basicSalary?.toLocaleString('en-IN')}</p>
                </div>

                {/* Working Days */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Working Days</p>
                  <p className="text-lg font-semibold">{salaryRecord.workingDays}</p>
                </div>

                {/* Per Day Salary */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Per Day Salary</p>
                  <p className="text-lg font-semibold">₹{Math.round(salaryRecord.basicSalary / salaryRecord.workingDays).toLocaleString('en-IN')}</p>
                </div>

                {/* Yearly Allocation */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Yearly Allocation</p>
                  <p className="text-lg font-semibold">{salaryRecord.yearlyAllocated || 0} days</p>
                </div>

                {/* This Month Leaves */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">This Month Leaves</p>
                  <p className="text-lg font-semibold">{salaryRecord.totalLeaves} days</p>
                </div>

                {/* Paid from Allocation */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Paid (from Allocation)</p>
                  <p className="text-lg font-semibold text-green-600">{salaryRecord.paidLeavesThisMonth || 0} days</p>
                </div>

                {/* Loss of Pay */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Loss of Pay</p>
                  <p className="text-lg font-semibold text-red-600">{salaryRecord.unpaidLeaves} days</p>
                </div>
              </div>

              {/* Deduction & Final Salary */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deduction (Unpaid Leaves)</span>
                  <span className="font-semibold text-red-600">- ₹{salaryRecord.deduction?.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="font-semibold text-lg">Final Monthly Salary</span>
                  <span className="font-bold text-2xl text-green-600">₹{salaryRecord.finalSalary?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Status Info */}
              {salaryRecord.status === 'HOLD' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
                  <p className="font-medium mb-1">⚠️ Status: On Hold</p>
                  <p>This salary is on hold because your timesheet for {salaryRecord.month} is not approved yet. It will be finalized once your manager approves the timesheet.</p>
                </div>
              )}

              {salaryRecord.processedAt && (
                <div className="text-xs text-muted-foreground text-right">
                  <p>Processed on: {new Date(salaryRecord.processedAt).toLocaleDateString('en-IN')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : selectedMonth && !isLoading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No processed salary found for {selectedMonth}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default MySalaryPage;
