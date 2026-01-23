-- Allow anonymous users to insert into lead_captures (public contact/onboarding forms)
CREATE POLICY "Anyone can create leads via public forms" 
ON public.lead_captures 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous users to insert analytics data
CREATE POLICY "Anyone can create analytics sessions" 
ON public.analytics_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can create analytics page views" 
ON public.analytics_page_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can create analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous users to insert onboarding responses (linked to their lead)
CREATE POLICY "Anyone can create onboarding responses" 
ON public.onboarding_responses 
FOR INSERT 
WITH CHECK (true);