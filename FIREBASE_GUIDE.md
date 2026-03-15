# Firebase Setup Guide for RAM Studio Vault

To make your "Vault" fully functional and secure, follow these steps to configure Firebase.

## 1. Create a Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com/).
2. Click **"Add project"** and name it `ram-studio-vault`.
3. Enable Google Analytics (optional but recommended for seeing real user location data etc).

## 2. Enable Authentication
1. In the sidebar, go to **Build > Authentication**.
2. Click **"Get Started"**.
3. Select **Email/Password** as a Sign-in provider and enable it.
4. Go to the **Users** tab and click **"Add user"**.
5. Create an account for yourself (e.g., `admin@example.com` / `password123`).

## 3. Enable Cloud Firestore
1. In the sidebar, go to **Build > Firestore Database**.
2. Click **"Create Database"**.
3. Choose a location close to your users (e.g., `nam5` for US).
4. Start in **Production Mode**.

## 4. Set Security Rules
Go to the **Rules** tab in Firestore and paste the following rules. These rules allow **anyone** to view content (read-only) but only **you** (the admin) to edit/add content.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper to check if user exists in the 'admins' collection
    function isAdmin() {
      return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Allow admins to read/write their own admin status (or just check existence)
    match /admins/{userId} {
        allow read: if request.auth != null;
        allow write: if false; // Only manageable via Console initially to prevent hacking
    }

    match /content/{document} {
      // Public Read: Anyone can view videos/courses
      allow read: if true;
      
      // Admin Write: Only specific email can create/update/delete
      // Also allow incrementing views (public write for specific field)
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views']);
      allow create, delete: if isAdmin();
      allow update: if isAdmin();
      allow update: if isAdmin();
    }

    match /categories/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```
> **Note**: The rule `allow update: if request.resource.data.diff...` allows the public to increment the "view count" without being able to change the title or video URL.

## 5. Connect to Your App
1. Go to **Project Settings** (Gear icon).
2. Scroll to "Your apps" and click the content copy icon for the `firebaseConfig` object.
3. Open your project's `.env` file and fill in the values:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=...
   ...
   ```

## 6. Admin Access (One-Time Setup)
Since we removed hardcoded emails, you need to manually "bless" the first admin.
1. Go to **Authentication** tab in Firebase Console and find your **User UID** (copy it).
2. Go to **Firestore Database** tab.
3. Click **"Start collection"**.
4. Collection ID: `admins`.
5. Document ID: Paste your **User UID** here.
6. Field: `role` (string) = `admin`.
7. Click Save.

Now, the app will check this `admins` collection. If your UID is there, you are an Admin.

## 7. Enable Firebase Storage for File Uploads

### 7.1 Create Storage Bucket
1. In the sidebar, go to **Build > Storage**.
2. Click **"Get Started"**.
3. Choose a location (same as your Firestore region for best performance, e.g., `us-central1`).
4. Accept the default security rules for now (we'll update them below).

### 7.2 Storage Security Rules
Go to the **Rules** tab in Storage and replace with the following rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.firebase.identities['email'] == 'your-admin-email@example.com';
    }

    // Thumbnails: Admins can upload/delete, everyone can read
    match /thumbnails/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Files: Admins can upload/delete, everyone can read
    match /files/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

> **Important**: Replace `'your-admin-email@example.com'` with your actual admin email address.

### 7.3 Update .env File
Your `.env` file should already have `VITE_FIREBASE_STORAGE_BUCKET` from the Firebase config. If not, you can find it in:
- **Project Settings** > **Your apps** > Scroll to the Web app section and copy the `storageBucket` value

Example:
```env
VITE_FIREBASE_STORAGE_BUCKET=ram-studios-vault.firebasestorage.app
```

## 8. How to Upload Files from Admin Panel

1. **Thumbnail Upload**:
   - Click the "Upload" button next to the Thumbnail URL field
   - Select an image file
   - The file will be uploaded to `thumbnails/` folder in Storage
   - The URL will be automatically filled in the form

2. **Resource File Upload**:
   - In the Resources section, click "Upload" button next to the URL field
   - Select any file (PDF, ZIP, MP4, etc.)
   - The file will be uploaded to `files/` folder in Storage
   - The download link will be automatically populated

3. **Manual URL Input**:
   - You can also paste URLs directly without uploading
   - This works for external links (YouTube, GitHub, etc.)

## 9. Firebase Pricing & Quota Notes

- **Firestore**: 50,000 reads/day free, 20,000 writes/day free
- **Storage**: 5 GB free storage, 1 GB/day download free
- **Authentication**: Completely free

For a content library website, you should be well within free tier limits unless you get massive traffic.

## 10. Troubleshooting

### Issue: "Permission denied" when uploading
- **Solution**: Check that your email address in the storage rules matches your Firebase Auth email
- Make sure your `.env` file has the correct `VITE_FIREBASE_STORAGE_BUCKET`

### Issue: Files upload but URL is empty
- **Solution**: Files were likely uploaded but the URL extraction failed
- Check browser console for errors
- Try uploading again

### Issue: Thumbnails don't show in admin panel
- **Solution**: Check that the image URL is correct and accessible
- Some external image links may be blocked by CORS restrictions
- Use Firebase Storage uploads instead for full control
