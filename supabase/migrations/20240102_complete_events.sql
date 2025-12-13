-- Complete Events Feature - Event Registration with Capacity Management
-- Migration: 20240102_complete_events.sql

-- ==========================================
-- ENHANCE EVENTS TABLE
-- ==========================================

ALTER TABLE community_events
ADD COLUMN IF NOT EXISTS max_attendees INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'webinar',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming',
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add check constraint for status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_event_status'
  ) THEN
    ALTER TABLE community_events ADD CONSTRAINT valid_event_status
      CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'));
  END IF;
END $$;

-- Add check constraint for event_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_event_type'
  ) THEN
    ALTER TABLE community_events ADD CONSTRAINT valid_event_type
      CHECK (event_type IN ('webinar', 'workshop', 'meetup', 'qa_session', 'announcement'));
  END IF;
END $$;

-- ==========================================
-- FUNCTION: Register for Event
-- ==========================================

CREATE OR REPLACE FUNCTION register_for_event(p_event_id UUID, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, attendees_count INTEGER) AS $$
DECLARE
  v_max INTEGER;
  v_current INTEGER;
  v_new_count INTEGER;
  v_already_registered BOOLEAN;
BEGIN
  -- Check if already registered
  SELECT EXISTS(
    SELECT 1 FROM community_event_registrations
    WHERE event_id = p_event_id AND user_id = p_user_id
  ) INTO v_already_registered;

  IF v_already_registered THEN
    SELECT attendees_count INTO v_new_count FROM community_events WHERE id = p_event_id;
    RETURN QUERY SELECT FALSE, 'Already registered'::TEXT, v_new_count;
    RETURN;
  END IF;

  -- Get max attendees and current count
  SELECT max_attendees, attendees_count INTO v_max, v_current
  FROM community_events WHERE id = p_event_id;

  -- Check if event is full
  IF v_max IS NOT NULL AND v_current >= v_max THEN
    RETURN QUERY SELECT FALSE, 'Event is full'::TEXT, v_current;
    RETURN;
  END IF;

  -- Register user
  INSERT INTO community_event_registrations (event_id, user_id)
  VALUES (p_event_id, p_user_id);

  -- Increment attendees count
  UPDATE community_events
  SET attendees_count = attendees_count + 1
  WHERE id = p_event_id
  RETURNING attendees_count INTO v_new_count;

  RETURN QUERY SELECT TRUE, 'Registration successful'::TEXT, v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Unregister from Event
-- ==========================================

CREATE OR REPLACE FUNCTION unregister_from_event(p_event_id UUID, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, attendees_count INTEGER) AS $$
DECLARE
  v_registration_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Check if registered
  SELECT id INTO v_registration_id FROM community_event_registrations
  WHERE event_id = p_event_id AND user_id = p_user_id;

  IF v_registration_id IS NULL THEN
    SELECT attendees_count INTO v_new_count FROM community_events WHERE id = p_event_id;
    RETURN QUERY SELECT FALSE, 'Not registered'::TEXT, v_new_count;
    RETURN;
  END IF;

  -- Delete registration
  DELETE FROM community_event_registrations WHERE id = v_registration_id;

  -- Decrement attendees count
  UPDATE community_events
  SET attendees_count = GREATEST(attendees_count - 1, 0)
  WHERE id = p_event_id
  RETURNING attendees_count INTO v_new_count;

  RETURN QUERY SELECT TRUE, 'Unregistration successful'::TEXT, v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Create Event (Admin Only)
-- ==========================================

CREATE OR REPLACE FUNCTION create_community_event(
  p_title TEXT,
  p_description TEXT,
  p_event_date DATE,
  p_event_time TIME,
  p_event_type TEXT,
  p_max_attendees INTEGER,
  p_is_online BOOLEAN,
  p_location TEXT,
  p_meeting_link TEXT,
  p_image_url TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_event_id UUID;
BEGIN
  -- Verify admin privileges
  SELECT is_community_admin INTO v_is_admin
  FROM profiles WHERE id = p_created_by;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to create events';
  END IF;

  -- Insert event
  INSERT INTO community_events (
    title,
    description,
    event_date,
    event_time,
    event_type,
    max_attendees,
    is_online,
    location,
    meeting_link,
    image_url,
    created_by,
    status
  ) VALUES (
    p_title,
    p_description,
    p_event_date,
    p_event_time,
    p_event_type,
    p_max_attendees,
    p_is_online,
    p_location,
    p_meeting_link,
    p_image_url,
    p_created_by,
    'upcoming'
  ) RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Delete Event (Admin Only)
-- ==========================================

CREATE OR REPLACE FUNCTION delete_community_event(p_event_id UUID, p_admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verify admin privileges
  SELECT is_community_admin INTO v_is_admin
  FROM profiles WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to delete events';
  END IF;

  -- Delete event (cascades to registrations)
  DELETE FROM community_events WHERE id = p_event_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION register_for_event TO authenticated;
GRANT EXECUTE ON FUNCTION unregister_from_event TO authenticated;
GRANT EXECUTE ON FUNCTION create_community_event TO authenticated;
GRANT EXECUTE ON FUNCTION delete_community_event TO authenticated;

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_events_date ON community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON community_events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON community_events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON community_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON community_event_registrations(user_id);

-- ==========================================
-- UPDATE RLS POLICIES
-- ==========================================

-- Allow authenticated users to view upcoming events
DROP POLICY IF EXISTS "Anyone can view events" ON community_events;
CREATE POLICY "Anyone can view events" ON community_events
  FOR SELECT USING (true);

-- Allow admins to insert events
DROP POLICY IF EXISTS "Admins can insert events" ON community_events;
CREATE POLICY "Admins can insert events" ON community_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_community_admin = true
    )
  );

-- Allow admins to update their own events
DROP POLICY IF EXISTS "Admins can update events" ON community_events;
CREATE POLICY "Admins can update events" ON community_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_community_admin = true
    )
  );

-- Allow admins to delete events
DROP POLICY IF EXISTS "Admins can delete events" ON community_events;
CREATE POLICY "Admins can delete events" ON community_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_community_admin = true
    )
  );

-- Event registrations policies
ALTER TABLE community_event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view registrations" ON community_event_registrations;
CREATE POLICY "Anyone can view registrations" ON community_event_registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can register themselves" ON community_event_registrations;
CREATE POLICY "Users can register themselves" ON community_event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unregister themselves" ON community_event_registrations;
CREATE POLICY "Users can unregister themselves" ON community_event_registrations
  FOR DELETE USING (auth.uid() = user_id);
