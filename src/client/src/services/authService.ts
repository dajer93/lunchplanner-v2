import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'eu-central-1_FRd37FSmj',
  ClientId: '463hip4itnsj2t7qlplichej6a'
};

const userPool = new CognitoUserPool(poolData);

export interface AuthResult {
  success: boolean;
  message?: string;
  token?: string;
}

export const signUp = async (username: string, password: string): Promise<AuthResult> => {
  return new Promise((resolve) => {
    userPool.signUp(username, password, [], [], (err) => {
      if (err) {
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true, message: 'User registration successful!' });
      }
    });
  });
};

export const signIn = async (username: string, password: string): Promise<AuthResult> => {
  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  });

  const userData = {
    Username: username,
    Pool: userPool,
  };

  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const token = result.getIdToken().getJwtToken();
        localStorage.setItem('user', JSON.stringify({ username, token }));
        resolve({ success: true, token });
      },
      onFailure: (err) => {
        resolve({ success: false, message: err.message || 'Login failed' });
      },
    });
  });
};

export const signOut = (): void => {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
    localStorage.removeItem('user');
  }
};

export const getCurrentUser = (): { username: string; token: string } | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

export const getAuthToken = (): string | null => {
  const user = getCurrentUser();
  return user ? user.token : null;
}; 