import { fetchWithTimeout } from '@/lib/net';
import { Session, User } from '@/types';

class AuthService {
  private appUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  async signUp(
    email: string,
    password: string,
    name?: string,
    rememberMe?: boolean,
  ): Promise<void> {
    const response = await fetch(this.appUrl + '/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        name: name || '',
        rememberMe: rememberMe || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sign up failed: ${response.status}`);
    }
    // Endpoint returns a body, but callers don't use it. Keep return type as void for simplicity.
  }

  async signIn(
    email: string,
    password: string,
    callbackURL?: string,
    rememberMe?: boolean,
  ): Promise<{
    redirect: boolean;
    token: string;
    url: string | null;
    user: any;
  }> {
    const body: any = {
      email,
      password,
    };

    if (callbackURL !== undefined) {
      body.callbackURL = callbackURL;
    }
    if (rememberMe !== undefined) {
      body.rememberMe = rememberMe;
    }

    const response = await fetch(this.appUrl + '/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Sign in failed: ${response.status}`);
    }

    return await response.json();
  }

  async getSession(): Promise<{ session: Session; user: User } | null> {
    return await fetchWithTimeout(this.appUrl + '/api/auth/get-session', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      timeout: 5000,
    }).then(async (response) => {
      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error(`Get session failed: ${response.status}`);
      }
      return await response.json();
    });
  }
  async signOut(): Promise<void> {
    const response = await fetch(this.appUrl + '/api/auth/sign-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Sign out failed: ${response.status}`);
    }
  }

  async forgetPassword(email: string, redirectTo?: string): Promise<void> {
    const response = await fetch(this.appUrl + '/api/auth/forget-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        redirectTo: redirectTo || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Forget password failed: ${response.status}`);
    }
  }

  async resetPassword(newPassword: string, token: string): Promise<void> {
    const response = await fetch(this.appUrl + '/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newPassword,
        token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Reset password failed: ${response.status}`);
    }
  }

  async verifyEmail(token: string, callbackURL?: string): Promise<{ user: any; status: boolean }> {
    const params = new URLSearchParams({ token });
    if (callbackURL) {
      params.append('callbackURL', callbackURL);
    }

    const response = await fetchWithTimeout(
      `${this.appUrl}/api/auth/verify-email?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      },
    );

    if (!response.ok) {
      throw new Error(`Email verification failed: ${response.status}`);
    }

    return await response.json();
  }

  async sendVerificationEmail(email: string, callbackURL?: string): Promise<{ status: boolean }> {
    const response = await fetch(this.appUrl + '/api/auth/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        callbackURL: callbackURL || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Send verification email failed: ${response.status}`);
    }

    return await response.json();
  }

  async changeEmail(
    newEmail: string,
    callbackURL?: string,
  ): Promise<{ status: boolean; message: string }> {
    const response = await fetch(this.appUrl + '/api/auth/change-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newEmail,
        callbackURL: callbackURL || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Change email failed: ${response.status}`);
    }

    return await response.json();
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    revokeOtherSessions?: boolean,
  ): Promise<{
    token: string;
    user: any;
  }> {
    const response = await fetch(this.appUrl + '/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ensure cookies are sent
      body: JSON.stringify({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOtherSessions || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Change password failed: ${response.status}`);
    }

    return await response.json();
  }

  async updateUser(name?: string, image?: string): Promise<{ status: boolean }> {
    const response = await fetch(this.appUrl + '/api/auth/update-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ensure cookies are sent
      body: JSON.stringify({
        name: name || '',
        image: image || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Update user failed: ${response.status}`);
    }

    return await response.json();
  }

  async deleteUser(
    password?: string,
    token?: string,
    callbackURL?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await fetch(this.appUrl + '/api/auth/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: password || '',
        token: token || '',
        callbackURL: callbackURL || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Delete user failed: ${response.status}`);
    }

    return await response.json();
  }

  async resetPasswordWithToken(token: string, callbackURL?: string): Promise<{ token: string }> {
    const params = new URLSearchParams();
    if (callbackURL) {
      params.append('callbackURL', callbackURL);
    }

    const response = await fetch(
      this.appUrl + `/api/auth/reset-password/${token}${params.toString() ? "?" + params.toString() : ""}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // keep consistent
      }
    );

    if (!response.ok) {
      throw new Error(`Reset password with token failed: ${response.status}`);
    }

    return await response.json();
  }

  async requestPasswordReset(
    email: string,
    redirectTo?: string,
  ): Promise<{ status: boolean; message: string }> {
    const response = await fetch(this.appUrl + '/api/auth/request-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        redirectTo: redirectTo || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request password reset failed: ${response.status}`);
    }

    return await response.json();
  }

  async listSessions(): Promise<{
    id: string;
    expiresAt: string;
    token: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string;
    userAgent: string;
    userId: string;
    impersonatedBy: string;
  }[]> {
    const response = await fetch(this.appUrl + '/api/auth/list-sessions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ensure cookies are sent
    });

    if (!response.ok) {
      throw new Error(`List sessions failed: ${response.status}`);
    }

    return await response.json();
  }

  async revokeSession(token: string): Promise<{ status: boolean }> {
    const response = await fetch(this.appUrl + '/api/auth/revoke-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Revoke session failed: ${response.status}`);
    }

    return await response.json();
  }

  async revokeSessions(): Promise<{ status: boolean }> {
    const response = await fetch(this.appUrl + '/api/auth/revoke-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Revoke sessions failed: ${response.status}`);
    }

    return await response.json();
  }

  async revokeOtherSessions(): Promise<{ status: boolean }> {
    const response = await fetch(this.appUrl + '/api/auth/revoke-other-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ensure cookies are sent
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Revoke other sessions failed: ${response.status}`);
    }

    return await response.json();
  }

  async linkSocial(
    provider: string,
    callbackURL?: string,
    disableRedirect?: boolean,
    errorCallbackURL?: string,
    idToken?: {
      token?: string;
      nonce?: string;
      accessToken?: string;
      refreshToken?: string;
      scopes?: string[];
    },
    requestSignUp?: boolean,
    scopes?: string[],
  ): Promise<{ url: string; redirect: boolean; status: boolean }> {
    const response = await fetch(this.appUrl + '/api/auth/link-social', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        callbackURL: callbackURL || null,
        disableRedirect: disableRedirect || false,
        errorCallbackURL: errorCallbackURL || null,
        idToken: idToken || null,
        requestSignUp: requestSignUp || false,
        scopes: scopes || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Link social failed: ${response.status}`);
    }

    return await response.json();
  }

  async listAccounts(): Promise<
    {
      id: string;
      providerId: string;
      createdAt: string;
      updatedAt: string;
      accountId: string;
      scopes: string[];
    }[]
  > {
    const data = await fetchWithTimeout(this.appUrl + '/api/auth/list-accounts', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      timeout: 5000,
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`List accounts failed: ${response.status}`);
      }
      return await response.json();
    });
    return data ?? [];
  }

  async deleteUserCallback(
    token: string,
    callbackURL?: string,
  ): Promise<{ success: boolean; message: string }> {
    const params = new URLSearchParams({ token });
    if (callbackURL) {
      params.append('callbackURL', callbackURL);
    }

    const response = await fetchWithTimeout(
      `${this.appUrl}/api/auth/delete-user/callback?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      },
    );

    if (!response.ok) {
      throw new Error(`Delete user callback failed: ${response.status}`);
    }

    return await response.json();
  }

  async unlinkAccount(providerId: string, accountId?: string): Promise<{ status: boolean }> {
    const response = await fetch(this.appUrl + '/api/auth/unlink-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providerId,
        accountId: accountId || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Unlink account failed: ${response.status}`);
    }

    return await response.json();
  }

  async refreshToken(
    providerId: string,
    accountId?: string,
    userId?: string,
  ): Promise<{
    tokenType: string;
    idToken: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  }> {
    const response = await fetch(this.appUrl + '/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providerId,
        accountId: accountId || null,
        userId: userId || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Refresh token failed: ${response.status}`);
    }

    return await response.json();
  }

  async getAccessToken(
    providerId: string,
    accountId?: string,
    userId?: string,
  ): Promise<{
    tokenType: string;
    idToken: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  }> {
    const response = await fetch(this.appUrl + '/api/auth/get-access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providerId,
        accountId: accountId || null,
        userId: userId || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Get access token failed: ${response.status}`);
    }

    return await response.json();
  }

  async getAccountInfo(accountId: string): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      emailVerified: boolean;
    };
    data: { [key: string]: any };
  }> {
    const response = await fetch(this.appUrl + '/api/auth/account-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Get account info failed: ${response.status}`);
    }

    return await response.json();
  }

  async checkApiStatus(): Promise<{ ok: boolean }> {
    const data = await fetchWithTimeout(this.appUrl + '/api/auth/ok', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Check API status failed: ${response.status}`);
      }
      return await response.json();
    });
    return data ?? { ok: false };
  }

  async getError(): Promise<string> {
    const response = await fetch(this.appUrl + '/api/auth/error', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Get error failed: ${response.status}`);
    }

    return await response.text();
  }
}

export default new AuthService();
