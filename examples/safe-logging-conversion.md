# Converting Unsafe Logs to Safe Logging Practices

This guide provides practical examples of how to convert potentially unsafe console logging calls to our secure `safeConsole` utility.

## Basic Conversion Examples

### Example 1: Simple Logging

```typescript
// BEFORE: Potentially leaking user data
console.log("User logged in:", user);

// AFTER: Safe logging with minimal information
import { safeConsole } from '@/lib/utils';
safeConsole.info("User authentication successful", { userId: user.id });
```

### Example 2: Debugging Objects

```typescript
// BEFORE: Dumping entire resume to logs
console.log("Resume data:", resumeData);

// AFTER: Logging only metadata about the resume
safeConsole.debug("Resume loaded", { 
  id: resumeData.id,
  size: JSON.stringify(resumeData).length,
  sections: {
    hasWorkExperience: resumeData.workExperiences.length > 0,
    hasEducation: resumeData.educations.length > 0 
  }
});
```

### Example 3: Error Logging

```typescript
// BEFORE: Error with potential sensitive context
console.error("Failed to save resume:", error, { resumeData });

// AFTER: Safer error reporting
safeConsole.error("Failed to save resume", error, { resumeId: resumeData?.id });
```

## Advanced Patterns

### Performance Logging

```typescript
// BEFORE: Direct console timing
console.time("fetchResume");
const result = await fetchResume(id);
console.timeEnd("fetchResume");

// AFTER: Safe performance logging
safeConsole.time("fetchResume");
const result = await fetchResume(id);
safeConsole.timeEnd("fetchResume");
// Or use the monitoring utility for more context
await monitoring.timeExecution("fetchResume", () => fetchResume(id));
```

### Form Data Logging

```typescript
// BEFORE: Potential PII leak
console.log("Form values:", formValues);

// AFTER: Sanitized logging
safeConsole.debug("Form submission", { 
  isValid: isValidForm,
  fieldsCompleted: Object.keys(formValues).filter(k => !!formValues[k]).length,
  totalFields: Object.keys(formValues).length
});
```

## Auto-Replacing with the Security Script

Our security scanning script can help identify unsafe logging. To run a scan:

```bash
node scripts/secure-logging.js
```

To see what would be auto-replaced:

```bash
node scripts/secure-logging.js --fix
```

## Log Level Guidelines

Choose the appropriate log level based on the information importance:

| Level     | Usage                                   | Environment        |
|-----------|----------------------------------------|-------------------|
| `trace`   | Very detailed debugging                 | Development only  |
| `debug`   | General debugging information           | Development only  |
| `info`    | Notable application events              | Dev & Production  |
| `warning` | Potential issues, not errors            | Dev & Production  |
| `error`   | Errors affecting app functionality      | Dev & Production  |

## Real-world Examples from Our Codebase

### Converting Resume Editor Page Logs

```typescript
// BEFORE
console.log("=== Page component start ===");
console.log("Search params resolved:", { resumeId });
console.log("User ID from auth:", userId);
console.log("Fetching resume from DB for ID:", resumeId);
console.log("Resume fetch result:", resumeToEdit ? "found" : "not found");

// AFTER
safeConsole.debug("=== Page component start ===");
safeConsole.debug("Search params resolved", { resumeId });
safeConsole.debug("User authenticated", { hasUserId: !!userId });
safeConsole.debug("Fetching resume", { resumeId });
safeConsole.debug("Resume fetch result", { found: !!resumeToEdit });
```

## Final Tips

1. Always separate message text from data
2. Pass objects instead of inline string concatenation
3. Avoid logging entire response objects
4. Leverage the automatic sanitization of sensitive fields
5. When in doubt, log less information rather than more 