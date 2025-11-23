// firebase-setup.js
// Script to initialize Firebase Firestore structure for the admin panel
// Run this in browser console on admin.html page to set up initial structure

async function setupFirebaseStructure() {
    const projectId = 'anilab-42c99';
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

    console.log('🚀 Starting Firebase setup...');

    try {
        // 1. Create approved_emails document if it doesn't exist
        console.log('📧 Setting up approved_emails document...');

        const approvedEmailsUrl = `${baseUrl}/lingotribe_transcription_enhancer/approved_emails`;
        const approvedEmailsData = {
            fields: {
                emails: {
                    arrayValue: {
                        values: [
                            { stringValue: 'sakibulhasan159@gmail.com' }
                        ]
                    }
                }
            }
        };

        const emailsResponse = await fetch(approvedEmailsUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(approvedEmailsData)
        });

        if (emailsResponse.ok) {
            console.log('✅ Approved emails document created');
        } else {
            console.log('⚠️ Approved emails document may already exist');
        }

        // 2. Create a sample user (optional)
        console.log('👤 Creating sample user...');

        const sampleUserId = 'user_sample_' + Date.now();
        const sampleUserUrl = `${baseUrl}/lingotribe_users/${sampleUserId}`;
        const sampleUserData = {
            fields: {
                name: { stringValue: 'Sample User' },
                batch: { stringValue: 'Batch 1' },
                email: { stringValue: 'sample@example.com' },
                extensionId: { stringValue: 'sample-extension-id' },
                enableDate: { stringValue: new Date().toISOString().split('T')[0] },
                disableDate: { stringValue: '' },
                facebookId: { stringValue: '' },
                phone: { stringValue: '+1234567890' },
                purchaseType: { stringValue: 'trial' },
                paymentMethod: { stringValue: 'bkash' },
                paymentStatus: { stringValue: 'pending' }
            }
        };

        const userResponse = await fetch(sampleUserUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sampleUserData)
        });

        if (userResponse.ok) {
            console.log('✅ Sample user created');
        } else {
            console.log('❌ Failed to create sample user');
        }

        console.log('🎉 Firebase setup complete!');
        console.log('📝 You can now use the admin panel to manage users');

        return {
            success: true,
            message: 'Firebase structure initialized successfully'
        };

    } catch (error) {
        console.error('❌ Setup failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to add admin email to approved list
async function addAdminEmail(email) {
    const projectId = 'anilab-42c99';
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

    try {
        console.log(`📧 Adding ${email} to approved emails...`);

        // First, get current emails
        const getUrl = `${baseUrl}/lingotribe_transcription_enhancer/approved_emails`;
        const getResponse = await fetch(getUrl);
        const currentData = await getResponse.json();

        let currentEmails = [];
        if (currentData.fields && currentData.fields.emails && currentData.fields.emails.arrayValue) {
            currentEmails = currentData.fields.emails.arrayValue.values.map(v => v.stringValue);
        }

        // Add new email if not already present
        if (!currentEmails.includes(email.toLowerCase())) {
            currentEmails.push(email.toLowerCase());

            const updateData = {
                fields: {
                    emails: {
                        arrayValue: {
                            values: currentEmails.map(e => ({ stringValue: e }))
                        }
                    }
                }
            };

            const updateResponse = await fetch(getUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (updateResponse.ok) {
                console.log(`✅ ${email} added to approved emails`);
                return { success: true };
            }
        } else {
            console.log(`ℹ️ ${email} already in approved emails`);
            return { success: true, alreadyExists: true };
        }

    } catch (error) {
        console.error('❌ Failed to add admin email:', error);
        return { success: false, error: error.message };
    }
}

// Function to verify Firebase connection
async function verifyFirebaseConnection() {
    const projectId = 'anilab-42c99';
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

    try {
        console.log('🔍 Verifying Firebase connection...');

        const response = await fetch(`${baseUrl}/lingotribe_transcription_enhancer/approved_emails`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Firebase connection successful');
            console.log('📊 Current approved emails:', data);
            return { success: true, data };
        } else {
            console.log('⚠️ Firebase connection issue:', response.status);
            return { success: false, status: response.status };
        }

    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        return { success: false, error: error.message };
    }
}

// Export functions for use in console
if (typeof window !== 'undefined') {
    window.setupFirebaseStructure = setupFirebaseStructure;
    window.addAdminEmail = addAdminEmail;
    window.verifyFirebaseConnection = verifyFirebaseConnection;
}

console.log('🔧 Firebase setup utilities loaded!');
console.log('Available commands:');
console.log('  - setupFirebaseStructure() : Initialize Firebase structure');
console.log('  - addAdminEmail(email) : Add an admin email to approved list');
console.log('  - verifyFirebaseConnection() : Check Firebase connection');
