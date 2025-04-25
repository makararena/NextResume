# NextResume Security Guidelines

## Overview
This document outlines security best practices for the NextResume application, focusing on secure logging, authentication, and sensitive data handling. Following these guidelines will help minimize potential security risks, especially when moving to production.

## Secure Logging

### Key Principles
1. **Production vs Development Logging**
   - In production: Only log errors and critical information
   - In development: Verbose logging is acceptable

2. **Sensitive Data Protection**
   - Never log personal information (names, emails, phone numbers)
   - Never log authentication tokens, API keys, or passwords
   - Never log complete resume data in production

3. **Safe Logging Utility**
   - Always use the `safeConsole` utility from `@/lib/utils` instead of direct `console.log()`
   - This utility automatically sanitizes sensitive fields and respects environment settings

### Usage Examples
```typescript
// ❌ AVOID
console.log("User data:", userData);
console.log("API response:", response);

// ✅ RECOMMENDED
import { safeConsole } from '@/lib/utils';
safeConsole.debug("User authenticated", { hasUser: !!userData });
safeConsole.info("API request completed", { status: response.status });
```

### Scanning for Unsafe Logs
Run the security scanner regularly to identify unsafe logging:
```bash
node scripts/secure-logging.js
```

## Authentication Security

### Clerk Configuration
Our application uses Clerk for authentication with enhanced security settings:

1. **Secure Cookie Storage**
   - All authentication tokens are stored in HttpOnly cookies (not localStorage)
   - Cookies are configured with SameSite=lax to prevent CSRF attacks
   - Secure flag is enabled in production

2. **Headers and Protection**
   - CSP headers are set in production to prevent XSS attacks
   - X-Frame-Options and other security headers are automatically applied

### Best Practices
- Never store Clerk tokens in localStorage or sessionStorage
- Never print Clerk sessions or tokens to the console
- Use the auth() function from Clerk to verify authentication server-side

## Sensitive Data Handling

### Resume Data
- Sanitize personal information before logging
- Keep resume data encrypted at rest (database)
- Implement proper access controls (users can only access their own resumes)

### User Information
- Store only necessary user information
- Validate and sanitize user inputs
- Follow least privilege principles for data access

## Monitoring Implementation

The application uses a custom monitoring solution that:
1. Automatically sanitizes sensitive fields
2. Sets appropriate log levels based on environment
3. Prepares data for external monitoring services

### Log Levels
- `trace`: Very detailed information (development only)
- `debug`: Debugging information (development only)
- `info`: Normal application behavior (development and production)
- `warning`: Potential issues that aren't errors
- `error`: Error conditions that affect functionality

## Remaining Tasks
- [ ] Replace all direct console.log calls identified by the security scanner
- [ ] Implement periodic security audits
- [ ] Consider adding server-side rate limiting
- [ ] Implement breach detection monitoring

## Security Contacts
For security concerns, please contact:
- Security Team: security@nextresume.example.com

Always prioritize security, especially when working with user data and authentication! 