# Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Your Web Application                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐      ┌──────────────────────────┐│
│  │   Admin Dashboard        │      │   Public Website         ││
│  ├──────────────────────────┤      ├──────────────────────────┤│
│  │ • Upload Thumbnail       │      │ • View Courses           ││
│  │ • Upload Files           │      │ • Download Resources     ││
│  │ • Create Content         │      │ • Watch Videos           ││
│  │ • Edit/Delete Content    │      │ • Access Materials       ││
│  └──────────────────────────┘      └──────────────────────────┘│
│           │                                  ▲                  │
│           │ (Admin Actions)                  │ (User Access)    │
│           ▼                                  │                  │
│  ┌──────────────────────────┐                │                  │
│  │    src/pages/Admin.tsx   │                │                  │
│  │  + FileUploadButton      │                │                  │
│  │  + handleFileUpload()    │                │                  │
│  │  + handleThumbnailUpload │                │                  │
│  └──────────────────────────┘                │                  │
│           │                                  │                  │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            │ VITE_FIREBASE_*                  │
            │ .env variables                   │
            │                                  │
            ▼                                  ▼
   ┌─────────────────────────────────────────────────────┐
   │          FIREBASE / GOOGLE CLOUD                    │
   └─────────────────────────────────────────────────────┘
       │                      │                    │
       ▼                      ▼                    ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ Storage      │  │ Firestore    │  │ Auth         │
   │ Bucket       │  │ Database     │  │ Service      │
   ├──────────────┤  ├──────────────┤  ├──────────────┤
   │thumbnails/   │  │content/      │  │users/        │
   │files/        │  │categories/   │  │admins/       │
   │ (Downloads)  │  │ (Metadata)   │  │(Permissions) │
   └──────────────┘  └──────────────┘  └──────────────┘
```

## Upload Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN UPLOADS FILE                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────┐
                  │ Click Upload Button     │
                  │ Select File from System │
                  └─────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────┐
                  │  handleFileUpload()     │
                  │  or                     │
                  │  handleThumbnailUpload()│
                  └─────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────┐
                  │ uploadBytes()           │
                  │ Firebase SDK Function   │
                  └─────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────────┐
         │   Firebase Storage Bucket                  │
         │   (ram-studios-vault.firebasestorage.app) │
         ├────────────────────────────────────────────┤
         │                                            │
         │  thumbnails/1705000000000_course.jpg      │
         │  files/1705000001000_materials.pdf        │
         │                                            │
         └────────────────────────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────┐
                  │ getDownloadURL()        │
                  │ Firebase SDK Function   │
                  └─────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────────┐
         │ URL Generated:                             │
         │ https://firebasestorage.googleapis.com/... │
         └────────────────────────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────┐
                  │ Populate Form Field     │
                  │ with Download URL       │
                  └─────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────┐
                  │ User Publishes Content  │
                  │ Save to Firestore       │
                  └─────────────────────────┘
```

## Data Storage Structure

```
FIRESTORE COLLECTION STRUCTURE:
═════════════════════════════════════════════════════════════════

📦 content/
│
├─ {courseId}
│  ├─ title: "React Fundamentals"
│  ├─ description: "Learn React basics..."
│  ├─ category: "Development"
│  ├─ type: "course"
│  ├─ thumbnailUrl: "https://firebasestorage.googleapis.com/..."
│  │                                    (↓ Points to Storage)
│  ├─ resources: [
│  │  {
│  │    label: "Course PDF",
│  │    url: "https://firebasestorage.googleapis.com/..."
│  │                    (↓ Points to Storage)
│  │  },
│  │  {
│  │    label: "Source Code",
│  │    url: "https://firebasestorage.googleapis.com/..."
│  │                    (↓ Points to Storage)
│  │  }
│  │]
│  ├─ youtubeId: "dQw4w9WgXcQ"
│  ├─ lessons: [...]
│  ├─ createdAt: Timestamp
│  └─ views: 0
│
├─ {courseId2}
│  └─ ... (similar structure)

📸 FIREBASE STORAGE STRUCTURE:
════════════════════════════════════════════════════════════════

ram-studios-vault/
│
├─ thumbnails/
│  ├─ 1705000000000_react-course.jpg
│  ├─ 1705000001000_nodejs-guide.png
│  └─ 1705000002000_web-design.jpg
│
├─ files/
│  ├─ 1705000003000_react-materials.pdf
│  ├─ 1705000004000_source-code.zip
│  ├─ 1705000005000_assignment.docx
│  └─ 1705000006000_solution-video.mp4

Format: [timestamp]_[filename]
Benefits:
  • Unique names (no overwrites)
  • Sortable by upload date
  • No naming collisions
```

## Security Rules Flow

```
┌──────────────────────────────┐
│  User Attempts Download      │
│  Or Admin Attempts Upload    │
└──────────────────────────────┘
                │
                ▼
    ┌──────────────────────────┐
    │ Firebase Checks Rules    │
    └──────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
    ┌─────────┐      ┌──────────┐
    │  READ   │      │  WRITE   │
    │ REQUEST │      │ REQUEST  │
    └─────────┘      └──────────┘
        │                │
        │                ▼
        │         ┌──────────────────────┐
        │         │ Is User Logged In?   │
        │         │ (request.auth != null)
        │         └──────────────────────┘
        │                │
        │    ┌───────────┴────────────┐
        │    │ YES (Admin)       NO (Anonymous)
        │    │                         │
        │    ▼                         ▼
        │ ✅ ALLOW WRITE         ❌ DENY WRITE
        │    │                         │
        ▼    │                         │
    ┌──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ Everyone Can Read Files      │
│ (Public Access)              │
│ ✅ ALLOW READ                │
└──────────────────────────────┘
        │
        ▼
    ┌──────────────────────┐
    │ Serve File Download  │
    │ URL is valid for     │
    │ ~1 hour              │
    └──────────────────────┘
```

## Component Hierarchy

```
App
│
└─ Layout
   │
   └─ Admin Page
      │
      ├─ Analytics Section
      │  └─ Content Table
      │     ├─ View Button
      │     ├─ Edit Button
      │     └─ Delete Button
      │
      ├─ Category Management
      │  ├─ Category List
      │  └─ Add Category Form
      │
      └─ Content Form
         │
         ├─ Basic Info Section
         │  ├─ Title Input
         │  ├─ Category Select
         │  ├─ Description Textarea
         │  │
         │  └─ Thumbnail Section
         │     ├─ URL Input
         │     └─ FileUploadButton ⭐ NEW
         │        ├─ Drag & Drop Zone
         │        ├─ File Input
         │        └─ Loading State
         │
         ├─ Resources Section ⭐ UPDATED
         │  │
         │  └─ Resource Item (Multiple)
         │     ├─ Label Input
         │     ├─ URL Input
         │     └─ FileUploadButton ⭐ NEW
         │        ├─ Upload Handler
         │        └─ Loading State
         │
         └─ Submit Button
            └─ Publish/Update Content
```

## Firebase Integration Points

```
┌─────────────────────────────────────────────────────────┐
│          src/utils/firebase.ts                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  import { getStorage } from 'firebase/storage' ⭐ NEW │
│                                                         │
│  export const storage = getStorage(app)          ⭐ NEW│
│                                                         │
│  Used in:                                               │
│  • handleFileUpload()                                   │
│  • handleThumbnailUpload()                              │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │  Firebase Storage SDK        │
         ├──────────────────────────────┤
         │ • uploadBytes()              │
         │ • getDownloadURL()           │
         │ • ref()                      │
         └──────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │  Firebase Storage Bucket     │
         │  ram-studios-vault           │
         └──────────────────────────────┘
```

## State Management

```
Admin Component State:

const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  ├─ Purpose: Show "Uploading..." status
  └─ Used in: FileUploadButton component

const [uploadingFiles, setUploadingFiles] = useState({})
  ├─ Purpose: Track upload status per resource index
  ├─ Example: { 0: false, 1: true, 2: false }
  └─ Used in: Individual upload buttons in resources

Form Validation (via react-hook-form):
  ├─ thumbnailUrl: Required
  ├─ resources[].label: Required
  ├─ resources[].url: Required (auto-filled after upload)
  └─ Shows error messages if validation fails
```

---

## Summary

- **Admin** uploads file via UI
- **FileUploadButton** component handles selection
- **Admin.tsx** sends file to Firebase Storage
- **Firebase Storage** stores file and generates URL
- **URL** is automatically inserted into form
- **Admin** publishes content to Firestore (with URL)
- **Public** can download files using the URL
- **Security Rules** ensure only authorized uploads

This architecture provides:
✅ Secure file storage
✅ Public file distribution
✅ Admin-controlled uploads
✅ Automatic URL management
✅ Firebase best practices
