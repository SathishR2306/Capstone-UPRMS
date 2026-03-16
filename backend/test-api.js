const axios = require('axios');
async function run() {
  try {
    const loginRes = await axios.post('http://localhost:3001/auth/login', {
      hospitalName: 'Apollo',
      docId: 1,
      password: 'password'
    });
    console.log('Login:', loginRes.data);
    const api = axios.create({headers:{Authorization:'Bearer '+loginRes.data.access_token}});
    const prof = await api.get('http://localhost:3001/doctors/profile');
    console.log('Profile:', prof.data);
  } catch(e) {
    if(e.response) Object.keys(e.response.data).length ? console.log('Error Data:', e.response.data) : console.log('Error Status:', e.response.status);
    else console.error('Error:', e.message);
  }
}
run();
