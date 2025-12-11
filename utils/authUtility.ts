import storage from 'expo-sqlite/kv-store';


export interface UserDataInterface {
    firstname: string | null;
    lastname: string | null;
    email: string | null;
    password: string | null;
    token: string | null;
}

export function SaveUserData(firstname: string, lastname: string, email: string, password: string, token: string) {
    Object.entries({ firstname, lastname, email, password, token })
        .forEach(([key, value]) => storage.setItem(key, value));
}


export function ClearUserData() {
    ['firstname', 'lastname', 'email', 'password', 'token']
        .forEach(key => storage.removeItem(key));
    /* Remove token from server side.
     try {
      const res = await fetch('http://192.168.0.110:8000/api/token/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }); */

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