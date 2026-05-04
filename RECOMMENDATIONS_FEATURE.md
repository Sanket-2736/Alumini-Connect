# Connection Recommendations Feature

## Overview

The recommendation system helps users discover and connect with other alumni and students based on shared attributes like university, batch, department, and skills.

## How It Works

### Recommendation Algorithm

Users are recommended based on a scoring system:

| Criteria | Points | Reason |
|----------|--------|--------|
| Same University | 50 | Strongest connection |
| Same Batch/Year | 30 | Similar graduation time |
| Same Department | 25 | Similar field of study |
| Shared Skills | 5 per skill | Common interests |
| Different Role | 10 | Alumni-Student mentorship |

**Example:**
- User A (Student, CSE, 2023, IIT Delhi) gets recommended User B (Alumni, CSE, 2023, IIT Delhi)
- Score: 50 (same uni) + 30 (same batch) + 25 (same dept) = **105 points**

### Top Recommendations

- System returns top 10 recommendations sorted by score
- Excludes already connected users
- Excludes banned users
- Only shows verified users

## Features

### 1. **Discover Page** (`/dashboard/discover`)

Beautiful card-based interface showing:
- User profile picture
- Match percentage (score)
- Match reasons (badges)
- University, Department, Batch
- Bio
- Skills (top 3 + count)
- "Send Connection Request" button

### 2. **Match Reasons**

Visual badges showing why users are recommended:
- "Same University"
- "Same Batch"
- "Same Department"
- "X shared skills"
- "Alumni" or "Student"

### 3. **Connection Request**

One-click connection request sending:
- Button changes to "✓ Request Sent" after clicking
- Recipient gets notification
- Prevents duplicate requests

## API Endpoints

### Get Recommendations
**GET** `/api/connections/recommendations`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://...",
      "university": "IIT Delhi",
      "department": "Computer Science",
      "batch": "2023",
      "role": "alumni",
      "bio": "Software Engineer at Google",
      "skills": ["Python", "React", "Node.js"],
      "score": 105,
      "matchReasons": ["Same University", "Same Batch", "Same Department"]
    }
  ]
}
```

### Send Connection Request
**POST** `/api/connections/request`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "recipientId": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "requester": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "Jane Smith",
      "profilePicture": "https://..."
    },
    "recipient": {
      "_id": "507f1f77bcf86cd799439012",
      "fullName": "John Doe",
      "profilePicture": "https://..."
    },
    "status": "pending",
    "createdAt": "2026-04-30T10:00:00Z"
  }
}
```

## File Structure

```
app/
├── dashboard/
│   └── discover/
│       └── page.tsx (Recommendations UI)
└── api/
    └── connections/
        ├── recommendations/
        │   └── route.ts (Get recommendations)
        └── request/
            └── route.ts (Send connection request - updated)
```

## User Experience Flow

```
1. User visits /dashboard/discover
   ↓
2. System fetches recommendations based on:
   - Same university
   - Same batch
   - Same department
   - Shared skills
   ↓
3. Recommendations displayed as cards with:
   - Match percentage
   - Match reasons
   - User details
   ↓
4. User clicks "Send Connection Request"
   ↓
5. Request sent to recipient
   ↓
6. Recipient gets notification
   ↓
7. Recipient can accept/reject
   ↓
8. Connection established or rejected
```

## Scoring Example

**User A Profile:**
- University: IIT Delhi
- Department: Computer Science
- Batch: 2023
- Role: Student
- Skills: Python, React, Node.js

**Recommended Users:**

| User | University | Dept | Batch | Skills | Score | Reasons |
|------|-----------|------|-------|--------|-------|---------|
| B | IIT Delhi | CSE | 2023 | Python, React | 105 | Same Uni, Batch, Dept, 2 skills |
| C | IIT Delhi | CSE | 2022 | Python | 80 | Same Uni, Dept, 1 skill |
| D | IIT Delhi | ECE | 2023 | React | 65 | Same Uni, Batch, 1 skill |
| E | IIT Bombay | CSE | 2023 | Python | 35 | Same Batch, Dept, 1 skill |

**Result:** User B is recommended first (highest score)

## Features

✅ **Smart Matching**
- Multiple criteria for recommendations
- Weighted scoring system
- Top 10 results

✅ **User Experience**
- Beautiful card interface
- Match percentage display
- Visual match reasons
- One-click connection

✅ **Notifications**
- Recipient gets notified
- Link to connection request
- Notification in dashboard

✅ **Validation**
- Prevents self-requests
- Prevents duplicate requests
- Checks user verification status
- Checks if user is banned

## Future Enhancements

1. **Mutual Interests**
   - Match based on job titles
   - Match based on companies
   - Match based on interests

2. **Advanced Filtering**
   - Filter by role (alumni/student)
   - Filter by department
   - Filter by batch range

3. **Personalization**
   - Learn from accepted/rejected requests
   - Improve recommendations over time
   - A/B testing different algorithms

4. **Social Features**
   - "People you may know" section
   - Mutual connections indicator
   - Connection strength score

5. **Analytics**
   - Track recommendation acceptance rate
   - Track connection success rate
   - Identify best matching criteria

## Testing

### Test 1: View Recommendations
1. Go to `/dashboard/discover`
2. Should see list of recommended users
3. Each card shows match percentage and reasons

### Test 2: Send Connection Request
1. Click "Send Connection Request" on a user
2. Button changes to "✓ Request Sent"
3. Recipient gets notification
4. Request appears in recipient's connections

### Test 3: Verify Scoring
1. Register users with different attributes
2. Check recommendations are sorted by score
3. Verify match reasons are correct

### Test 4: Edge Cases
1. Try to send request to yourself (should fail)
2. Try to send duplicate request (should fail)
3. Try to connect with banned user (should fail)
4. Try to connect with unverified user (should not appear)

## Database Queries

### Get recommendations for user
```javascript
User.find({
  _id: { $ne: userId, $nin: connectedIds },
  verificationStatus: 'approved',
  isBanned: false,
})
.select('_id fullName email profilePicture university department batch skills role bio')
.populate('university', 'name')
.lean()
```

### Check existing connection
```javascript
Connection.findOne({
  $or: [
    { requester: userId, recipient: recipientId },
    { requester: recipientId, recipient: userId },
  ],
})
```

---

**Status**: ✅ COMPLETE AND READY FOR TESTING
**Last Updated**: April 30, 2026
