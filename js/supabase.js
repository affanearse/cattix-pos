import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://bvpzvkncwfgmkgzeevaj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cHp2a25jd2ZnbWtnemVldmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTA4OTQsImV4cCI6MjA5MDE2Njg5NH0._qRd6WwgTuWBLMA05pt5iMdMR-cw29NGg93Fk5ju0hk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)