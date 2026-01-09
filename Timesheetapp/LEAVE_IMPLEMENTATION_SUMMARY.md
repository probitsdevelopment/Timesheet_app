# Leave Management System - Implementation Summary

## ✅ Completed Implementation

### Backend (Express.js)

#### 1. **Leaves Controller** (`src/controllers/leavesController.js`)
- ✅ `getAllLeaves()` - Get all leave requests for current user
- ✅ `getLeaveById()` - Get specific leave request
- ✅ `createLeave()` - Create new leave request with validation
- ✅ `updateLeave()` - Update leave request (dates, reason, status)
- ✅ `deleteLeave()` - Delete pending leave requests
- ✅ `getLeavesByUserId()` - Get leaves for specific user (for managers)
- ✅ `approveLeave()` - Manager approval endpoint
- ✅ `rejectLeave()` - Manager rejection with reason
- Auto-calculates number of days between start and end dates
- Validates start date < end date
- Organiz ation-based filtering

#### 2. **Leaves Routes** (`src/routes/leavesRoutes.js`)
- `GET /leaves` - Get current user's leaves
- `GET /leaves/:id` - Get specific leave
- `GET /leaves/user/:userId` - Get leaves for specific user
- `POST /leaves` - Create new leave
- `PUT /leaves/:id` - Update leave
- `DELETE /leaves/:id` - Delete leave
- `POST /leaves/:id/approve` - Approve leave (manager)
- `POST /leaves/:id/reject` - Reject leave with reason (manager)

#### 3. **Server Integration** (`src/server.js`)
- ✅ Imported leaves routes
- ✅ Registered `/leaves` endpoints
- All endpoints require JWT authentication

### Frontend (React + TypeScript)

#### 1. **Leave Service** (`src/services/api.ts`)
```typescript
export const leaveService = {
  getAll: () => apiClient.get('/leaves'),
  getById: (id: string) => apiClient.get(`/leaves/${id}`),
  getByUserId: (userId: string) => apiClient.get(`/leaves/user/${userId}`),
  create: (leave: any) => apiClient.post('/leaves', leave),
  update: (id: string, leave: any) => apiClient.put(`/leaves/${id}`, leave),
  delete: (id: string) => apiClient.delete(`/leaves/${id}`),
  approve: (id: string) => apiClient.post(`/leaves/${id}/approve`, {}),
  reject: (id: string, rejectionReason: string) => apiClient.post(`/leaves/${id}/reject`, { rejection_reason: rejectionReason }),
};
```

#### 2. **TimeSheetsPage Integration** (`src/pages/TimeSheetsPage.tsx`)
- ✅ "Apply Leave" button opens modal
- ✅ Leave form with fields:
  - Leave Type (8 options: Casual, Sick, Paid, Unpaid, Maternity, Paternity, Bereavement, Other)
  - Start Date (date picker)
  - End Date (date picker)
  - Reason (textarea)
- ✅ Form validation:
  - All fields required
  - Start date < End date
  - Auto-calculate days
- ✅ Submit functionality:
  - Sends request to backend
  - Shows success toast with number of days
  - Shows error toast on failure
  - Loading state with spinner
  - Modal closes on success
  - Form resets after submission

### Database Schema

#### Leaves Table (`setup.sql` & `MIGRATE_ADD_LEAVES.sql`)
```sql
CREATE TABLE leaves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,           -- casual, sick, paid, unpaid, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INTEGER,                     -- auto-calculated
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',       -- pending, approved, rejected
  submitted_to INTEGER REFERENCES users(id),  -- manager's ID
  rejection_reason TEXT,
  organization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Indexes Created:
- `idx_leaves_user_id` - Fast lookup by user
- `idx_leaves_start_date` - Fast lookup by date
- `idx_leaves_status` - Fast lookup by status

## 🔄 Database Migration

### For New Setup:
Run `setup.sql` - includes leaves table creation

### For Existing Database:
Run `MIGRATE_ADD_LEAVES.sql` - adds leaves table safely with `IF NOT EXISTS`

```bash
psql -U postgres -d timesheet_db -f MIGRATE_ADD_LEAVES.sql
```

## 📋 Leave Types Supported
1. Casual Leave
2. Sick Leave
3. Paid Leave
4. Unpaid Leave
5. Maternity Leave
6. Paternity Leave
7. Bereavement Leave
8. Other

## 🔐 Security Features
- ✅ JWT Authentication required on all endpoints
- ✅ Organization-based data isolation
- ✅ User can only delete own pending leaves
- ✅ Input validation for dates
- ✅ Only managers can approve/reject
- ✅ SQL injection protection (parameterized queries)

## 🚀 Features

### Employee Features
- ✅ Submit leave requests
- ✅ View own leave history
- ✅ Cancel pending requests
- ✅ See approval status (pending/approved/rejected)
- ✅ View rejection reasons

### Manager Features
- ✅ View employee leave requests
- ✅ Approve leaves
- ✅ Reject leaves with reason
- ✅ Filter by user/status

## 📊 API Response Example

**POST /leaves**
```json
{
  "id": 1,
  "user_id": 5,
  "leave_type": "sick",
  "start_date": "2026-01-15",
  "end_date": "2026-01-17",
  "number_of_days": 3,
  "reason": "Medical appointment",
  "status": "pending",
  "submitted_to": null,
  "rejection_reason": null,
  "organization": "Default Organization",
  "created_at": "2026-01-09T10:30:00Z",
  "updated_at": "2026-01-09T10:30:00Z"
}
```

## 📁 Files Created/Modified

### Created Files:
- ✅ `backend/src/controllers/leavesController.js`
- ✅ `backend/src/routes/leavesRoutes.js`
- ✅ `backend/MIGRATE_ADD_LEAVES.sql`

### Modified Files:
- ✅ `backend/src/server.js` - Added leaves routes
- ✅ `backend/setup.sql` - Added leaves table schema
- ✅ `frontend/src/services/api.ts` - Added leaveService
- ✅ `frontend/src/pages/TimeSheetsPage.tsx` - Implemented leave modal functionality

## ✨ Next Steps (Optional)

1. **Create Leave Approvals Page**: Dedicated page for managers to approve/reject leaves
2. **Leave Balance Tracking**: Track available vs. used leaves per employee
3. **Holidays Calendar**: Show public holidays that don't require leave
4. **Email Notifications**: Notify managers of leave requests and employees of approvals
5. **Bulk Operations**: Approve/reject multiple leaves at once
6. **Conflict Detection**: Alert when same number of employees are on leave

## 🧪 Testing

### Test Leave Creation:
```bash
curl -X POST http://localhost:3001/leaves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "leave_type": "sick",
    "start_date": "2026-01-15",
    "end_date": "2026-01-17",
    "reason": "Medical checkup"
  }'
```

### Test Leave Approval:
```bash
curl -X POST http://localhost:3001/leaves/1/approve \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

### Test Leave Rejection:
```bash
curl -X POST http://localhost:3001/leaves/1/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -d '{"rejection_reason": "Insufficient coverage for this period"}'
```

## ✅ Status: COMPLETE
All leave management functionality has been successfully implemented and integrated with both frontend and backend!
