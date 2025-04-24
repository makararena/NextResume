# Manual Subscription Testing Guide

This document outlines steps to manually test the subscription model functionality in the browser.

## Prerequisites

1. Ensure the development server is running: `npm run dev`
2. Create a test user account or use an existing one

## Test Cases

### 1. Resume Count Tracking

1. Log in to your account
2. Check your current resume count in the navbar (should show X/3)
3. Create a new resume project
4. Verify the resume count increments in the navbar
5. Create resumes until you reach the limit (3)
6. Try to create another resume and verify you get an error message

**Expected Result**: You should only be able to create 3 resumes with a free account.

### 2. AI Generation Count Tracking 

1. Log in to your account
2. Check your current AI generation count in the navbar (should show X/10)
3. Use an AI feature (like "Generate Summary" or "Smart fill")
4. Verify the AI generation count increments in the navbar
5. Continue using AI features until you reach the limit (10)
6. Try to use another AI feature and verify you get an error/upgrade message

**Expected Result**: You should only be able to use AI generation 10 times with a free account.

### 3. Subscription Plan Display

1. Log in with a free account
2. Check the navbar - it should show "Free Plan"
3. Check the dashboard - it should show details about the Free Plan and Premium Plan

**Expected Result**: The UI should correctly indicate your current plan.

### 4. Dashboard Page

1. Visit the dashboard page
2. Verify the Free Plan card shows "View your resumes" button (not "Get started")
3. Verify the Free Plan card shows the correct limits (3 resumes, 10 AI generations)
4. Verify the Premium Plan shows "Start a free trial" button

**Expected Result**: The dashboard should correctly display plan information and appropriate buttons.

## Edge Cases

### 1. Usage Sync on Page Load

1. Create a resume through direct API call or database
2. Refresh the app and visit the navbar/dashboard
3. Verify the resume count is correct (includes the one created outside the UI)

**Expected Result**: Usage metrics should sync from the database, not just rely on client-side tracking.

### 2. Premium User Access

1. (If possible) Use account with premium subscription
2. Verify that the navbar shows "Premium" instead of "Free Plan"
3. Try to create more than 3 resumes
4. Try to use AI features more than 10 times

**Expected Result**: Premium users should have unlimited access to resumes and AI features.

### 3. Expired Premium Subscription

1. (If possible) Use account with an expired premium subscription
2. Verify the UI shows "Free Plan" now (instead of "Premium")
3. Verify that limits are now enforced

**Expected Result**: Once a premium subscription expires, the user should revert to free plan limitations.

## Reporting Issues

If you encounter any issues during testing, please document:

1. The test case being performed
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Browser and device information 