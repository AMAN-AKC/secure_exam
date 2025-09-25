// Test script to debug authentication
// Run this in browser console or as a Node.js script

const testAuth = async () => {
  const baseURL = 'http://localhost:4000/api';
  
  // Test data
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123',
    role: 'student'
  };

  console.log('=== Testing Authentication ===');

  try {
    // Test Registration
    console.log('1. Testing Registration...');
    const registerResponse = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);

    if (registerResponse.ok) {
      console.log('✅ Registration successful');
      
      // Test Login
      console.log('2. Testing Login...');
      const loginResponse = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (loginResponse.ok) {
        console.log('✅ Login successful');
        console.log('User data:', loginData.user);
        console.log('Token received:', !!loginData.token);
      } else {
        console.log('❌ Login failed:', loginData.error);
      }
    } else {
      console.log('❌ Registration failed:', registerData.error);
      
      if (registerData.error === 'Email already registered') {
        console.log('3. Testing Login with existing account...');
        const loginResponse = await fetch(`${baseURL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password,
          }),
        });

        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);

        if (loginResponse.ok) {
          console.log('✅ Login with existing account successful');
        } else {
          console.log('❌ Login with existing account failed:', loginData.error);
        }
      }
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// If running in browser, execute immediately
if (typeof window !== 'undefined') {
  testAuth();
}

// If running in Node.js, export the function
if (typeof module !== 'undefined') {
  module.exports = testAuth;
}