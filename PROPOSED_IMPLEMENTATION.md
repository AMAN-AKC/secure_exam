# Proposed Question Paper Creation Flow - Implementation Plan

## Overview

Refactor exam creation workflow to separate **Exam Settings** from **Question Setup**, allowing flexible mixing of Question Bank selection and manual creation.

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

After exam settings are saved, show two options:

```
┌─────────────────────────────────────┐
│  How would you like to add questions? │
├─────────────────────────────────────┤
│                                      │
│  ☐ Select from Question Bank         │
│    (Browse & filter existing Q's)    │
│                                      │
│  ☐ Create Your Own Questions         │
│    (Write questions manually)         │
│                                      │
│  [Can use both methods together]     │
│                                      │
└─────────────────────────────────────┘
```

**Implementation:**

- New state: `questionSetupMethod` (null | 'bank' | 'manual' | 'both')
- New modal component: `QuestionSetupMethodModal`
- Both radio buttons trigger different flows

---

### Step 3A: Select from Question Bank 📚

If user chooses "Select from Question Bank":

```
┌─────────────────────────────────────┐
│  Question Bank Selection              │
├─────────────────────────────────────┤
│  Filters:                            │
│  Category: [dropdown]                │
│  Difficulty: [Easy/Med/Hard]         │
│  Status: [Approved only]             │
│  Search: [text input]                │
│                                      │
│  [✓] Select All  [Clear]             │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ ☑ Q1: What is 2+2?              │ │
│  │   Category: Math | Hard          │ │
│  │   "When 2 apples are added..."   │ │
│  │                                  │ │
│  │ ☐ Q2: Capital of France?         │ │
│  │   Category: Geography | Easy      │ │
│  │   "France is a country in..."    │ │
│  │                                  │ │
│  │ ☐ Q3: Define photosynthesis      │ │
│  │   Category: Biology | Medium      │ │
│  │   "Photosynthesis is..."         │ │
│  └─────────────────────────────────┘ │
│                                      │
│  Selected: 1 question(s)             │
│  Total Marks: 1                      │
│                                      │
│  [Continue] [Add Manually] [Cancel]  │
└─────────────────────────────────────┘
```

**Implementation:**

- Reuse QuestionBank.jsx filter logic
- Add checkboxes for selection
- Track selected questions state
- Show count & total marks
- Offer button to "Also Add Manually"

---

### Step 3B: Create Your Own Questions ✏️

If user chooses "Create Your Own Questions":

```
┌─────────────────────────────────────┐
│  Create Questions for: English Exam  │
│  Questions Added: 2                  │
│  Total Marks So Far: 2               │
├─────────────────────────────────────┤
│                                      │
│  📝 Question 1:                      │
│  [Question text input]               │
│                                      │
│  Mark: [1] ▲▼                        │
│  Difficulty: [Medium] ▼              │
│                                      │
│  Options:                            │
│  A) [option text]                    │
│  B) [option text]                    │
│  C) [option text] ← Correct          │
│  D) [option text]                    │
│                                      │
│  [Add Question] [Add from QB] [Done] │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  ✅ Q1: "What is 2+2?" (1 mark)     │
│  ✅ Q2: "What is 3x4?" (1 mark)     │
│                                      │
└─────────────────────────────────────┘
```

**Implementation:**

- Modify existing question modal
- Add buttons:
  - "Add Question" - Add current question
  - "Add from Question Bank" - Opens filtered QB
  - "Done" - Finalize exam

---

### Step 4: Finalize Exam

**For "Create Your Own" mode:**

- Mix of manual questions + QB questions
- Finalize with all combined

**For "Question Bank Only" mode:**

- Pure QB questions
- Finalize directly from QB selection

---

## Workflow Comparison

### Mode 1: Create Your Own (Flexible)

```
Exam Settings
    ↓
Choose: "Create Your Own"
    ↓
Add Questions Manually (primary)
    ├─ Write Q1
    ├─ Write Q2
    └─ (optional) Add from QB button
        ├─ Select QB1
        ├─ Select QB2
        └─ Back to manual writing
    ↓
Finalize: Mix of manual + QB questions
```

### Mode 2: Question Bank Only (Fast)

```
Exam Settings
    ↓
Choose: "Question Bank Only"
    ↓
Select from Question Bank (only option)
    ├─ Filter by category/difficulty
    ├─ Select Q1, Q2, Q3...
    └─ No manual creation allowed
    ↓
Finalize: QB questions only
```

## Files to Modify

### 1. **TeacherDashboard.jsx**

- Add new state: `questionSetupMethod`, `selectedQuestionsFromBank`, `manuallyCreatedQuestions`
- Modify flow after `showSettingsModal` closes
- Show `QuestionSetupMethodModal`
- Render conditional UI based on `questionSetupMethod`

### 2. **Create New: QuestionSetupMethodModal.jsx**

- Two radio options: Select from QB / Create Own
- Handle selection
- Pass method choice back to parent

### 3. **Create New: QuestionBankSelectionPanel.jsx**

- Reuse filtering logic from QuestionBank.jsx
- Add checkboxes for selection
- Show selected count & total marks
- Export selected questions

### 4. **Modify: QuestionBank.jsx** (Optional)

- Extract filter logic to reusable component
- Make it embeddable in exam creation flow

### 5. **Backend API** (Already exists, minimal changes)

- `POST /api/teacher/exams` → Create exam ✅
- `POST /api/teacher/exams/:examId/questions` → Add questions (supports both manual & from QB)
- Modify to accept `questionBankId` OR inline `{ text, options, correctIndex }`

---

## State Management

```javascript
// Step 1: After settings saved
{
  examSettings: {
    title: "English Exam",
    durationMinutes: 60,
    // ...rest of settings
  }
}

// Step 2: Method selection
{
  questionSetupMethod: "own" | "bank" // (NOT both - mutually exclusive)
}

// Step 3A: If "bank" mode - QB questions only
{
  selectedQuestionsFromBank: [
    { questionBankId: "507f1f77bcf86cd799439011", source: "bank" },
    { questionBankId: "507f1f77bcf86cd799439012", source: "bank" },
  ]
}

// Step 3B: If "own" mode - Can accumulate both
{
  manuallyCreatedQuestions: [
    { text: "...", options: [...], correctIndex: 0, source: "manual" },
  ],
  selectedQuestionsFromBank: [
    { questionBankId: "507f1f77bcf86cd799439011", source: "bank" },
  ]
  // Can have both!
}

// Final: Create exam with appropriate questions
// Mode "own": POST with mix of manual + QB
// Mode "bank": POST with QB only
POST /api/teacher/exams
{
  examSettings: {...},
  questions: [...manuallyCreatedQuestions, ...selectedQuestionsFromBank]
}
```

---

## Benefits

✅ **Two distinct modes** - Teacher chooses workflow based on preference
✅ **Flexible in "own" mode** - Can mix manual + QB as needed
✅ **Fast in "bank" mode** - Quick setup using existing questions
✅ **Scalable** - Easy to add auto-selection feature later
✅ **Reusable** - Question Bank becomes core component
✅ **User-Friendly** - Clear workflow, not overwhelming
✅ **Future-Ready** - Can add randomized selection later

---

## Future Enhancements (Planned)

1. **Auto-Selection by Difficulty**

   - "I need 10 questions: 3 Easy, 5 Medium, 2 Hard"
   - System randomly selects from filtered QB

2. **Question Sets/Templates**

   - Pre-built sets like "Math Final Exam Set"
   - One-click to add entire set

3. **Randomized Questions per Student**
   - Different students get different questions
   - But same difficulty distribution & total marks

---

## Implementation Priority

1. **Phase 1** (Priority: HIGH)

   - QuestionSetupMethodModal
   - QuestionBankSelectionPanel
   - Modify TeacherDashboard flow

2. **Phase 2** (Priority: MEDIUM)

   - Extract reusable filter component
   - Improve UX/styling

3. **Phase 3** (Priority: LOW)
   - Auto-selection feature
   - Question templates
