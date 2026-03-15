# 🚀 Quick Setup Reference

## Firebase Storage Setup (5 Minutes)

### Step 1: Enable Storage
```
Firebase Console > ram-studios-vault > Build > Storage > Get Started
→ Region: us-central1 (or match Firestore)
→ Accept rules
```

### Step 2: Update Rules
Go to **Storage > Rules** and update:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null;
    }
    match /thumbnails/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /files/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Test
Admin Dashboard → Click Upload buttons → Select files → Verify URLs appear

## File Locations in Storage

```
thumbnails/        ← Course thumbnails go here
files/             ← PDFs, ZIPs, resources go here
```

## Admin Panel Usage

### Upload Thumbnail
```
Admin Panel → Thumbnail URL field → Click "Upload" → Select image
```

### Upload Resource File
```
Admin Panel → Resources section → Click "Upload" next to URL → Select file
```

## URLs You'll Get

```
Thumbnail: https://firebasestorage.googleapis.com/v0/b/ram-studios-vault.firebasestorage.app/o/thumbnails/1705000000000_course.jpg?...

Resource:  https://firebasestorage.googleapis.com/v0/b/ram-studios-vault.firebasestorage.app/o/files/1705000001000_course.pdf?...
```

## Security Rules Summary

| Who | Can | To What |
|-----|-----|---------|
| Anyone | Read | thumbnails/, files/ |
| Logged-in Users | Write | thumbnails/, files/ |
| Others | Nothing | Everything else |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Upload button missing | Not logged in, or Storage not enabled |
| Permission denied | Storage rules not published, or user not in Auth |
| No URL appears | Check browser console (F12) for errors |
| File won't download | Check file exists in Storage console |

## Important Files

- Admin Upload: `src/pages/Admin.tsx`
- Firebase Config: `src/utils/firebase.ts`
- Storage Rules: `storage.rules`
- Full Guide: `FIREBASE_GUIDE.md`

## Next Steps

1. ✅ Enable Storage in Firebase Console
2. ✅ Copy storage rules (update your email if needed)
3. ✅ Test upload in admin panel
4. ✅ Start uploading your course materials!

---

**Storage Bucket**: `ram-studios-vault.firebasestorage.app`
**Status**: Ready to use after Storage is enabled in Firebase
