# Keycloak Setup Guide

Complete guide for configuring Keycloak for DocuForms.

## Initial Setup

1. Access Keycloak Admin Console: **http://localhost:8080**
2. Login with admin credentials:
   - Username: `admin` (or from `.env` as `KEYCLOAK_ADMIN`)
   - Password: `changeme` (or from `.env` as `KEYCLOAK_PASSWORD`)

## Create Realm

1. Click on the realm dropdown (top left, shows "master")
2. Click **"Create Realm"**
3. Enter realm name: `docuforms` (or your `KEYCLOAK_REALM` value)
4. Click **"Create"**

## Create Client

1. In the left sidebar, go to **"Clients"**
2. Click **"Create client"**
3. **General Settings**:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `docuforms-client` (or your `KEYCLOAK_CLIENT_ID` value)
   - Click **"Next"**

4. **Capability config**:
   - **Client authentication**: `Off` (Public client)
   - **Authorization**: `Off` (unless you need it)
   - **Standard flow**: `On` (for authorization code flow)
   - **Direct access grants**: `On` (for username/password login)
   - Click **"Next"**

5. **Login settings** - **IMPORTANT**: Configure these values:

   ### For Local Development:

   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid redirect URIs**: 
     ```
     http://localhost:3000
     http://localhost:3000/*
     ```
     > **Important**: Add both the exact URI (`http://localhost:3000`) and the wildcard pattern (`http://localhost:3000/*`) to ensure compatibility.
   - **Valid post logout redirect URIs**: 
     ```
     http://localhost:3000
     http://localhost:3000/*
     ```
   - **Web origins**: 
     ```
     http://localhost:3000
     ```

   ### For Production:

   - **Root URL**: `https://yourdomain.com`
   - **Home URL**: `https://yourdomain.com`
   - **Valid redirect URIs**: 
     ```
     https://yourdomain.com/*
     ```
   - **Valid post logout redirect URIs**: 
     ```
     https://yourdomain.com/*
     ```
   - **Web origins**: 
     ```
     https://yourdomain.com
     ```

6. Click **"Save"**

## Create Groups

1. In the left sidebar, go to **"Groups"**
2. Click **"Create group"**
3. Create two groups:
   - **Users** (default group for regular users)
   - **Admins** (for admin users)

## Configure Group Mappings (Optional)

To make groups available in tokens, you need to configure a group mapper. In Keycloak v17+ (latest), mappers are configured via **Client Scopes**:

### Step 1: Check for Existing "groups" Client Scope

1. In the left sidebar, go to **"Client scopes"**
2. Look for a scope named **"groups"** in the list
3. If it exists, skip to Step 3. If not, continue to Step 2.

### Step 2: Create "groups" Client Scope (if needed)

1. In **"Client scopes"**, click **"Create client scope"**
2. Fill in:
   - **Name**: `groups`
   - **Type**: `Default` (this makes it available to all clients by default)
   - Click **"Save"**
3. You'll be taken to the scope configuration page

### Step 3: Add Group Membership Mapper

1. In the **"groups"** client scope page, go to the **"Mappers"** tab
2. Click **"Configure a new mapper"**
3. Select **"Group Membership"** from the **"Mapper type"** dropdown
4. Configure the mapper settings:
   - **Name**: `groups` (or any name you prefer)
   - **Token Claim Name**: `groups` (this is the key that will appear in the token)
   - **Full group path**: `Off` (this gives just the group name like `Users` or `Admins`, not the full path like `/Users`)
   - **Add to ID token**: `On`
   - **Add to access token**: `On`
   - **Add to userinfo**: `On`
5. Click **"Save"**

> **Note**: If you see **"Add predefined mapper"** and it lists "groups" or "Group Membership", you can use that instead. But if not, **"Configure a new mapper"** is the correct option.

### Step 4: Assign "groups" Scope to Client

1. Go to **"Clients"** → `docuforms-client`
2. Go to the **"Client scopes"** tab
3. Click on the **"Setup"** tab (you should see a list of currently assigned client scopes)
4. Look for a button or link that says:
   - **"Add client scope"** or
   - **"Assign client scope"** or
   - A **`+`** (plus) button or
   - An **"Add"** button
5. Click that button to open a dialog or dropdown
6. In the list that appears, find and select **"groups"**
7. Click **"Add"** or **"Save"** to assign it

**Alternative method if there's no Add button:**

If you don't see an "Add" button, the scope might need to be set as "Default" type:

1. Go back to **"Client scopes"** in the left sidebar
2. Find and click on your **"groups"** scope
3. Go to the **"Settings"** tab
4. Check the **"Type"** field:
   - If it's set to **"Optional"**, change it to **"Default"**
   - **"Default"** scopes are automatically assigned to all clients
   - Click **"Save"**
5. Go back to **"Clients"** → `docuforms-client` → **"Client scopes"** → **"Setup"** tab
6. Refresh the page - **"groups"** should now appear in the list

### Alternative: Use Built-in "groups" Scope

Some Keycloak installations have a built-in `groups` scope. Check:

1. Go to **"Client scopes"**
2. Look for **"groups"** in the list
3. If it exists, click on it and check the **"Mappers"** tab
4. If a Group Membership mapper already exists, you're done!
5. If not, add one following Step 3 above

## Create Test Users

### Create a Regular User

1. Go to **"Users"** → **"Create new user"**
2. Fill in:
   - **Username**: `testuser`
   - **Email**: `testuser@example.com`
   - **Email verified**: `On`
   - **Enabled**: `On`
3. Click **"Create"**
4. Go to **"Credentials"** tab
5. Set password (temporary: `Off` recommended for testing)
6. Click **"Set password"**
7. Go to **"Groups"** tab
8. Add user to **"Users"** group

### Create an Admin User

1. Create another user (e.g., `adminuser`)
2. Add to **"Admins"** group instead of **"Users"**

## Configuration Summary

### Client Settings (Development)

| Setting | Value |
|---------|-------|
| Client ID | `docuforms-client` |
| Client authentication | `Off` (Public) |
| Root URL | `http://localhost:3000` |
| Home URL | `http://localhost:3000` |
| Valid redirect URIs | `http://localhost:3000/*` |
| Valid post logout redirect URIs | `http://localhost:3000/*` |
| Web origins | `http://localhost:3000` |

### Environment Variables

Make sure your `.env` file matches:

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=docuforms
KEYCLOAK_CLIENT_ID=docuforms-client
```

### Frontend Configuration

In `frontend/.env`:

```bash
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=docuforms
REACT_APP_KEYCLOAK_CLIENT_ID=docuforms-client
```

## Testing the Setup

1. Start your frontend: `cd frontend && npm start`
2. Navigate to `http://localhost:3000`
3. You should be redirected to Keycloak login
4. Login with a test user
5. You should be redirected back to the app

## Troubleshooting

### Redirect URI mismatch error

- Ensure the redirect URI in the error message exactly matches one in "Valid redirect URIs"
- Use wildcard `*` at the end: `http://localhost:3000/*`
- Check for trailing slashes

### CORS errors

- Verify "Web origins" includes your frontend URL
- Check that it matches exactly (no trailing slash for base URL)
- Ensure Keycloak URL is accessible from browser

### Groups not in token

- Verify group mapper is configured
- Check that user is assigned to a group
- Verify token claim name is `groups`

### Can't login

- Check user is enabled
- Verify credentials are set
- Check user is in correct realm

## Production Considerations

For production, update:

1. **Use HTTPS** for all URLs
2. **Enable client authentication** if needed
3. **Configure proper CORS** origins
4. **Set up proper realm settings** (password policies, etc.)
5. **Configure email** for password resets
6. **Set up proper token expiration** times
7. **Use proper database** (not H2) - already configured with PostgreSQL

