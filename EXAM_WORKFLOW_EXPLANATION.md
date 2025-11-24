# Exam Workflow Explanation

## Understanding the Three Roles

The SecureExam system has a three-role workflow for creating and managing exams:

### 1. **Teacher Role** 🎓

- **Creates** new exams with title, description, duration
- **Adds questions** to exams
- **Finalizes** exams (encrypts questions, submits for approval)
- **Views** exam analytics and results after approval

### 2. **Admin Role** 👑

- **Reviews** pending exams submitted by teachers
- **Approves** exams → makes them visible to students
- **Rejects** exams if they don't meet criteria
- **Manages** all exams in the system

### 3. **Student Role** 📚

- **Sees only** approved exams in their dashboard
- **Registers** for available exams
- **Takes** exams during their allocated time
- **Views** results (based on release settings)

## The Exam Lifecycle

```
DRAFT (Created by teacher)
   ↓
ADD QUESTIONS (Teacher adds questions)
   ↓
FINALIZED (Teacher clicks finalize)
   ↓
PENDING (Awaiting admin approval)
   ↓
APPROVED (Admin approves) ← **VISIBLE TO STUDENTS**
   ↓
STUDENTS CAN REGISTER & TAKE EXAM
```

## Current System Status

### Sample Seeded Exams (Already Approved)

These exams are pre-loaded in the database for testing:

1. **Basic Mathematics Test** (30 min, 5 questions)

   - Status: ✅ APPROVED
   - Available: Now - 30 days
   - Results: Released after exam completion

2. **General Science Quiz** (45 min, 5 questions)

   - Status: ✅ APPROVED
   - Available: Now - 45 days
   - Results: Custom release (2 hours after submission)

3. **World History Quick Quiz** (15 min, 3 questions)
   - Status: ✅ APPROVED
   - Available: Now - 15 days
   - Results: Immediate

**These are REAL exams in the database** - you're not seeing placeholder data. They're there for testing the complete student workflow.

## How to Test with Your Own Exams

### Option 1: Create & Approve Your Own Exams (Full Workflow)

**Step 1: Login as a Teacher**

- Create account with "Teacher" role or use: `teacher***@secureexam.com`
- Go to Teacher Dashboard

**Step 2: Create an Exam**

- Click "Create New Exam"
- Fill in: Title, Description, Duration, Availability dates
- Submit

**Step 3: Add Questions**

- Click your exam
- Add 5+ questions with options and correct answers
- Save each question

**Step 4: Finalize Exam**

- Click "Finalize Exam"
- System encrypts questions and submits for approval
- Status changes to PENDING

**Step 5: Login as Admin**

- Get admin credentials from server logs (generated on first run)
- Or ask system admin for credentials
- Go to Admin Dashboard

**Step 6: Approve Exam**

- Click "Pending Exams"
- Find your exam
- Click "Approve"
- Status changes to APPROVED

**Step 7: Login as Student**

- Create student account or use: `student***@secureexam.com`
- Your newly approved exam now appears in "Available Exams"
- Register and take the exam!

### Option 2: Use Seeded Sample Exams (Quick Test)

- Login as Student
- You immediately see 3 approved exams ready to test
- No admin approval needed
- Perfect for testing the student experience

### Option 3: Quick Admin Approval Flow

If you already have pending exams:

1. Get admin credentials from server startup logs
2. Login as admin
3. Go to Admin Dashboard
4. Go to "Pending Exams"
5. Review and approve your teacher exams
6. Login as student to see them

## Database Structure

### Exam Status Values

- `draft` - Created, no questions yet
- `pending` - Finalized by teacher, awaiting admin approval
- `approved` - ✅ Visible to students
- `archived` - Removed from active use
- `rejected` - Rejected by admin

### Why This Workflow?

1. **Security**: Exams are encrypted before approval
2. **Quality Control**: Admin reviews before students take them
3. **Prevents Errors**: Teachers can't accidentally publish broken exams
4. **Audit Trail**: Clear history of who created/approved what
5. **Intentional Release**: Control exactly when exams become available

## Common Issues & Solutions

### ❌ "I see only sample exams, not my exams"

✅ **Solution**: Your exams are likely still in DRAFT or PENDING status

- Check if you finalized the exam
- Ask an admin to approve pending exams
- Or switch to admin role to approve them yourself

### ❌ "I don't see the question count"

✅ **Solution**: The exam needs at least 1 question

- Add questions in the exam editor
- Then finalize it

### ❌ "I can't register for an exam"

✅ **Solution**: Check the availability period

- Exam might have a future start date
- Or registration period might have closed
- Check the "Registration: from X until Y" text

## Authentication Credentials

### From Server Logs

When you start the server, it shows:

- Admin credentials (randomly generated)
- Sample Teacher credentials
- Sample Student credentials

### Creating New Accounts

- Click "Create Account" on login page
- Select your role (Student, Teacher, or request Admin)
- Use email verification if enabled

## Next Steps

1. **To Test Student Flow**:

   - Login as student → See 3 sample exams
   - Register for one → Take the exam
   - View your score

2. **To Test Full Workflow**:

   - Create exams as teacher
   - Approve as admin
   - Take as student

3. **To Verify Data is Real**:
   - Check database directly, or
   - Check network requests in browser DevTools
   - All data comes from MongoDB

## Key Takeaway

✅ **You ARE seeing real data, not samples!**

- The 3 exams shown are actual exams in your MongoDB database
- They're seeded for testing purposes
- Any exams YOU create will follow the same workflow
- This is how production systems typically work - with admin approval gates
