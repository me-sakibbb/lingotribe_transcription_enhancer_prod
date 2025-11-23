# Admin Panel Quick Start Guide

## 🚀 Getting Started

### Step 1: Initial Setup

1. **Open the admin page**
   ```
   Open admin.html in your browser
   ```

2. **Sign in with admin account**
   - Use your Google account (must be in admin list)
   - Default admin: sakibulhasan159@gmail.com

3. **Initialize Firebase (First Time Only)**
   - Open browser console (F12)
   - Run: `setupFirebaseStructure()`
   - This creates the necessary Firebase collections

### Step 2: Add Your First User

1. Click **"➕ Add New User"** button
2. Fill in the form:
   - **Name**: User's full name (required)
   - **Email**: User's email address (required)
   - **Batch**: Optional grouping identifier
   - **Enable Date**: When access should start
   - **Disable Date**: When access should end (leave empty for no expiration)
   - **Purchase Type**: Select subscription type
   - **Payment Status**: Current payment status
3. Click **"Save User"**

### Step 3: Understanding User Status

**Active Users** are automatically granted extension access when:
- Enable Date is today or in the past (or not set)
- Disable Date is in the future (or not set)
- Payment status doesn't affect access (for tracking only)

**Example Scenarios:**

| Enable Date | Disable Date | Status |
|-------------|--------------|---------|
| 2025-01-01 | 2025-12-31 | ✅ Active (if today is between dates) |
| Not set | Not set | ✅ Active (always) |
| 2025-12-01 | Not set | ❌ Inactive (if today is before 12-01) |
| 2025-01-01 | 2025-01-31 | ❌ Inactive (if today is after 01-31) |

## 📊 Dashboard Overview

### Statistics Cards
- **Total Users**: All users in the system
- **Active Users**: Users currently with access
- **Paid Users**: Users with "paid" status
- **Pending Payments**: Users with "pending" status

### User Table Columns
1. **Name** - User's full name
2. **Batch** - Group/batch identifier
3. **Email** - User's email (used for login)
4. **Extension ID** - Chrome extension installation ID
5. **Enable Date** - Access start date
6. **Disable Date** - Access end date
7. **Facebook ID** - User's Facebook profile
8. **Phone Number** - Contact number
9. **Purchase Type** - Subscription type (monthly/yearly/lifetime/trial)
10. **Payment Method** - How they paid (bKash/Nagad/etc)
11. **Payment Status** - Current payment status
12. **Actions** - Edit/Delete buttons

## 🔍 Common Tasks

### Grant Immediate Access
1. Add user with their email
2. Leave Enable Date empty (or set to today)
3. Leave Disable Date empty
4. Set Payment Status to "paid"
5. User can now sign in to extension

### Grant Trial Access (7 days)
1. Add user with their email
2. Set Enable Date to today
3. Set Disable Date to 7 days from now
4. Set Purchase Type to "trial"
5. Set Payment Status to "pending"

### Extend User Access
1. Find user in table
2. Click "Edit"
3. Update Disable Date to new expiration
4. Click "Save User"

### Revoke Access Immediately
1. Find user in table
2. Click "Edit"
3. Set Disable Date to yesterday
4. Click "Save User"
5. User will lose access within 5 minutes (next auth check)

### Track Payments
1. When user pays, find them in table
2. Click "Edit"
3. Update:
   - Payment Status to "paid"
   - Payment Method to how they paid
   - Purchase Type to their subscription
4. Click "Save User"

## 🔐 Managing Admins

To add more admins, edit `admin.js`:

```javascript
// Line 48-51
isAdminUser(email) {
    const adminEmails = [
        'sakibulhasan159@gmail.com',
        'newadmin@example.com',  // Add here
    ];
    return adminEmails.includes(email.toLowerCase());
}
```

## 🔄 Auto-Sync Feature

The admin panel automatically syncs active users to the extension's approved list:

- **When**: After every add/edit/delete operation
- **What**: All active users' emails are added to `approved_emails`
- **Result**: Extension users can sign in immediately

You can also manually refresh by clicking the **"🔄 Refresh"** button.

## 🔍 Search & Filter

Use the search box to find users by:
- Name
- Email
- Batch
- Phone number
- Facebook ID

Search is real-time and case-insensitive.

## 💡 Tips & Best Practices

### 1. Use Batches for Organization
Group users by:
- Month/Year: "Jan 2025", "Feb 2025"
- Course: "Batch 1", "Batch 2"
- Type: "Premium", "Trial", "Staff"

### 2. Payment Tracking
- Set status to "pending" when user signs up
- Update to "paid" when payment received
- Use "failed" for declined payments
- Use "refunded" for refunds

### 3. Date Management
- Leave dates empty for permanent access
- Set both dates for time-limited access
- Use Enable Date for delayed start
- Use Disable Date for auto-expiration

### 4. Extension ID Tracking
- Record Chrome extension ID for support
- Helps identify specific installations
- Useful for troubleshooting

### 5. Contact Information
- Store Facebook ID for social support
- Store phone for urgent contact
- Helps with payment verification

## 🐛 Troubleshooting

### Users can't sign in
1. Check if user is in the table
2. Verify Enable/Disable dates
3. Check if email is correct
4. Click "🔄 Refresh" to force sync
5. Wait 5 minutes for auth cache to clear

### Can't add users
1. Verify you're signed in as admin
2. Check browser console for errors
3. Verify Firebase connection
4. Try refreshing the page

### Stats not updating
1. Click "🔄 Refresh" button
2. Check if users are loading
3. Verify Firebase connection

### Search not working
1. Clear search box
2. Refresh page
3. Check if users are loaded

## 📱 Mobile Access

The admin panel is responsive and works on mobile devices:
- Swipe table horizontally to see all columns
- All features work on touch devices
- Forms adapt to smaller screens

## 🔒 Security Notes

- Only admins can access the panel
- Non-admins are redirected to login
- All operations require authentication
- Firebase security rules should restrict direct access

## 📞 Support

For help or issues:
- Check browser console for errors
- Review Firebase logs
- Contact: sakibulhasan159@gmail.com

---

**Quick Reference Commands (Browser Console)**

```javascript
// Initialize Firebase structure (first time only)
setupFirebaseStructure()

// Add an admin email to approved list
addAdminEmail('newadmin@example.com')

// Verify Firebase connection
verifyFirebaseConnection()
```

---

**Created by**: me-sakibbb & NuhalMunawar  
**Version**: 1.0.0  
**Last Updated**: November 2025
