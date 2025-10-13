# Navigation System Documentation

## Overview

The LifeMeter app implements a custom tab-based navigation system with stack navigation per tab. This provides a native
mobile app experience with independent navigation stacks for each tab and sophisticated Android back button handling.

## Architecture

### Core Components

```
┌────────────────────────────────────────────────┐
│          App (index.tsx)                       │
│  ┌──────────────────────────────────────────┐  │
│  │      NavigationProvider                  │  │
│  │  - Manages active tab                    │  │
│  │  - Maintains navigation stacks per tab   │  │
│  │  - Provides navigation methods           │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                    │
                    ├─── NavigationContext
                    │
        ┌───────────┴────────────┐
        │                        │
   ┌────▼─────────┐      ┌───────▼──────┐
   │ Navigation   │      │   Screens    │
   │  Container   │      │  (Registry)  │
   └──────────────┘      └──────────────┘
```

### File Structure

- **`src/contexts/NavigationContext.tsx`** - Navigation context provider and hook
- **`src/navigation/NavigationContainer.tsx`** - Container that renders the current screen
- **`src/navigation/ScreenRegistry.tsx`** - Registry of all available screens
- **`src/navigation/ScreenWrapper.tsx`** - Wrapper component for screens with back button
- **`src/lib/useBackHandler.ts`** - Android back button handler
- **`src/types.ts`** - TypeScript interfaces for navigation types

## Navigation Concepts

### Tabs

Each tab represents a top-level navigation section with its own independent stack.

```typescript
interface Tab {
    id: string;         // Unique identifier
    name: string;       // Display name
    icon?: string;      // Optional icon (not currently used)
    badge?: number;     // Optional badge count (not currently used)
}
```

**Current tabs:**

```typescript
const tabs: Tab[] = [
    {id: 'home', name: 'Home'},
    {id: 'profile', name: 'Profile'}
];
```

### Navigation Items

Navigation items represent screens that can be pushed onto a tab's stack.

```typescript
interface NavigationItem {
    id: string;                           // Screen identifier (must match ScreenRegistry)
    name: string;                         // Screen display name
    component?: React.ReactElement;       // Optional custom component
    params?: Record<string, unknown>;     // Optional parameters (not currently used)
}
```

### Navigation Stacks

Each tab maintains its own navigation stack:

```
Tab: Home                    Tab: Profile
┌──────────────┐            ┌──────────────┐
│  Settings    │ ← Top      │   (empty)    │
├──────────────┤            └──────────────┘
│  Profile     │
├──────────────┤
│  (Home Root) │ ← Base
└──────────────┘
```

## NavigationContext API

### State Properties

```typescript
interface NavigationContextType {
    tabs: Tab[];                  // Array of all tabs
    activeTabIndex: number;       // Index of currently active tab
    activeTab: Tab;               // Currently active tab object

    // Navigation methods
    switchTab: (index: number) => Tab | null;
    setActiveTabById: (id: string) => Tab | null;
    navigate: (item: NavigationItem) => void;
    goBack: () => NavigationItem | null;
    canGoBack: () => boolean;
    getCurrentScreen: () => NavigationItem | null;
    replace: (item: NavigationItem) => void;
    clearStack: () => void;
    isOnHomeTab: () => boolean;
}
```

### Methods

#### `switchTab(index: number)`

Switches to a tab by index.

**Parameters:**

- `index: number` - Zero-based tab index

**Returns:** `Tab | null` - The switched-to tab, or null if index is invalid

**Example:**

```typescript
const {switchTab} = useNavigation();

// Switch to first tab (home)
switchTab(0);

// Switch to second tab (profile)
switchTab(1);
```

---

#### `setActiveTabById(id: string)`

Switches to a tab by its ID.

**Parameters:**

- `id: string` - Tab identifier

**Returns:** `Tab | null` - The switched-to tab, or null if not found

**Example:**

```typescript
const {setActiveTabById} = useNavigation();

// Switch to home tab
setActiveTabById('home');

// Switch to profile tab
setActiveTabById('profile');
```

---

#### `navigate(item: NavigationItem)`

Pushes a new screen onto the current tab's navigation stack.

**Parameters:**

- `item: NavigationItem` - The navigation item to push

**Example:**

```typescript
const {navigate} = useNavigation();

// Navigate to login screen
navigate({
    id: 'login',
    name: 'Login'
});

// Navigate with parameters (future feature)
navigate({
    id: 'profile',
    name: 'User Profile',
    params: {userId: '123'}
});
```

---

#### `goBack()`

Pops the top screen from the current tab's navigation stack.

**Returns:** `NavigationItem | null` - The new top screen, or null if stack is empty

**Example:**

```typescript
const {goBack, canGoBack} = useNavigation();

if (canGoBack()) {
    goBack();
}
```

---

#### `canGoBack()`

Checks if the current tab has screens on its stack.

**Returns:** `boolean` - True if stack has screens, false otherwise

**Example:**

```typescript
const {canGoBack} = useNavigation();

const showBackButton = canGoBack();
```

---

#### `getCurrentScreen()`

Gets the current screen from the top of the stack.

**Returns:** `NavigationItem | null` - Current screen or null if at root

**Example:**

```typescript
const {getCurrentScreen} = useNavigation();

const current = getCurrentScreen();
if (current) {
    console.log('Current screen:', current.name);
} else {
    console.log('At root screen');
}
```

---

#### `replace(item: NavigationItem)`

Replaces the current screen with a new one (doesn't grow the stack).

**Parameters:**

- `item: NavigationItem` - The navigation item to replace with

**Example:**

```typescript
const {replace} = useNavigation();

// Replace login with signup
replace({
    id: 'signup',
    name: 'Sign Up'
});
```

---

#### `clearStack()`

Clears all screens from the current tab's stack, returning to root.

**Example:**

```typescript
const {clearStack} = useNavigation();

// Clear navigation stack
clearStack();
```

---

#### `isOnHomeTab()`

Checks if the currently active tab is the home tab (index 0).

**Returns:** `boolean` - True if on home tab, false otherwise

**Example:**

```typescript
const {isOnHomeTab} = useNavigation();

if (isOnHomeTab()) {
    console.log('User is on home tab');
}
```

## Navigation Flow Examples

### 1. Basic Navigation

```
Initial State:
  Home Tab (Stack: [])
  
User clicks "Settings":
  navigate({ id: 'settings', name: 'Settings' })
  Home Tab (Stack: [Settings])
  
User clicks Back:
  goBack()
  Home Tab (Stack: [])
```

### 2. Multi-Level Navigation

```
Initial State:
  Home Tab (Stack: [])
  
Navigate to Profile:
  navigate({ id: 'profile', name: 'Profile' })
  Home Tab (Stack: [Profile])
  
Navigate to Settings:
  navigate({ id: 'settings', name: 'Settings' })
  Home Tab (Stack: [Profile, Settings])
  
Go Back:
  goBack()
  Home Tab (Stack: [Profile])
  
Go Back Again:
  goBack()
  Home Tab (Stack: [])
```

### 3. Tab Switching

```
Initial State:
  Home Tab (Stack: [Settings])
  Active: Home
  
Switch to Profile Tab:
  switchTab(1)
  Profile Tab (Stack: [])
  Active: Profile
  
Switch back to Home:
  switchTab(0)
  Home Tab (Stack: [Settings])  ← Stack preserved!
  Active: Home
```

## Screen Registry

The `ScreenRegistry` maps screen IDs to React components.

```typescript
export type ScreenId = 'home' | 'auth' | 'login' | 'signup' | 'profile';

export const ScreenRegistry: Record<ScreenId, React.ComponentType> = {
    home: HomeScreen,
    auth: AuthScreen,
    login: LogInScreen,
    signup: SignUpScreen,
    profile: () => null, // TODO: Implement profile screen
};
```

### Adding a New Screen

1. **Create the screen component:**

```typescript
// src/screens/SettingsScreen.tsx
function SettingsScreen() {
    return (
        <ScreenWrapper>
            <View>
                <Text>Settings < /Text>
        < /View>
        < /ScreenWrapper>
    );
}

export default SettingsScreen;
```

2. **Register the screen:**

```typescript
// src/navigation/ScreenRegistry.tsx
import SettingsScreen from '@/screens/SettingsScreen';

export type ScreenId = 'home' | 'auth' | 'login' | 'signup' | 'profile' | 'settings';

export const ScreenRegistry: Record<ScreenId, React.ComponentType> = {
    // ... existing screens
    settings: SettingsScreen,
};
```

3. **Navigate to the screen:**

```typescript
const {navigate} = useNavigation();

navigate({
    id: 'settings',
    name: 'Settings'
});
```

## ScreenWrapper Component

The `ScreenWrapper` provides common functionality for screens.

```typescript
interface ScreenWrapperProps {
    children: ReactNode;
    showBackButton?: boolean;  // Default: true
}
```

### Usage

```typescript
import {ScreenWrapper} from '@/navigation/ScreenWrapper';

function MyScreen() {
    return (
        <ScreenWrapper showBackButton = {true} >
            <View>
                {/* Your screen content */}
            < /View>
            < /ScreenWrapper>
    );
}
```

### Features

- **Automatic back button:** Shows a back button if `canGoBack()` is true
- **Consistent layout:** Wraps content in a flex container
- **Optional back button:** Can be disabled with `showBackButton={false}`

## Android Back Button Handling

The `useBackHandler` hook provides sophisticated back button behavior.

### Behavior Flow

```
User presses back button:
  ↓
Is there a navigation stack?
  YES → Pop from stack (goBack)
  NO → Continue
      ↓
Is user on home tab?
  NO → Switch to home tab
  YES → Continue
      ↓
Has user pressed back recently? (within 2s)
  YES → Exit app
  NO → Show "Press back again to exit" and wait
```

### Implementation

```typescript
interface UseBackHandlerOptions {
    onExitPrompt?: () => void;  // Called on first back press at home
}

export function useBackHandler(options?: UseBackHandlerOptions);
```

### Usage

```typescript
import {useBackHandler} from '@/lib/useBackHandler';
import {useToast} from '@/components/ui/Toast';

function App() {
    const {toast} = useToast();

    useBackHandler({
        onExitPrompt: () => {
            toast('Press back again to exit', 'info', 2000);
        }
    });

    // ... rest of app
}
```

### Features

- **Stack-aware:** Respects navigation stacks
- **Tab-aware:** Returns to home tab before exiting
- **Double-tap to exit:** Requires confirmation before exiting app
- **Timeout:** Exit confirmation expires after 2 seconds
- **Cleanup:** Properly cleans up timers on unmount

## Navigation Container

The `NavigationContainer` renders the appropriate screen based on navigation state.

### Logic

```typescript
const currentScreen = getCurrentScreen();
const screenId = currentScreen ? currentScreen.id : rootScreenId;
const ScreenComponent = getScreenComponent(screenId);
```

### Root Screen Selection

The root screen is determined by authentication state:

```typescript
<NavigationContainer rootScreenId = {user ? "home" : "auth"}
/>
```

- **Authenticated:** Shows `home` screen
- **Not authenticated:** Shows `auth` screen

## Usage Examples

### Basic Navigation

```typescript
import {useNavigation} from '@/contexts/NavigationContext';

function HomeScreen() {
    const {navigate} = useNavigation();

    return (
        <View>
            <Button
                label = "Go to Settings"
    onPress = {()
=>
    navigate({
        id: 'settings',
        name: 'Settings'
    })
}
    />
    < /View>
)
    ;
}
```

### Back Navigation

```typescript
function SettingsScreen() {
    const {goBack, canGoBack} = useNavigation();

    return (
        <View>
            {canGoBack() && (
            <Button
                label = "Back"
    onPress = {()
=>
    goBack()
}
    />
)
}
    {/* Settings content */
    }
    </View>
)
    ;
}
```

### Tab Switching

```typescript
function TabBar() {
    const {tabs, activeTabIndex, switchTab} = useNavigation();

    return (
        <View>
            {
                tabs.map((tab, index) => (
                    <Button
                        key = {tab.id}
                label = {tab.name}
                onPress = {()
=>
    switchTab(index)
}
    variant = {activeTabIndex === index ? 'default' : 'ghost'
}
    />
))
}
    </View>
)
    ;
}
```

### Conditional Navigation

```typescript
function ProfileButton() {
    const {navigate} = useNavigation();
    const {user} = useAuth();

    const handlePress = () => {
        if (!user) {
            navigate({id: 'login', name: 'Login'});
        } else {
            navigate({id: 'profile', name: 'Profile'});
        }
    };

    return <Button label = "Profile"
    onPress = {handlePress}
    />;
}
```

### Replace Navigation

```typescript
function LoginScreen() {
    const {replace} = useNavigation();

    const switchToSignup = () => {
        // Replace login with signup (doesn't grow stack)
        replace({id: 'signup', name: 'Sign Up'});
    };

    return (
        <View>
            {/* Login form */}
        < Button
    label = "Create Account"
    onPress = {switchToSignup}
    />
    < /View>
)
    ;
}
```

### Clear Stack

```typescript
function LogoutButton() {
    const {clearStack, signOut} = useAuth();

    const handleLogout = async () => {
        await signOut();
        clearStack(); // Clear navigation history
    };

    return <Button label = "Logout"
    onPress = {handleLogout}
    />;
}
```

## Best Practices

### 1. Always Use ScreenWrapper

```typescript
// ✅ Good
function MyScreen() {
    return (
        <ScreenWrapper>
            <View>{/* content */} < /View>
        < /ScreenWrapper>
    );
}

// ❌ Avoid
function MyScreen() {
    return <View>{/* content */} < /View>;
}
```

### 2. Check canGoBack Before Calling goBack

```typescript
// ✅ Good
const {goBack, canGoBack} = useNavigation();
if (canGoBack()) {
    goBack();
}

// ❌ Avoid (may do nothing)
goBack();
```

### 3. Use Replace for Login/Signup Flow

```typescript
// ✅ Good - Prevents going back to login after signup
replace({id: 'home', name: 'Home'});

// ❌ Avoid - User can go back to login screen
navigate({id: 'home', name: 'Home'});
```

### 4. Clear Stack on Logout

```typescript
// ✅ Good
const handleLogout = async () => {
    await signOut();
    clearStack();
};

// ❌ Avoid - Leaves navigation history
const handleLogout = async () => {
    await signOut();
};
```

### 5. Validate Screen IDs

```typescript
// ✅ Good - Type-safe
navigate({id: 'settings' as ScreenId, name: 'Settings'});

// ❌ Avoid - May cause runtime errors
navigate({id: 'non-existent-screen', name: 'Unknown'});
```

## Troubleshooting

### Issue: Screen Not Rendering

**Cause:** Screen ID doesn't exist in ScreenRegistry

**Solution:** Check that the screen is registered:

```typescript
console.log(ScreenRegistry['your-screen-id']); // Should not be undefined
```

### Issue: Back Button Not Working

**Cause:** Screen not wrapped in ScreenWrapper or ScreenWrapper has `showBackButton={false}`

**Solution:** Wrap screen in ScreenWrapper:

```typescript
<ScreenWrapper showBackButton = {true} >
    {/* content */}
    < /ScreenWrapper>
```

### Issue: Navigation Stack Not Clearing

**Cause:** Forgot to call `clearStack()` after logout or reset

**Solution:** Always clear stack when resetting app state:

```typescript
await signOut();
clearStack();
```

### Issue: Tab Switch Not Working

**Cause:** Invalid tab index or ID

**Solution:** Check that the tab exists:

```typescript
console.log('Tabs:', tabs);
console.log('Active:', activeTabIndex);
```

## Future Enhancements

### Navigation Parameters

Currently, the `params` field in `NavigationItem` is not used. Future implementation could pass data between screens:

```typescript
// Future feature
navigate({
    id: 'profile',
    name: 'Profile',
    params: {userId: '123'}
});

// In ProfileScreen
const {getCurrentScreen} = useNavigation();
const userId = getCurrentScreen()?.params?.userId;
```

### Navigation Guards

Implement guards to prevent navigation or show confirmations:

```typescript
// Future feature
const canLeave = await confirmUnsavedChanges();
if (canLeave) {
    goBack();
}
```

### Deep Linking

Support for deep links to navigate to specific screens:

```typescript
// Future feature
Linking.getInitialURL().then(url => {
    if (url) {
        navigateFromDeepLink(url);
    }
});
```
