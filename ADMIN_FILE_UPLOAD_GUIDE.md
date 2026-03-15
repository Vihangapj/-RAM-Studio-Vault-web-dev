# Admin Panel File Upload Guide

## Overview
The admin panel now supports file uploads directly to Firebase Storage. You can upload thumbnails and resource files without needing external hosting.

## Features Added

### 1. Thumbnail Upload
- **Location**: Admin Panel → Basic Info Section
- **Supported Formats**: JPEG, PNG, WebP, SVG, GIF
- **Process**:
  1. Click the "Upload" button next to the Thumbnail URL field
  2. Select an image from your computer
  3. The file is uploaded to Firebase Storage (`thumbnails/` folder)
  4. The download URL is automatically inserted into the form

### 2. Resource File Upload
- **Location**: Admin Panel → Resources Section
- **Supported Formats**: Any file type (PDF, ZIP, DOC, MP4, etc.)
- **Process**:
  1. Add a Resource (Label + URL)
  2. Click the "Upload" button next to the URL field
  3. Select a file from your computer
  4. The file is uploaded to Firebase Storage (`files/` folder)
  5. The download link is automatically filled in
  6. Click "Publish Content" to save

## File Upload Behavior

### What Happens During Upload?
1. File is sent to Firebase Storage
2. Storage automatically generates a secure download URL
3. The URL is inserted into the form field
4. You can edit the URL or upload another file

### File Organization
- **Thumbnails**: `thumbnails/{timestamp}_{filename}`
- **Resources**: `files/{timestamp}_{filename}`
- Timestamps prevent naming conflicts when multiple files have the same name

## Quick Workflow Example

### Adding a Course with Files

```
1. Fill in Title, Category, Description
2. Click "Upload" for Thumbnail → Select course-thumb.jpg → Auto-filled
3. Add YouTube Trailer ID
4. Click "Add Resource" 
5. Enter Label: "Course PDF"
6. Click "Upload" → Select course.pdf → URL Auto-filled
7. Add another resource: "Source Code" → Upload → source-code.zip
8. Click "Publish Content"
```

## Firebase Storage Structure

After uploading files, your Firebase Storage will look like:
```
ram-studios-vault
├── thumbnails/
│   ├── 1705000000000_course.jpg
│   ├── 1705000001000_tutorial.png
│   └── ...
└── files/
    ├── 1705000002000_course.pdf
    ├── 1705000003000_source-code.zip
    └── ...
```

## Troubleshooting

### Upload Button Not Working
- **Check**: Are you logged in as an admin?
- **Check**: Is your email in the Firebase Auth users list?
- **Check**: Is Storage enabled in Firebase Console?

### File Uploaded but URL Not Showing
- **Solution**: Check browser console (F12) for error messages
- **Solution**: Verify Firebase configuration in `.env` file
- **Solution**: Try uploading again

### Can't Access Downloaded Files
- **Check**: Storage security rules allow public read access
- **Check**: File URL starts with `https://firebasestorage.googleapis.com/`
- **Check**: File hasn't been deleted from Storage

## Security Notes

- Only authenticated admins can upload files
- All files are readable by anyone (public access for distribution)
- File names are timestamped to prevent overwrites
- Maximum file size: Limited by Firebase Storage (typically 256 MB)

## Support

For detailed Firebase Storage setup, see [FIREBASE_GUIDE.md](./FIREBASE_GUIDE.md#7-enable-firebase-storage-for-file-uploads)

## Next Steps

1. ✅ Read the FIREBASE_GUIDE.md (sections 7-10)
2. ✅ Enable Storage in Firebase Console
3. ✅ Update Storage Rules with your admin email
4. ✅ Test uploading a thumbnail
5. ✅ Test uploading a resource file
6. ✅ Verify files appear in Firebase Storage console
