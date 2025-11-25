import {fetchWithTimeout, request} from '@/lib/net';
import {Session, User} from '@/types/types';

class AuthService {
  private appUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  async signUp(email: string, password: string, name?: string, rememberMe?: boolean,): Promise<void> {
    await request<void>(this.appUrl + '/api/auth/sign-up/email', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        email, password, name: name || '', rememberMe: rememberMe || false,
      }),
    });
  }

  async signIn(email: string, password: string, callbackURL?: string, rememberMe?: boolean,): Promise<{
    redirect: boolean; token: string; url: string | null; user: any;
  }> {
    const body: any = {email, password};
    if (callbackURL !== undefined) body.callbackURL = callbackURL;
    if (rememberMe !== undefined) body.rememberMe = rememberMe;

    return await request<{
      redirect: boolean; token: string; url: string | null; user: any;
    }>(this.appUrl + '/api/auth/sign-in/email', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body),
    });
  }

  async getSession(): Promise<{ session: Session; user: User } | null> {
    return await fetchWithTimeout(this.appUrl + '/api/auth/get-session', {
      method: 'GET', headers: {'Content-Type': 'application/json'}, credentials: 'include', timeout: 5000,
    }).then(async (response) => {
      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error(`Get session failed: ${response.status}`);
      }
      return await response.json();
    });
  }

  async signOut(): Promise<void> {
    await request<void>(this.appUrl + '/api/auth/sign-out', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({}),
    });
  }

  async forgetPassword(email: string, redirectTo?: string): Promise<void> {
    await request<void>(this.appUrl + '/api/auth/forget-password', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        email, redirectTo: redirectTo || null,
      }),
    });
  }

  async resetPassword(newPassword: string, token: string): Promise<void> {
    await request<void>(this.appUrl + '/api/auth/reset-password', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({newPassword, token}),
    });
  }

  async verifyEmail(token: string, callbackURL?: string): Promise<{ user: any; status: boolean }> {
    const params = new URLSearchParams({token});
    if (callbackURL) params.append('callbackURL', callbackURL);

    return await request<{
      user: any; status: boolean
    }>(this.appUrl + `/api/auth/verify-email?${params.toString()}`, {
      method: 'GET', headers: {'Content-Type': 'application/json'}
    },);
  }

  async sendVerificationEmail(email: string, callbackURL?: string): Promise<{ status: boolean }> {
    return await request<{ status: boolean }>(this.appUrl + '/api/auth/send-verification-email', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, callbackURL: callbackURL || null}),
    });
  }

  async changeEmail(newEmail: string, callbackURL?: string,): Promise<{ status: boolean; message: string }> {
    return await request<{ status: boolean; message: string }>(this.appUrl + '/api/auth/change-email', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({newEmail, callbackURL: callbackURL || null}),
    });
  }

  async changePassword(currentPassword: string, newPassword: string, revokeOtherSessions?: boolean,): Promise<{
    token: string; user: any;
  }> {
    return await request<{ token: string; user: any }>(this.appUrl + '/api/auth/change-password', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        currentPassword, newPassword, revokeOtherSessions: revokeOtherSessions || false,
      }),
    });
  }

  async updateUser(name?: string, image?: string): Promise<{ status: boolean }> {
    return await request<{ status: boolean }>(this.appUrl + '/api/auth/update-user', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: name || '', image: image || ''}),
    });
  }

  async deleteUser(password?: string, token?: string, callbackURL?: string,): Promise<{
    success: boolean; message: string;
  }> {
    return await request<{ success: boolean; message: string }>(this.appUrl + '/api/auth/delete-user', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        password: password || '', token: token || '', callbackURL: callbackURL || null,
      }),
    });
  }

  async resetPasswordWithToken(token: string, callbackURL?: string): Promise<{ token: string }> {
    const params = new URLSearchParams();
    if (callbackURL) params.append('callbackURL', callbackURL);

    return await request<{
      token: string
    }>(this.appUrl + `/api/auth/reset-password/${token}${params.toString() ? '?' + params.toString() : ''}`, {
      method: 'GET', headers: {'Content-Type': 'application/json'}
    },);
  }

  async requestPasswordReset(email: string, redirectTo?: string,): Promise<{ status: boolean; message: string }> {
    return await request<{ status: boolean; message: string }>(this.appUrl + '/api/auth/request-password-reset', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, redirectTo: redirectTo || null}),
    },);
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
    return await request<{
      id: string;
      expiresAt: string;
      token: string;
      createdAt: string;
      updatedAt: string;
      ipAddress: string;
      userAgent: string;
      userId: string;
      impersonatedBy: string;
    }[]>(this.appUrl + '/api/auth/list-sessions', {
      method: 'GET', headers: {'Content-Type': 'application/json'},
    });
  }

  async revokeSession(token: string): Promise<{ status: boolean }> {
    return await request<{ status: boolean }>(this.appUrl + '/api/auth/revoke-session', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({token}),
    });
  }

  async revokeSessions(): Promise<{ status: boolean }> {
    return await request<{ status: boolean }>(this.appUrl + '/api/auth/revoke-sessions', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({}),
    });
  }

  async revokeOtherSessions(): Promise<{ status: boolean }> {
    return await request<{ status: boolean }>(this.appUrl + '/api/auth/revoke-other-sessions', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({}),
    });
  }

  async linkSocial(provider: string, callbackURL?: string, disableRedirect?: boolean, errorCallbackURL?: string, idToken?: {
    token?: string; nonce?: string; accessToken?: string; refreshToken?: string; scopes?: string[];
  }, requestSignUp?: boolean, scopes?: string[],): Promise<{ url: string; redirect: boolean; status: boolean }> {
    return await request<{ url: string; redirect: boolean; status: boolean }>(this.appUrl + '/api/auth/link-social', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        provider,
        callbackURL: callbackURL || null,
        disableRedirect: disableRedirect || false,
        errorCallbackURL: errorCallbackURL || null,
        idToken: idToken || null,
        requestSignUp: requestSignUp || false,
        scopes: scopes || [],
      }),
    },);
  }

  async listAccounts(): Promise<{
    id: string; providerId: string; createdAt: string; updatedAt: string; accountId: string; scopes: string[];
  }[]> {
    const data = await request<{
      id: string; providerId: string; createdAt: string; updatedAt: string; accountId: string; scopes: string[];
    }[]>(this.appUrl + '/api/auth/list-accounts', {method: 'GET', headers: {'Content-Type': 'application/json'}});
    return data ?? [];
  }

  async deleteUserCallback(token: string, callbackURL?: string,): Promise<{ success: boolean; message: string }> {
    const params = new URLSearchParams({token});
    if (callbackURL) params.append('callbackURL', callbackURL);

    return await request<{
      success: boolean; message: string
    }>(this.appUrl + `/api/auth/delete-user/callback?${params.toString()}`, {
      method: 'GET', headers: {'Content-Type': 'application/json'}
    },);
  }

  async unlinkAccount(providerId: string, accountId?: string): Promise<{ status: boolean }> {
    return await request<{ status: boolean }>(this.appUrl + '/api/auth/unlink-account', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({providerId, accountId: accountId || null}),
    });
  }

  async refreshToken(providerId: string, accountId?: string, userId?: string,): Promise<{
    tokenType: string;
    idToken: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  }> {
    return await request<{
      tokenType: string;
      idToken: string;
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: string;
      refreshTokenExpiresAt: string;
    }>(this.appUrl + '/api/auth/refresh-token', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({providerId, accountId: accountId || null, userId: userId || null}),
    });
  }

  async getAccessToken(providerId: string, accountId?: string, userId?: string,): Promise<{
    tokenType: string;
    idToken: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  }> {
    return await request<{
      tokenType: string;
      idToken: string;
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: string;
      refreshTokenExpiresAt: string;
    }>(this.appUrl + '/api/auth/get-access-token', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({providerId, accountId: accountId || null, userId: userId || null}),
    });
  }

  async getAccountInfo(accountId: string): Promise<{
    user: {
      id: string; name: string; email: string; image: string; emailVerified: boolean;
    }; data: { [key: string]: any };
  }> {
    return await request<{
      user: {
        id: string; name: string; email: string; image: string; emailVerified: boolean;
      }; data: { [key: string]: any };
    }>(this.appUrl + '/api/auth/account-info', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({accountId}),
    });
  }

  async checkApiStatus(): Promise<{ ok: boolean }> {
    const data = await request<{ ok: boolean }>(this.appUrl + '/api/auth/ok', {
      method: 'GET', headers: {'Content-Type': 'application/json'}
    },);
    return data ?? {ok: false};
  }

  async getError(): Promise<string> {
    const response = await fetch(this.appUrl + '/api/auth/error', {
      method: 'GET', headers: {'Content-Type': 'application/json'},
    });
    if (!response.ok) {
      throw new Error(`Get error failed: ${response.status}`);
    }
    return await response.text();
  }
}

export default new AuthService();
