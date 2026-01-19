
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrdggwamocuwzbapduub.supabase.co';
const supabaseKey = 'sb_publishable_ZqOOITkp0c4TVYFd7qUZ5Q_Jn5oZFZk';

export const supabase = createClient(supabaseUrl, supabaseKey);
