import storage from 'expo-sqlite/kv-store';
import { UserDataInterface } from '../models/userData';



export function SaveUserData(firstname: string, lastname: string, email: string, password: string, token: string) {
    Object.entries({ firstname, lastname, email, password, token })
        .forEach(([key, value]) => storage.setItem(key, value));
}


export async function ClearUserData() {
    const token = storage.getItemSync('token');
    
    try {
        const response = await fetch('http://192.168.0.110:8000/api/token/logout/', {
            method: 'POST',
            headers: {
                'authorization': token || ''  // Convert null to empty string
            }
        });
        
        if (response.ok) {
            console.log('Logout successful');
        } else {
            console.log('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear storage AFTER logout request completes
    ['firstname', 'lastname', 'email', 'password', 'token']
        .forEach(key => storage.removeItem(key));
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