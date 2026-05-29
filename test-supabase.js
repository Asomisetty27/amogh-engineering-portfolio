import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vpbwmcfzeuqisgwwtchd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYndtY2Z6ZXVxaXNnd3d0Y2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTAxODUsImV4cCI6MjA5NDAyNjE4NX0.2u2qgtEuSkTa1hXlIS3OtOG9QqQHTGK89s7yatp7vfs";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data, error } = await supabase.from('advisor_questions').select('*');
console.log('Error:', error);
console.log('Data count:', data?.length);
if (data && data.length > 0) {
  console.log('First question:', { 
    id: data[0].id, 
    question: data[0].question?.slice(0, 50), 
    status: data[0].status,
    answer: data[0].answer ? '✓ answered' : '✗ no answer'
  });
}
