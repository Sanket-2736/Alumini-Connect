# User Verification System - Complete Guide

## Overview

The verification system ensures that only legitimate users can access the platform. Users must upload verification documents (degree, ID card, etc.) during registration, which are then reviewed and approved by admins.

## Workflow

### 1. User Registration (3 Steps)

**Step 1: Account Details**
- Full Name
- Email
- Password (with validation)
- Confirm Password

**Step 2: University Information**
- University (dropdown)
- Department
- Batch/Year
- Role (Student/Alumni)

**Step 3: Document Upload**
- Upload degree certificate, ID card, or other verification documents
- Supported formats: PDF, JPG, PNG
- Max 5MB per file
- At least 1 document required

### 2. Registration Submission

When user submits registration:
1. Account is created in database
2. Documents are uploaded to Cloudinary
3. User status set to `PENDING`
4. User receives confirmation message
5. User cannot login until approved

### 3. Admin Review

Admin navigates to `/admin/verifications` to:
1. See list of pending verifications
2. Click "Review" to view user details and documents
3. View uploaded documents (images or PDFs)
4. Approve or Reject with reason

### 4. User Login

When user tries to login:
- If status is `APPROVED`: Login succeeds
- If status is `PENDING`: Error "Your account is pending admin verification. Please wait."
- If status is `REJECTED`: Error "Your account was rejected. Reason: [reason provided by admin]"
- If status is `NOT_SUBMITTED`: Error "Please upload your verification documents to complete registration"

## Database Schema

### User Model Fields

```typescript
verificationStatus: VerificationStatus
  - 'not_submitted' (initial state)
  - 'pending' (documents uploaded, awaiting review)
  - 'approved' (verified, can login)
  - 'rejected' (documents rejected, can resubmit)

verificationDocs: string[] // Cloudinary URLs
rejectionReason?: string // Why documents were rejected
```

## API Endpoints

### 1. Registration
**POST** `/api/auth/register`
- Body: FormData with registration fields + documents
- Returns: `{ userId, verificationStatus }`
- Status: 201 Created

### 2. Get Pending Verifications
**GET** `/api/admin/verifications`
- Headers: `Authorization: Bearer <admin_token>`
- Returns: Array of pending user verifications
- Status: 200 OK

### 3. Approve Verification
**POST** `/api/admin/verifications/[userId]/approve`
- Headers: `Authorization: Bearer <admin_token>`
- Returns: `{ userId, verificationStatus: 'approved' }`
- Status: 200 OK

### 4. Reject Verification
**POST** `/api/admin/verifications/[userId]/reject`
- Headers: `Authorization: Bearer <admin_token>`
- Body: `{ reason: "Reason for rejection" }`
- Returns: `{ userId, verificationStatus: 'rejected', rejectionReason }`
- Status: 200 OK

## Frontend Pages

### User Registration
**URL**: `/register`
- 3-step form
- Document upload with drag-and-drop
- File validation
- Success message with next steps

### Admin Verifications
**URL**: `/admin/verifications`
- Table of pending verifications
- Click "Review" to open modal
- View user details
- View uploaded documents (images or PDFs)
- Approve/Reject buttons
- Rejection reason textarea

## File Structure

```
app/
├── register/
│   └── page.tsx (3-step registration with document upload)
├── api/
│   ├── auth/
│   │   └── register/
│   │       └── route.ts (handles registration + document upload)
│   │   └── login/
│   │       └── route.ts (checks verification status)
│   └── admin/
│       └── verifications/
│           ├── route.ts (GET pending verifications)
│           └── [userId]/
│               ├── approve/
│               │   └── route.ts (approve verification)
│               └── reject/
│                   └── route.ts (reject verification)
└── admin/
    ├── layout.tsx (added Verifications link)
    └── verifications/
        └── page.tsx (admin verification review page)

models/
└── User.ts (has verificationStatus, verificationDocs, rejectionReason)

lib/
├── enums.ts (VerificationStatus enum)
└── admin.ts (requireAdmin middleware)
```

## Verification Status Flow

```
Registration
    ↓
NOT_SUBMITTED (initial)
    ↓
Documents Uploaded
    ↓
PENDING (awaiting admin review)
    ↓
    ├─→ APPROVED (admin approves) → User can login
    │
    └─→ REJECTED (admin rejects) → User sees rejection reason
            ↓
        User can resubmit documents
            ↓
        Back to PENDING
```

## Testing the System

### 1. Register a New User
1. Go to `/register`
2. Fill in Step 1 (account details)
3. Click "Next"
4. Fill in Step 2 (university info)
5. Click "Next"
6. Upload documents in Step 3
7. Click "Register"
8. See success message

### 2. Try to Login (Should Fail)
1. Go to `/login`
2. Enter registered email and password
3. Should see: "Your account is pending admin verification. Please wait."

### 3. Admin Approves User
1. Go to `/admin/login`
2. Login with admin credentials
3. Click "Verifications" in sidebar
4. See pending user in table
5. Click "Review"
6. View user details and documents
7. Click "Approve"
8. User status changes to approved

### 4. User Can Now Login
1. Go to `/login`
2. Enter email and password
3. Should login successfully
4. Redirected to dashboard

### 5. Admin Rejects User
1. Go to `/admin/verifications`
2. Click "Review" on a pending user
3. Enter rejection reason
4. Click "Reject"
5. User status changes to rejected

### 6. Rejected User Sees Error
1. User tries to login
2. Sees: "Your account was rejected. Reason: [admin's reason]"

## Error Handling

### Registration Errors
- "At least one verification document is required" - No documents uploaded
- "Invalid file type: [filename]. Only PDF, JPG, and PNG are allowed" - Wrong file format
- "File [filename] is too large. Maximum size is 5MB" - File too large
- "User with this email already exists" - Email already registered
- "Failed to upload documents" - Cloudinary upload failed

### Login Errors
- "Your account is pending admin verification. Please wait." - Status is PENDING
- "Your account was rejected. Reason: [reason]" - Status is REJECTED
- "Please upload your verification documents to complete registration" - Status is NOT_SUBMITTED
- "Your account has been banned" - User is banned

### Admin Errors
- "Invalid user ID" - Invalid ObjectId format
- "User not found" - User doesn't exist
- "Rejection reason is required" - Empty rejection reason

## Security Features

✅ **Document Upload**
- File type validation (PDF, JPG, PNG only)
- File size limit (5MB per file)
- Uploaded to Cloudinary (secure cloud storage)
- Unique folder per user

✅ **Admin Access**
- Requires JWT token with 'admin' role
- Middleware validates token before allowing access
- All admin actions logged

✅ **User Verification**
- Status checked on every login
- Cannot bypass verification
- Clear error messages

## Future Enhancements

1. **Resubmission After Rejection**
   - Allow users to resubmit documents after rejection
   - Endpoint: `POST /api/auth/resubmit-verification`

2. **Verification Expiry**
   - Require re-verification after certain period
   - Add `verificationExpiryDate` field

3. **Bulk Actions**
   - Admin can approve/reject multiple users at once
   - Batch operations

4. **Verification History**
   - Track all verification attempts
   - Show timeline of approvals/rejections

5. **Email Notifications**
   - Email user when approved
   - Email user when rejected with reason
   - Email admin when new documents submitted

6. **Document OCR**
   - Extract information from documents
   - Auto-fill user details from ID card
   - Verify document authenticity

7. **Admin Notes**
   - Admin can add notes to verification
   - Track why documents were rejected
   - Reference for future verifications

## Troubleshooting

### Documents not uploading
- Check file format (PDF, JPG, PNG only)
- Check file size (max 5MB)
- Check Cloudinary credentials in `.env`
- Check browser console for errors

### Admin can't see verifications
- Check admin token is valid
- Check user has 'admin' role
- Check database connection
- Check server logs for errors

### User can't login after approval
- Check user status is 'approved' in database
- Check token is being generated correctly
- Clear browser cache and localStorage
- Check server logs for errors

### Rejection reason not showing
- Check rejection reason was saved in database
- Check login endpoint is returning rejection reason
- Check frontend is displaying the error message

## Database Queries

### Get all pending verifications
```javascript
User.find({ verificationStatus: 'pending' })
  .select('_id fullName email university department batch role verificationDocs verificationStatus createdAt')
  .populate('university', 'name')
  .sort({ createdAt: -1 })
```

### Approve user
```javascript
User.findByIdAndUpdate(userId, {
  verificationStatus: 'approved',
  rejectionReason: null
}, { new: true })
```

### Reject user
```javascript
User.findByIdAndUpdate(userId, {
  verificationStatus: 'rejected',
  rejectionReason: 'Reason for rejection'
}, { new: true })
```

### Get rejected users
```javascript
User.find({ verificationStatus: 'rejected' })
```

---

**Status**: ✅ COMPLETE AND READY FOR TESTING
**Last Updated**: April 30, 2026
