import storage from 'expo-sqlite/kv-store';
import { UserDataInterface } from '../models/userData';
import { resetDatabase } from './databaseCreate';

export function SaveUserData(userData: UserDataInterface) {
    const data = {
        firstname: userData.firstname ?? '',
        lastname: userData.lastname ?? '',
        email: userData.email ?? '',
        password: userData.password ?? '',
        token: userData.token ?? '',
        isAdmin: String(userData.isAdmin ?? false)
    };
    
    Object.entries(data).forEach(([key, value]) => storage.setItem(key, value));
}


export async function revokeToken(token : string) {
        try {
        const response = await fetch('http://192.168.0.110:8000/api/token/logout/', {
            method: 'POST',
            headers: {
                'authorization': token || ''  // Convert null to empty string
            }
        });
        
        if (response.ok) {
            console.log('Token revocation successful');
        } else {
            console.log('Token revocation failed');
        }
    } catch (error) {
        console.error('Token revocation error:', error);
    }
}


export async function ClearLocalStorage() { 
     ['firstname', 'lastname', 'email', 'password', 'token']
        .forEach(key => storage.removeItem(key));
    
}

export async function logOut() {
    const token = storage.getItemSync('token');
    if (!token) {
        return;
    }
    await revokeToken(token);
    await resetDatabase();
    await ClearLocalStorage();
}

export function GetUserData(): UserDataInterface {
    return {
        firstname: storage.getItemSync('firstname'),  // Use Sync version
        lastname: storage.getItemSync('lastname'),
        email: storage.getItemSync('email'),
        password: storage.getItemSync('password'),
        token: storage.getItemSync('token')
    };
}


export async function deleteAccount(){
    const token = storage.getItemSync('token');
    try {
        const response = await fetch('http://192.168.0.110:8000/api/token/deleteac/', {
            method: 'POST',
            headers: {
                'authorization': token || '' 
            }
        });
        
        if (response.ok) {
            console.log('Account deletion successful');
            resetDatabase();
            ClearLocalStorage();
        } else {
            console.log('Account deletion failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}



export async function registerAccount(UserInfo: UserDataInterface) {
    try {
        const response = await fetch('http://192.168.0.110:8000/api/token/register/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                email: UserInfo.email,
                firstName: UserInfo.firstname,
                lastName: UserInfo.lastname,
                password: UserInfo.password,
                isAdmin: false,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.log("Registration failed:", response.status, text);
            return { success: false, error: text, status: response.status };
        }

        const data = await response.json();
        console.log("Registration successful:", data);

        // Save to local storage using existing utility
        SaveUserData({
            firstname: data.firstName ?? UserInfo.firstname,
            lastname: data.lastName ?? UserInfo.lastname,
            email: UserInfo.email,
            password: UserInfo.password,
            token: data.token ?? null,
            isAdmin: data.isAdmin ?? false,
        });

        return {
            success: true,
            token: data.token,
            firstName: data.firstName,
            lastName: data.lastName,
            isAdmin: data.isAdmin ?? false,
        }
    } catch (error) {
        console.error("Registration error:", error);
        return { success: false, error };
    }
}


export async function loginAccount(email: string, password: string) {
    try {
        const response = await fetch('http://192.168.0.110:8000/api/token/', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const text = await response.text();
            try {
                const parsed = JSON.parse(text);
                return { success: false, error: parsed.detail || JSON.stringify(parsed) };
            } catch (_) {
                return { success: false, error: text || `Server returned ${response.status}` };
            }
        }

        const data = await response.json();
        console.log("Login successful:", data);
        
        const token = data?.token ?? data?.access ?? null;
        if (!token) {
            return { success: false, error: 'No token returned from server' };
        }

        // Save to local storage
        SaveUserData({
            firstname: data.firstName ?? null,
            lastname: data.lastName ?? null,
            email: email,
            password: password,
            token: token,
            isAdmin: data.isAdmin ?? false
        });

        return {
            success: true,
            token: token,
            firstName: data.firstName,
            lastName: data.lastName,
            isAdmin: data.isAdmin ?? false
        };

    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}



export async function checkUserData() {
    const token = await storage.getItemAsync("token");
    
    if (!token) {
        return { success: false, error: 'No token found' };
    }

    try {
        const response = await fetch('http://192.168.0.110:8000/api/token/verify/', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });

        if (!response.ok) {
            const text = await response.text();
            try {
                const parsed = JSON.parse(text);
                return { success: false, error: parsed.detail || JSON.stringify(parsed) };
            } catch (_) {
                return { success: false, error: text || `Server returned ${response.status}` };
            }
        }

        const data = await response.json();
        
        // Get existing data to preserve token and password
        const existingPassword = await storage.getItemAsync("password");
        
        // Save to local storage with existing token and password
        SaveUserData({
            firstname: data.firstName ?? null,
            lastname: data.lastName ?? null,
            email: data.email ?? null,
            token: token,
            password: existingPassword,
            isAdmin: data.isAdmin ?? false
        });

        return {
            success: true,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            isAdmin: data.isAdmin ?? false
        };

    } catch (error) {
        console.error("Token verification error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
