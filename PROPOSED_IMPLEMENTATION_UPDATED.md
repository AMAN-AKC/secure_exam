# Proposed Question Paper Creation Flow - Implementation Plan (UPDATED)

## Overview

Refactor exam creation workflow to separate **Exam Settings** from **Question Setup** with **TWO DISTINCT MODES**:

- **Mode 1: "Create Your Own"** - Write questions manually + optional QB selection
- **Mode 2: "Question Bank Only"** - Select from QB only, no manual creation

## Current Flow

1. Settings Modal → Add Questions Manually → Finalize

## Proposed New Flow

### Step 1: Exam Settings & Timing ✅

**File:** TeacherDashboard.jsx (Lines 800-1000)

- Exam title, description
- Duration, timing
- Availability windows
- Options & result release settings

**Output:** `examSettings` object
**Next:** Show "Choose Question Method" modal

---

### Step 2: Choose Question Method 🆕 (NEW)

**Modal:** "Question Setup Method"

After exam settings are saved, show two **MUTUALLY EXCLUSIVE** options:

```
┌──────────────────────────────────────────────────┐
│  How would you like to add questions?             │
├──────────────────────────────────────────────────┤
│                                                   │
│  ○ Create Your Own Questions                     │
│    (Write questions manually)                    │
│    ✓ Can also add from Question Bank later       │
│    ✓ Mixed mode enabled                          │
│                                                   │
│  ○ Select Only from Question Bank                │
│    (Browse & filter existing questions)          │
│    ✗ Cannot write questions manually             │
│    ✗ Pure QB mode only                           │
│                                                   │
│          [Continue] [Cancel]                     │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Key Logic:**

- **"Create Your Own"** → Flexible mode
  - Primary: Manual question creation
  - Optional: Can add questions from QB anytime via button
  - Recommended for: Teachers who want to write custom questions
- **"Question Bank Only"** → Fast mode
  - Only select from existing questions
  - No manual question creation allowed
  - Recommended for: Using pre-built question sets

**Implementation:**

- New state: `questionSetupMethod` ('own' | 'bank' | null) - **NOT both**
- New modal component: `QuestionSetupMethodModal`
- Conditional rendering based on method choice

---

### Step 3A: Select from Question Bank 📚 (For "Question Bank Only" mode)

**⚠️ Only available if user chose "Question Bank Only" in Step 2**

```
┌──────────────────────────────────────────────────┐
│  Select Questions from Question Bank              │
│  (Select from QB only - No manual entry)          │
├──────────────────────────────────────────────────┤
│  Filters:                                         │
│  Category: [dropdown]                            │
│  Difficulty: [Easy/Med/Hard]                     │
│  Status: [Approved only]                         │
│  Search: [text input]                            │
│                                                   │
│  [✓] Select All  [Clear]                         │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ ☑ Q1: What is 2+2?                         │ │
│  │    Category: Math | Hard                    │ │
│  │    "When 2 apples are added..."            │ │
│  │                                             │ │
│  │ ☐ Q2: Capital of France?                   │ │
│  │    Category: Geography | Easy               │ │
│  │    "France is a country in..."             │ │
│  │                                             │ │
│  │ ☐ Q3: Define photosynthesis                │ │
│  │    Category: Biology | Medium               │ │
│  │    "Photosynthesis is..."                  │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  Selected: 1 question(s)                         │
│  Total Marks: 1                                  │
│                                                   │
│  [Finalize Exam] [Cancel]                        │
│  (No "Add Manually" button in this mode)         │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Key Points:**

- ✓ Locked to Question Bank selection only
- ✗ No option to write questions manually
- ✗ Cannot add manual questions later
- When "Done" → Directly finalize exam

**Implementation:**

- Reuse QuestionBank.jsx filter logic
- Add checkboxes for selection
- Track selected questions in state
- Show count & total marks
- **NO "Add Manually" button**

---

### Step 3B: Create Your Own Questions ✏️ (For "Create Your Own" mode)

**✓ Available if user chose "Create Your Own Questions" in Step 2**

```
┌──────────────────────────────────────────────────┐
│  Create Questions for: English Exam               │
│  Questions Added: 2 Manual + 1 from QB            │
│  Total Marks So Far: 3                           │
├──────────────────────────────────────────────────┤
│                                                   │
│  📝 Question 1:                                  │
│  [Question text input]                           │
│                                                   │
│  Mark: [1] ▲▼                                    │
│  Difficulty: [Medium] ▼                          │
│                                                   │
│  Options:                                        │
│  A) [option text]                                │
│  B) [option text]                                │
│  C) [option text] ← Correct                      │
│  D) [option text]                                │
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ [Add Question] [+ Add from QB] [Finalize]   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│  ──────────────────────────────────────────     │
│  Questions List:                                 │
│  ✅ Q1: "What is 2+2?" (1 mark) [manual]       │
│  ✅ Q2: "What is 3x4?" (1 mark) [manual]       │
│  🏦 QB1: "Capital of France?" (1 mark) [QB]    │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Key Features:**

- ✓ Primary mode: Write questions manually
- ✓ Optional button: **"+ Add from Question Bank"**
- ✓ Can mix manual + QB questions
- ✓ Visual indicator showing source (manual vs QB)
- When done: Finalize exam with all questions

**Buttons:**

- **"Add Question"** → Save current question, clear form for next
- **"+ Add from QB"** → Opens QB selection panel, returns to this form
- **"Finalize"** → Create exam with all questions (manual + QB)

**Implementation:**

- Enhance existing question modal
- Add button: **"+ Add from Question Bank"**
- Keep manual question creation as primary interface
- Track both `manuallyCreatedQuestions` and `selectedQuestionsFromBank`
- Mixed list showing source indicator (icon or badge)
- Allow delete individual questions from list

---

### Step 4: Finalize Exam

**For "Create Your Own" mode:**

```
POST /api/teacher/exams
{
  examSettings: {...},
  questions: [
    ...manuallyCreatedQuestions,  // Write by teacher
    ...selectedQuestionsFromBank  // From QB
  ]
}
```

**For "Question Bank Only" mode:**

```
POST /api/teacher/exams
{
  examSettings: {...},
  questions: selectedQuestionsFromBank  // Only QB
}
```

---

## Workflow Comparison

### Mode 1: Create Your Own (Flexible) ✏️

```
Exam Settings
    ↓
Choose: "Create Your Own Questions"
    ↓
Add Questions Manually (primary)
    ├─ Write Q1 manually
    ├─ Write Q2 manually
    ├─ (optional) "Add from QB" button
    │   ├─ Filter & select QB1, QB2
    │   └─ Back to manual form
    ├─ Write Q3 manually
    └─ ...mix of manual + QB
    ↓
Finalize: Exam with mixed questions
```

**Best for:** Teachers who want custom questions + selective QB usage

### Mode 2: Question Bank Only (Fast) 🏦

```
Exam Settings
    ↓
Choose: "Select Only from Question Bank"
    ↓
Select from Question Bank (only option)
    ├─ Filter by category/difficulty
    ├─ Select Q1, Q2, Q3, Q4...
    └─ No manual creation allowed
    ↓
Finalize: Exam with QB questions only
```

**Best for:** Quick setup using existing approved questions

---

## State Management

```javascript
// Step 1: After settings saved
{
  examSettings: {
    title: "English Exam",
    durationMinutes: 60,
    availableFrom: "2025-01-15T09:00",
    availableTo: "2025-01-15T10:00",
    // ...rest of settings
  }
}

// Step 2: Method selection (MUTUALLY EXCLUSIVE)
{
  questionSetupMethod: "own" | "bank"  // Choose ONE, not both
}

// Step 3A: If "bank" mode - QB questions only
{
  selectedQuestionsFromBank: [
    {
      questionBankId: "507f1f77bcf86cd799439011",
      title: "What is 2+2?",
      category: "Math",
      difficulty: "hard",
      source: "bank"
    },
    {
      questionBankId: "507f1f77bcf86cd799439012",
      title: "Capital of France?",
      category: "Geography",
      difficulty: "easy",
      source: "bank"
    }
  ],
  manuallyCreatedQuestions: [] // Empty in pure QB mode
}

// Step 3B: If "own" mode - Can accumulate both
{
  manuallyCreatedQuestions: [
    {
      text: "What is photosynthesis?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: 1,
      marks: 2,
      difficulty: "medium",
      source: "manual"
    }
  ],
  selectedQuestionsFromBank: [
    {
      questionBankId: "507f1f77bcf86cd799439011",
      title: "What is 2+2?",
      category: "Math",
      difficulty: "hard",
      source: "bank"
    }
  ]
  // Both can exist together in "own" mode!
}

// Final: Create exam with appropriate questions
POST /api/teacher/exams
{
  examSettings: {...},
  questions: [
    ...manuallyCreatedQuestions,
    ...selectedQuestionsFromBank
  ]
}
```

---

## Files to Create/Modify

### 1. **TeacherDashboard.jsx** (Existing, MODIFY)

**Changes:**

- After `showSettingsModal` closes, show `QuestionSetupMethodModal`
- Add states: `questionSetupMethod`, `selectedQuestionsFromBank`, `manuallyCreatedQuestions`
- Conditional rendering based on `questionSetupMethod`:
  - If "own" → Show enhanced manual question form with QB button
  - If "bank" → Show QB selection panel only

### 2. **Create New: QuestionSetupMethodModal.jsx**

**Purpose:** Two-option radio modal after settings
**Features:**

- Two radio options with descriptions
- Clear explanation of each mode
- [Continue] button
- [Cancel] button

### 3. **Create New: QuestionBankSelectionPanel.jsx**

**Purpose:** Reusable QB selection with filters & checkboxes
**Features:**

- Filters: category, difficulty, status
- Search box
- Question list with checkboxes
- "Select All" / "Clear" buttons
- Show selected count & total marks
- Return selected questions to parent

### 4. **Modify: TeacherDashboard.jsx - Manual Question Form**

**Changes:**

- Add button: **"+ Add from Question Bank"**
- Opens QuestionBankSelectionPanel in modal
- Returns to form after selection
- Displays mixed list with source indicators

### 5. **Backend API** (Already mostly ready)

- `POST /api/teacher/exams` → Create exam ✅
- `POST /api/teacher/exams/:examId/questions` → Add questions
  - Modify to accept `questionBankId` **OR** inline `{ text, options, correctIndex }`

---

## Benefits

✅ **Two distinct modes** - Teacher chooses workflow based on preference
✅ **Flexible in "own" mode** - Can mix manual + QB as needed  
✅ **Fast in "bank" mode** - Quick setup using existing questions
✅ **Clear workflows** - No confusion about what's possible in each mode
✅ **Scalable** - Easy to add auto-selection feature later
✅ **Reusable** - Question Bank becomes core component
✅ **User-Friendly** - Progressive disclosure, not overwhelming
✅ **Future-Ready** - Can add randomized selection later

---

## Future Enhancements (Planned)

### Phase 2

1. **Auto-Selection by Difficulty** (In "bank" mode)
   - "I need 10 questions: 3 Easy, 5 Medium, 2 Hard"
   - System randomly selects matching questions
   - One-click instead of manual selection

### Phase 3

2. **Question Templates/Sets**
   - Pre-built sets like "Math Final Exam Set"
   - One-click to add entire set

### Phase 4

3. **Randomized Questions per Student**
   - Different students get different questions
   - Same difficulty distribution & total marks
   - Each exam generates unique paper per student

---

## Implementation Priority

### Priority 1 (HIGH - Do First)

- QuestionSetupMethodModal
- QuestionBankSelectionPanel
- Modify TeacherDashboard flow

### Priority 2 (MEDIUM - Do Second)

- Extract reusable filter component
- Improve UX/styling
- Backend modifications for QB import

### Priority 3 (LOW - Future)

- Auto-selection feature
- Question templates
- Randomization per student
