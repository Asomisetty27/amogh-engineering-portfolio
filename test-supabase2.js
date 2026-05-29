import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://vpbwmcfzeuqisgwwtchd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYndtY2Z6ZXVxaXNnd3d0Y2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTAxODUsImV4cCI6MjA5NDAyNjE4NX0.2u2qgtEuSkTa1hXlIS3OtOG9QqQHTGK89s7yatp7vfs"
);

// Try raw REST call to see if tables exist
const res = await fetch("https://vpbwmcfzeuqisgwwtchd.supabase.co/rest/v1/advisor_questions?select=id&limit=1", {
  headers: {
    apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYndtY2Z6ZXVxaXNnd3d0Y2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTAxODUsImV4cCI6MjA5NDAyNjE4NX0.2u2qgtEuSkTa1hXlIS3OtOG9QqQHTGK89s7yatp7vfs",
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYndtY2Z6ZXVxaXNnd3d0Y2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTAxODUsImV4cCI6MjA5NDAyNjE4NX0.2u2qgtEuSkTa1hXlIS3OtOG9QqQHTGK89s7yatp7vfs"
  }
});
console.log("Status:", res.status);
const body = await res.json();
console.log("Body:", JSON.stringify(body));
