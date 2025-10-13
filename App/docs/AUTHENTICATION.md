# Authentication System Documentation

## Overview

The LifeMeter app uses a comprehensive authentication system built on React Context, providing secure user
authentication, session management, and state synchronization across the application.

## Architecture

### Core Components

```
┌─────────────────────────────────────────┐
│          App (index.tsx)                │
│  ┌───────────────────────────────────┐  │
│  │      AuthProvider                 │  │
│  │  - Manages auth state             │  │
│  │  - Handles auth operations        │  │
│  │  - Provides auth context          │  │
│  │                                   │  │
│  │  Uses: authService                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ├─── AuthContext (user, session, loading)
                    │
        ┌───────────┴────────────┐
        │                        │
   ┌────▼────┐            ┌──────▼──────┐
   │  Auth   │            │    Home     │
   │ Screens │            │   Screen    │
   └─────────┘            └─────────────┘
```

### File Structure

- **`src/contexts/AuthContext.tsx`** - Authentication context provider and hook
- **`src/services/auth.service.ts`** - API service for authentication operations
- **`src/types.ts`** - TypeScript interfaces for User, Session, and AuthContext
- **`src/screens/auth/`** - Authentication-related screens

## AuthContext

### State Management

The `AuthContext` manages three primary pieces of state:

```typescript
interface AuthContextType {
  user: User | null;          // Current authenticated user
  session: Session | null;    // Current session information
  loading: boolean;           // Loading state for async operations
  signUp: (...) => Promise<void>;
  signIn: (...) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### User Object

```typescript
interface User {
  id: string;                  // Unique user identifier
  name: string;                // User's display name
  email: string;               // User's email address
  emailVerified: boolean;      // Email verification status
  image: string;               // Profile image URL
  createdAt: string;           // Account creation timestamp
  updatedAt: string;           // Last update timestamp
  role: string;                // User role (e.g., 'user', 'admin')
  banned: boolean;             // Account ban status
  banReason: string;           // Reason for ban (if applicable)
  banExpires: string;          // Ban expiration date (if applicable)
  lastLoginMethod: string;     // Last authentication method used
  normalizedEmail: string;     // Normalized email for case-insensitive lookup
}
```

### Session Object

```typescript
interface Session {
  id: string;                  // Unique session identifier
  expiresAt: string;           // Session expiration timestamp
  token: string;               // Session token
  createdAt: string;           // Session creation timestamp
  updatedAt: string;           // Last session update timestamp
  ipAddress: string;           // IP address of session origin
  userAgent: string;           // User agent string
  userId: string;              // Associated user ID
  impersonatedBy: string;      // Admin impersonation identifier (if applicable)
}
```

## Authentication Flow

### 1. Application Initialization

```
App Start → AuthProvider mounts
    ↓
Initialize Auth (useEffect)
    ↓
Call authService.getSession()
    ↓
If session exists:
    - Set user state
    - Set session state
    ↓
Set loading = false
    ↓
Render NavigationContainer
    - If user exists → Show "home" screen
    - If no user → Show "auth" screen
```

### 2. Sign Up Flow

```
User fills signup form
    ↓
Call signUp(email, password, name, rememberMe)
    ↓
Set loading = true
    ↓
authService.signUp() → POST /api/auth/sign-up/email
    ↓
On success:
    - Call refreshSession()
    - Fetch complete session data
    - Update user and session state
    ↓
Set loading = false
    ↓
Navigation automatically switches to "home" screen
```

**Implementation:**

```typescript
const { signUp } = useAuth();

const handleSignUp = async () => {
  try {
    await signUp(email, password, name, true);
    toast('Successfully signed up!', 'success');
  } catch (error) {
    console.error(error);
    toast('Failed to sign up', 'destructive');
  }
};
```

### 3. Sign In Flow

```
User fills login form
    ↓
Call signIn(email, password, callbackURL?, rememberMe?)
    ↓
Set loading = true
    ↓
authService.signIn() → POST /api/auth/sign-in/email
    ↓
On success:
    - Call refreshSession()
    - Fetch complete session data
    - Update user and session state
    ↓
Set loading = false
    ↓
Navigation automatically switches to "home" screen
```

**Implementation:**

```typescript
const { signIn } = useAuth();

const handleLogIn = async () => {
  try {
    await signIn(email, password, undefined, true);
    toast('Successfully logged in!', 'success');
  } catch (error) {
    console.error(error);
    toast('Failed to log in', 'destructive');
  }
};
```

### 4. Sign Out Flow

```
User clicks logout
    ↓
Call signOut()
    ↓
Set loading = true
    ↓
authService.signOut() → POST /api/auth/sign-out
    ↓
On success:
    - Set user = null
    - Set session = null
    ↓
Set loading = false
    ↓
Navigation automatically switches to "auth" screen
```

**Implementation:**

```typescript
const { signOut } = useAuth();

const handleLogout = async () => {
  try {
    await signOut();
    toast('Successfully logged out!', 'success');
  } catch (error) {
    console.error(error);
    toast('Failed to log out', 'destructive');
  }
};
```

### 5. Session Refresh

```
Call refreshSession()
    ↓
authService.getSession() → GET /api/auth/get-session
    ↓
If session valid:
    - Update user state
    - Update session state
Else:
    - Set user = null
    - Set session = null
```

## AuthService API

The `authService` provides low-level API methods for authentication operations. All methods use `credentials: 'include'`
to handle HTTP-only cookies for session management.

### Core Methods

#### `signUp(email, password, name?, rememberMe?)`

Creates a new user account.

**Parameters:**

- `email: string` - User's email address
- `password: string` - User's password
- `name?: string` - User's display name (optional)
- `rememberMe?: boolean` - Whether to persist the session (optional)

**Returns:** `Promise<void>`

**API Endpoint:** `POST /api/auth/sign-up/email`

---

#### `signIn(email, password, callbackURL?, rememberMe?)`

Authenticates a user and creates a session.

**Parameters:**

- `email: string` - User's email address
- `password: string` - User's password
- `callbackURL?: string` - URL to redirect after login (optional)
- `rememberMe?: boolean` - Whether to persist the session (optional)

**Returns:** `Promise<{ redirect: boolean; token: string; url: string | null; user: any }>`

**API Endpoint:** `POST /api/auth/sign-in/email`

---

#### `getSession()`

Retrieves the current session information.

**Returns:** `Promise<{ session: Session; user: User } | null>`

**API Endpoint:** `GET /api/auth/get-session`

**Note:** Returns `null` if no valid session exists (401 response).

---

#### `signOut()`

Terminates the current session.

**Returns:** `Promise<void>`

**API Endpoint:** `POST /api/auth/sign-out`

---

### Additional Methods

The service includes many other methods for advanced functionality:

- **Password Management:** `forgetPassword()`, `resetPassword()`, `changePassword()`
- **Email Management:** `verifyEmail()`, `sendVerificationEmail()`, `changeEmail()`
- **User Management:** `updateUser()`, `deleteUser()`
- **Session Management:** `listSessions()`, `revokeSession()`, `revokeSessions()`, `revokeOtherSessions()`
- **Social Authentication:** `linkSocial()`, `listAccounts()`, `unlinkAccount()`
- **Token Management:** `refreshToken()`, `getAccessToken()`, `getAccountInfo()`
- **System:** `checkApiStatus()`, `getError()`

Refer to the `auth.service.ts` file for detailed signatures and documentation.

## Usage Examples

### Basic Setup in a Component

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, session, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!user) {
    return <Text>Please log in</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user.name}!</Text>
      <Button onPress={signOut} label="Logout" />
    </View>
  );
}
```

### Protected Content

```typescript
function ProfileScreen() {
  const { user } = useAuth();

  // Always check if user exists before rendering protected content
  if (!user) {
    return <Text>Access denied</Text>;
  }

  return (
    <View>
      <Text>User ID: {user.id}</Text>
      <Text>Email: {user.email}</Text>
      <Text>Role: {user.role}</Text>
    </View>
  );
}
```

### Checking Auth State

```typescript
const { user, loading } = useAuth();

// Check if authenticated
const isAuthenticated = !loading && user !== null;

// Check if email is verified
const isEmailVerified = user?.emailVerified === true;

// Check if user is banned
const isBanned = user?.banned === true;

// Check user role
const isAdmin = user?.role === 'admin';
```

### Manual Session Refresh

```typescript
const { refreshSession } = useAuth();

// Manually refresh the session (e.g., after long inactivity)
const checkSession = async () => {
  try {
    await refreshSession();
  } catch (error) {
    console.error('Session refresh failed:', error);
  }
};
```

## Security Considerations

### Cookie-Based Sessions

- All authentication requests use `credentials: 'include'`
- Sessions are managed via HTTP-only cookies
- Cookies are set and managed by the backend server

### Token Handling

- Session tokens are never stored in localStorage or AsyncStorage
- Tokens are automatically included in cookies for API requests

### Loading States

- Always show a loading state while authentication is in progress
- Prevents race conditions and UI flicker

### Error Handling

- All auth operations are wrapped in try-catch blocks
- Errors are logged to console for debugging
- User-friendly error messages are shown via toast notifications

## Best Practices

### 1. Always Check Loading State

```typescript
const { user, loading } = useAuth();

if (loading) {
  return <LoadingScreen />;
}

// Now safe to check user
if (user) {
  // Render authenticated content
}
```

### 2. Use Try-Catch for Auth Operations

```typescript
try {
  await signIn(email, password);
  // Success handling
} catch (error) {
  // Error handling
  console.error(error);
  showErrorMessage();
}
```

### 3. Don't Store Sensitive Data

```typescript
// ❌ Don't do this
AsyncStorage.setItem('userPassword', password);

// ✅ Do this - let the context manage auth state
const { user } = useAuth();
```

### 4. Handle Session Expiration

```typescript
// The context automatically handles session expiration
// When a session expires, user and session will be set to null
const { user } = useAuth();

if (!user) {
  // Redirect to login or show auth screen
}
```

## Troubleshooting

### Issue: User Not Persisting After Login

**Solution:** Ensure the API is setting cookies correctly and `credentials: 'include'` is used in all requests.

### Issue: Session Lost on App Restart

**Solution:** Check that `rememberMe` is set to `true` during sign-in/sign-up for persistent sessions.

### Issue: Auth State Not Updating

**Solution:** Always use the `useAuth()` hook to access auth state. Don't try to access the context directly.

### Issue: CORS Errors

**Solution:** Ensure the API server allows credentials and has proper CORS configuration:

```javascript
// Backend CORS config
{
  credentials: true,
  origin: 'your-app-url'
}
```

## Testing Authentication

### Test Authentication Flow

```typescript
// In your test
const mockAuth = {
  user: { id: '1', name: 'Test User', email: 'test@example.com' },
  session: null,
  loading: false,
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  refreshSession: jest.fn(),
};

// Wrap component with mock context
<AuthContext.Provider value={mockAuth}>
  <YourComponent />
</AuthContext.Provider>
```

## API Environment Configuration

The authentication service uses the `EXPO_PUBLIC_API_URL` environment variable:

```bash
# .env file
EXPO_PUBLIC_API_URL=https://your-api-server.com
```

If not set, it defaults to `http://localhost:3000`.