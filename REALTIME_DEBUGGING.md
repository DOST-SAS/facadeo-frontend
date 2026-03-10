# Real-time Facade Display Debugging Guide

## Issues Fixed

### 1. Missing Fields in Realtime Fetch
**Problem**: The `fetchFacadeById` method wasn't fetching all required fields, especially `facade_number` and `types`.

**Solution**: Updated the query to explicitly fetch all fields needed by the Facade type.

### 2. Type Conversion Error
**Problem**: Supabase returns the business relation as an array, but the Facade type expects a single Business object.

**Solution**: Added proper type transformation to handle the array-to-object conversion.

### 3. Insufficient Logging
**Problem**: Hard to debug what's happening with realtime subscriptions.

**Solution**: Added comprehensive logging throughout the realtime service and component.

## How to Test

### 1. Open Browser Console
Open the browser developer tools (F12) and go to the Console tab.

### 2. Navigate to a Scan Result Page
Go to a scan that is currently running or about to run.

### 3. Check for Subscription Logs
You should see logs like:
```
[ResultScan] Setting up realtime subscriptions for scan: <scan-id>
[Realtime] Setting up subscription for scan: <scan-id>
[Realtime] Facades subscription status: SUBSCRIBED
[Realtime] ✅ Successfully subscribed to scan_facades changes
```

### 4. When a New Facade is Detected
You should see:
```
[Realtime] New scan_facade detected: {...}
[Realtime] Fetching facade data for: <facade-id>
[Realtime] Facade fetched successfully: {...}
[ResultScan] Facade update received: {...}
[ResultScan] Adding new facade to list
[ResultScan] Updated facades count: X
```

### 5. Check for Errors
If you see any of these, there's an issue:
- `[Realtime] ❌ Channel error` - Realtime might not be enabled in Supabase
- `[Realtime] ❌ Subscription timed out` - Network or configuration issue
- `[Realtime] Failed to fetch facade data` - Database query issue

## Common Issues

### Realtime Not Enabled in Supabase
1. Go to your Supabase Dashboard
2. Navigate to Database → Replication
3. Ensure `scan_facades` table has replication enabled
4. Check that the `facades` table is also accessible

### Network/CORS Issues
- Check browser console for CORS errors
- Verify Supabase URL and keys in `.env` file

### Database Permissions
- Ensure the authenticated user has SELECT permission on:
  - `scan_facades` table
  - `facades` table
  - `businesses_cache` table

## Manual Testing

To manually test if realtime is working, you can insert a test record:

```sql
-- In Supabase SQL Editor
INSERT INTO scan_facades (scan_id, facade_id)
VALUES (
  '<your-scan-id>',
  '<existing-facade-id>'
);
```

You should immediately see the facade appear in the UI and logs in the console.

## Next Steps if Still Not Working

1. **Check Supabase Realtime Status**
   - Go to Supabase Dashboard → Settings → API
   - Verify Realtime is enabled

2. **Check Table Permissions**
   ```sql
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename IN ('scan_facades', 'facades', 'businesses_cache');
   ```

3. **Test with Supabase Client Directly**
   ```javascript
   // In browser console
   const channel = supabase
     .channel('test')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'scan_facades'
     }, (payload) => console.log('Change received!', payload))
     .subscribe()
   ```

4. **Check Network Tab**
   - Look for WebSocket connections to Supabase
   - Should see `wss://` connections being established
