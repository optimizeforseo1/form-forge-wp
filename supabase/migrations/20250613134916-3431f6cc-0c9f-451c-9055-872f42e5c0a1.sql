
-- Create enum types for form field types
CREATE TYPE field_type AS ENUM (
  'text', 
  'email', 
  'phone', 
  'dropdown', 
  'textarea', 
  'checkbox', 
  'radio'
);

-- Create forms table
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  notification_email VARCHAR(255) NOT NULL,
  recaptcha_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_fields table
CREATE TABLE public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
  field_type field_type NOT NULL,
  label VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  placeholder VARCHAR(255),
  required BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  options JSONB, -- For dropdown/radio options
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_submissions table
CREATE TABLE public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a contact form system)
-- Forms policies
CREATE POLICY "Anyone can view active forms" ON public.forms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow all operations on forms" ON public.forms
  FOR ALL USING (true);

-- Form fields policies  
CREATE POLICY "Anyone can view enabled form fields" ON public.form_fields
  FOR SELECT USING (enabled = true);

CREATE POLICY "Allow all operations on form fields" ON public.form_fields
  FOR ALL USING (true);

-- Form submissions policies
CREATE POLICY "Allow form submissions" ON public.form_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing submissions" ON public.form_submissions
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_form_fields_form_id ON public.form_fields(form_id);
CREATE INDEX idx_form_fields_sort_order ON public.form_fields(sort_order);
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_submitted_at ON public.form_submissions(submitted_at DESC);
