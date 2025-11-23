# Admin Panel Documentation

## Overview
The Admin Panel is a comprehensive user management system for the Lingotribe Transcription Enhancer Chrome Extension. It allows administrators to manage user access, track payments, and control extension activation.

## Features

### 📊 Dashboard Statistics
- **Total Users**: Count of all registered users
- **Active Users**: Users currently enabled (based on enable/disable dates)
- **Paid Users**: Users with "paid" payment status
- **Pending Payments**: Users with "pending" payment status

### 👥 User Management
Complete CRUD operations for user records:
- **Create**: Add new users with all required information
- **Read**: View all users in a sortable, searchable table
- **Update**: Edit existing user information
- **Delete**: Remove users from the system

### 🔍 Search & Filter
Real-time search across:
- Name
- Email
- Batch
- Phone number
- Facebook ID

### 🔐 Access Control
- Admin authentication required
- Automatic sync of approved emails to Firebase
- Active users automatically added to authorized list

## User Fields

| Field | Type | Description |
|-------|------|-------------|
| **Name** | Text | User's full name (required) |
| **Batch** | Text | User's batch or group identifier |
| **Email** | Email | User's email address (required) |
| **Extension ID** | Text | Chrome extension installation ID |
| **Enable Date** | Date | Date when access should be enabled |
| **Disable Date** | Date | Date when access should be disabled |
| **Facebook ID** | Text | User's Facebook profile ID |
| **Phone Number** | Tel | Contact phone number |
| **Purchase Type** | Select | monthly, yearly, lifetime, trial |
| **Payment Method** | Select | bKash, Nagad, Rocket, Bank, Card, PayPal, Other |
| **Payment Status** | Select | paid, pending, failed, refunded |

## Firebase Structure

### Collections

#### `lingotribe_users`
Stores all user information with auto-generated document IDs.

```
lingotribe_users/
  └── user_[timestamp]_[random]/
      ├── name: string
      ├── batch: string
      ├── email: string
      ├── extensionId: string
      ├── enableDate: string (ISO date)
      ├── disableDate: string (ISO date)
      ├── facebookId: string
      ├── phone: string
      ├── purchaseType: string
      ├── paymentMethod: string
      └── paymentStatus: string
```

#### `lingotribe_transcription_enhancer/approved_emails`
Auto-synced list of active user emails.

```
lingotribe_transcription_enhancer/
  └── approved_emails/
      └── emails: array<string>
```

## Access Control Logic

A user is considered **active** when:
1. Enable Date is in the past OR not set
2. Disable Date is in the future OR not set
3. Has a valid email address

Active users are automatically added to the `approved_emails` list, which the extension uses for authentication.

## Admin Access

### Setting Up Admins
Edit `admin.js` line 48-51 to add admin emails:

```javascript
isAdminUser(email) {
    const adminEmails = [
        'sakibulhasan159@gmail.com',
        'your-admin@email.com',  // Add more admins here
    ];
    return adminEmails.includes(email.toLowerCase());
}
```

## Usage

### Accessing the Admin Panel
1. Navigate to `admin.html` in your browser
2. Sign in with an authorized admin Google account
3. You'll be redirected to the dashboard

### Adding a User
1. Click "➕ Add New User" button
2. Fill in required fields (Name and Email)
3. Optionally fill in other fields
4. Click "Save User"
5. User will be added to Firebase and approved emails list will auto-sync

### Editing a User
1. Find the user in the table
2. Click "Edit" button in the Actions column
3. Modify the desired fields
4. Click "Save User"
5. Changes will be saved to Firebase

### Deleting a User
1. Find the user in the table
2. Click "Delete" button in the Actions column
3. Confirm deletion in the modal
4. User will be removed from Firebase and approved emails list will auto-sync

### Searching Users
- Type in the search box at the top
- Results filter in real-time
- Search works across: Name, Email, Batch, Phone, Facebook ID

## Security Considerations

### Firebase Security Rules
Recommended Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to approved emails for all authenticated users
    match /lingotribe_transcription_enhancer/approved_emails {
      allow read: if true;
      allow write: if false; // Only admin panel can write
    }
    
    // Only allow admin access to user data
    match /lingotribe_users/{userId} {
      allow read, write: if false; // Only admin panel can access
    }
  }
}
```

### Admin Authentication
- Only emails listed in `isAdminUser()` can access the admin panel
- Non-admin users are redirected to login page
- Session is checked on page load

## API Integration

The admin panel uses Firebase REST API for all operations:

### Base URL
```
https://firestore.googleapis.com/v1/projects/anilab-42c99/databases/(default)/documents
```

### Endpoints Used
- `GET /lingotribe_users` - Fetch all users
- `PATCH /lingotribe_users/{userId}` - Create/Update user
- `DELETE /lingotribe_users/{userId}` - Delete user
- `PATCH /lingotribe_transcription_enhancer/approved_emails` - Sync approved emails

## Troubleshooting

### Users not loading
- Check browser console for errors
- Verify Firebase project ID in `admin.js`
- Ensure Firebase API is enabled

### Can't add/edit users
- Verify you're signed in as an admin
- Check Firebase security rules
- Look for CORS errors in console

### Approved emails not syncing
- Check `syncApprovedEmails()` function logs
- Verify Firebase permissions
- Ensure at least one active user exists

## Development

### File Structure
```
admin.html          - Main HTML structure
admin-styles.css    - Styling and responsive design
admin.js           - Business logic and Firebase operations
firebase-config.js - Firebase configuration
auth.js           - Authentication management
```

### Customization
- Modify `admin-styles.css` for design changes
- Edit `admin.js` for functionality changes
- Update form fields in `admin.html` as needed

## Support

For issues or questions:
1. Check browser console for errors
2. Review Firebase logs
3. Contact: sakibulhasan159@gmail.com

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Created by**: me-sakibbb & NuhalMunawar
