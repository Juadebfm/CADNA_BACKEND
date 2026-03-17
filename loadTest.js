import http from 'k6/http';
import { check, sleep } from 'k6';

const users = [
  { email: 'teststudent1@test.com', password: 'Test1234!' },
  { email: 'teststudent2@test.com', password: 'Test1234!' },
  { email: 'teststudent3@test.com', password: 'Test1234!' },
  { email: 'teststudent4@test.com', password: 'Test1234!' },
  { email: 'teststudent5@test.com', password: 'Test1234!' },
  { email: 'teststudent6@test.com', password: 'Test1234!' },
  { email: 'teststudent7@test.com', password: 'Test1234!' },
  { email: 'teststudent8@test.com', password: 'Test1234!' },
  { email: 'teststudent9@test.com', password: 'Test1234!' },
  { email: 'teststudent10@test.com', password: 'Test1234!' },
];

const BASE_URL = 'https://cadna-backend-kpgj.onrender.com';
const EXAM_ID = '69b83b54955515359f636063';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const user = users[__VU % users.length];

  // Step 1 — Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  

//   console.log('Login response:', loginRes.status, loginRes.body);

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login time < 1000ms': (r) => r.timings.duration < 1000,
  });

  const token = loginRes.json('data.accessToken');
  if (!token) return;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  sleep(1);

  // Step 2 — Get all exams
  const examsRes = http.get(`${BASE_URL}/api/exams`, { headers });

  check(examsRes, {
    'get exams successful': (r) => r.status === 200,
    'exams time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Enroll in exam first
http.post(
  `${BASE_URL}/api/exams/${EXAM_ID}/enroll`,
  null,
  { headers }
);

sleep(1);

  // Step 3 — Start exam session
 const startRes = http.post(
  `${BASE_URL}/api/exams/${EXAM_ID}/start`,
  JSON.stringify({ timezone: 'Africa/Lagos' }),
  { headers }
);
//   console.log('Start exam:', startRes.status, startRes.body);


  check(startRes, {
    'start exam successful': (r) => r.status === 200 || r.status === 201,
    'start exam time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Step 4 — Get exam details
  const examRes = http.get(`${BASE_URL}/api/exams/${EXAM_ID}`, { headers });

  check(examRes, {
    'get exam successful': (r) => r.status === 200,
    'get exam time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
