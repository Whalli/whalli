import { auth } from './src/lib/auth-server.js';

async function testAuth() {
  try {
    console.log('Testing Better Auth configuration...');

    // Test CSRF token generation
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF Token:', csrfData.csrfToken);

    // Test sign-up
    const signUpResponse = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfData.csrfToken,
      },
      body: JSON.stringify({
        email: 'test6@example.com',
        password: 'testpassword123',
        name: 'Test User',
      }),
    });

    const signUpResult = await signUpResponse.json();
    console.log('Sign-up result:', signUpResult);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();