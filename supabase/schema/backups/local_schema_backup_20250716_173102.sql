

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."assignment_type" AS ENUM (
    'moai_auto',
    'manual'
);


ALTER TYPE "public"."assignment_type" OWNER TO "postgres";


CREATE TYPE "public"."moai_format" AS ENUM (
    'goal',
    'activity'
);


ALTER TYPE "public"."moai_format" OWNER TO "postgres";


CREATE TYPE "public"."moai_member_role" AS ENUM (
    'member',
    'admin',
    'coach'
);


ALTER TYPE "public"."moai_member_role" OWNER TO "postgres";


CREATE TYPE "public"."moai_status" AS ENUM (
    'active',
    'archived'
);


ALTER TYPE "public"."moai_status" OWNER TO "postgres";


CREATE TYPE "public"."moai_type" AS ENUM (
    'public',
    'private'
);


ALTER TYPE "public"."moai_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_previous_buddy_chats"("p_moai_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_week_start DATE;
BEGIN
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '1 day';

    -- Archive previous week's buddy chats
    UPDATE public.buddy_chat_channels
    SET is_active = FALSE, updated_at = NOW()
    WHERE moai_id = p_moai_id
      AND week_start_date < current_week_start
      AND is_active = TRUE;
END;
$$;


ALTER FUNCTION "public"."archive_previous_buddy_chats"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_program_from_template"("p_template_id" "uuid", "p_moai_id" "uuid", "p_assigned_by" "uuid", "p_start_date" "date" DEFAULT CURRENT_DATE) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    template_record RECORD;
    member_record RECORD;
BEGIN
    -- Get template data
    SELECT * INTO template_record
    FROM public.program_templates
    WHERE id = p_template_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    -- Assign to all active moai members
    FOR member_record IN
        SELECT profile_id FROM public.moai_members
        WHERE moai_id = p_moai_id AND is_active = true
        LOOP
        -- Create individual program assignment logic here
        -- This would involve creating workout schedules based on template_data

            INSERT INTO public.notifications (profile_id, type, content, related_entity_id)
            VALUES (
                       member_record.profile_id,
                       'program_assigned',
                       'New workout program assigned: ' || template_record.template_name,
                       p_moai_id
                   );
        END LOOP;
END;
$$;


ALTER FUNCTION "public"."assign_program_from_template"("p_template_id" "uuid", "p_moai_id" "uuid", "p_assigned_by" "uuid", "p_start_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_program_to_moai_members"("p_moai_id" "uuid", "p_program_id" "uuid", "p_assigned_by" "uuid", "p_week_start_date" "date" DEFAULT CURRENT_DATE) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- First, remove any existing moai-based assignments for this moai
    UPDATE public.user_program_assignments
    SET status = 'completed'
    WHERE moai_id = p_moai_id
      AND assignment_type = 'moai_auto'
      AND status = 'assigned';

    -- Insert program assignments for ALL active moai members
    INSERT INTO public.user_program_assignments (
        profile_id,
        program_id,
        assigned_by,
        assignment_type,
        moai_id,
        assigned_via_moai,
        status
    )
    SELECT
        mm.profile_id,
        p_program_id,
        p_assigned_by,
        'moai_auto'::assignment_type,
        p_moai_id,
        true,
        'assigned'
    FROM public.moai_members mm
    WHERE mm.moai_id = p_moai_id
      AND mm.is_active = true;

    -- Update the moai's current program
    UPDATE public.moais
    SET current_program_id = p_program_id,
        updated_at = NOW()
    WHERE id = p_moai_id;

    -- Record the change in history
    INSERT INTO public.moai_program_history (
        moai_id,
        program_id,
        changed_by,
        week_start_date,
        reason
    ) VALUES (
                 p_moai_id,
                 p_program_id,
                 p_assigned_by,
                 p_week_start_date,
                 'Moai program assignment'
             );
END;
$$;


ALTER FUNCTION "public"."assign_program_to_moai_members"("p_moai_id" "uuid", "p_program_id" "uuid", "p_assigned_by" "uuid", "p_week_start_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_to_existing_buddy_group"("p_moai_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_cycle_id UUID;
    v_pair_to_expand_id UUID;
    v_current_group JSONB;
    v_updated_group JSONB;
BEGIN
    -- Get current cycle
    SELECT id INTO v_cycle_id
    FROM public.buddy_cycles
    WHERE moai_id = p_moai_id
      AND CURRENT_DATE >= cycle_start_date
      AND CURRENT_DATE <= cycle_end_date;

    IF v_cycle_id IS NULL THEN
        RETURN FALSE; -- No active cycle
    END IF;

    -- Find a pair (group of 2) to expand to group of 3
    SELECT id, buddy_group INTO v_pair_to_expand_id, v_current_group
    FROM public.buddy_cycle_pairings
    WHERE cycle_id = v_cycle_id
      AND buddy_type = 'buddy_1on1'
      AND jsonb_array_length(buddy_group) = 2
    LIMIT 1;

    IF v_pair_to_expand_id IS NULL THEN
        RETURN FALSE; -- No pairs available to expand
    END IF;

    -- Add user to the group
    v_updated_group := v_current_group || to_jsonb(p_user_id::text);

    -- Update the pairing
    UPDATE public.buddy_cycle_pairings
    SET buddy_group = v_updated_group,
        buddy_type = 'buddy_group'
    WHERE id = v_pair_to_expand_id;

    -- Update the corresponding chat channel
    UPDATE public.buddy_chat_channels
    SET buddy_group = v_updated_group,
        buddy_type = 'buddy_group'
    WHERE moai_id = p_moai_id
      AND cycle_start_date = (SELECT cycle_start_date FROM public.buddy_cycles WHERE id = v_cycle_id)
      AND buddy_group = v_current_group;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."assign_to_existing_buddy_group"("p_moai_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_moai_program_to_new_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    moai_program_id UUID;
BEGIN
    -- Get the current moai program
    SELECT current_program_id INTO moai_program_id
    FROM public.moais
    WHERE id = NEW.moai_id;

    -- If moai has a program, assign it to the new member
    IF moai_program_id IS NOT NULL THEN
        INSERT INTO public.user_program_assignments (
            profile_id,
            program_id,
            assigned_by,
            assignment_type,
            moai_id,
            assigned_via_moai,
            status
        ) VALUES (
                     NEW.profile_id,
                     moai_program_id,
                     NEW.profile_id, -- Self-assigned when joining
                     'moai_auto'::assignment_type,
                     NEW.moai_id,
                     true,
                     'assigned'
                 )
        ON CONFLICT (profile_id, program_id)
            DO UPDATE SET
                          assignment_type = 'moai_auto'::assignment_type,
                          moai_id = NEW.moai_id,
                          assigned_via_moai = true,
                          status = 'assigned',
                          assigned_at = NOW();
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_assign_moai_program_to_new_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid", "p_blocked_by" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Remove user from moai (soft delete)
    UPDATE public.moai_members
    SET is_active = false, updated_at = NOW()
    WHERE profile_id = p_user_id AND moai_id = p_moai_id;

    -- Add to blocklist
    INSERT INTO public.moai_blocklist (moai_id, user_id, blocked_by, reason)
    VALUES (p_moai_id, p_user_id, p_blocked_by, p_reason)
    ON CONFLICT (moai_id, user_id)
        DO UPDATE SET
                      is_active = true,
                      blocked_by = p_blocked_by,
                      reason = p_reason,
                      blocked_at = NOW(),
                      updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."block_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid", "p_blocked_by" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_credit_tier"("coached_members_count" integer) RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    AS $_$
BEGIN
    CASE
        WHEN coached_members_count <= 1 THEN RETURN 0.00;
        WHEN coached_members_count BETWEEN 2 AND 3 THEN RETURN 10.00;
        WHEN coached_members_count BETWEEN 4 AND 5 THEN RETURN 20.00;
        WHEN coached_members_count BETWEEN 6 AND 8 THEN RETURN 30.00;
        ELSE RETURN 30.00; -- Cap at $30 for 8+ members
        END CASE;
END;
$_$;


ALTER FUNCTION "public"."calculate_credit_tier"("coached_members_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_group_success_percentage"("p_moai_id" "uuid", "p_week_start_date" "date") RETURNS numeric
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    total_committed INTEGER;
    total_completed INTEGER;
    success_percentage NUMERIC;
BEGIN
    -- Sum all commitments and completions for the group in the given week
    SELECT
        COALESCE(SUM(commitment_count), 0),
        COALESCE(SUM(activities_completed), 0)
    INTO total_committed, total_completed
    FROM public.weekly_member_commitments
    WHERE moai_id = p_moai_id
      AND week_start_date = p_week_start_date;

    -- Calculate percentage (avoid division by zero)
    IF total_committed = 0 THEN
        RETURN 0;
    END IF;

    success_percentage := (total_completed::NUMERIC / total_committed::NUMERIC) * 100;
    RETURN ROUND(success_percentage, 2);
END;
$$;


ALTER FUNCTION "public"."calculate_group_success_percentage"("p_moai_id" "uuid", "p_week_start_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_member_risk_score"("p_member_id" "uuid", "p_moai_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    risk_score NUMERIC := 0;
    days_inactive INTEGER;
    completion_rate NUMERIC;
    streak_broken BOOLEAN := false;
BEGIN
    -- Get activity data
    SELECT
        COALESCE(EXTRACT(days FROM (NOW() - MAX(logged_at))), 999),
        COALESCE(COUNT(*) FILTER (WHERE logged_at >= CURRENT_DATE - INTERVAL '7 days'), 0) / 7.0
    INTO days_inactive, completion_rate
    FROM public.activity_logs
    WHERE profile_id = p_member_id;

    -- Check if streak was broken recently
    SELECT COALESCE(current_streak < 3, false) INTO streak_broken
    FROM public.coach_member_insights
    WHERE profile_id = p_member_id AND moai_id = p_moai_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Calculate risk factors
    IF days_inactive > 3 THEN risk_score := risk_score + 30; END IF;
    IF completion_rate < 0.5 THEN risk_score := risk_score + 25; END IF;
    IF streak_broken THEN risk_score := risk_score + 20; END IF;

    RETURN LEAST(risk_score, 100);
END;
$$;


ALTER FUNCTION "public"."calculate_member_risk_score"("p_member_id" "uuid", "p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_moai_coach_match_percentage"("p_moai_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    total_members INTEGER;
    coach_counts RECORD;
    max_coach_count INTEGER := 0;
    match_percentage NUMERIC := 0;
BEGIN
    -- Get total active members in moai
    SELECT COUNT(*) INTO total_members
    FROM public.moai_members mm
    WHERE mm.moai_id = p_moai_id AND mm.is_active = true;

    IF total_members = 0 THEN
        RETURN 0;
    END IF;

    -- Find the coach with the most subscribers in this moai
    FOR coach_counts IN
        SELECT cs.coach_id, COUNT(*) as subscriber_count
        FROM public.coach_subscriptions cs
                 JOIN public.moai_members mm ON mm.profile_id = cs.user_id
        WHERE mm.moai_id = p_moai_id
          AND mm.is_active = true
          AND cs.status = 'active'
        GROUP BY cs.coach_id
        ORDER BY subscriber_count DESC
        LOOP
            max_coach_count := coach_counts.subscriber_count;
            EXIT; -- Only need the highest count
        END LOOP;

    -- Calculate percentage
    match_percentage := (max_coach_count::NUMERIC / total_members::NUMERIC) * 100;

    -- Update moai table
    UPDATE public.moais
    SET coach_match_percentage = match_percentage
    WHERE id = p_moai_id;

    RETURN match_percentage;
END;
$$;


ALTER FUNCTION "public"."calculate_moai_coach_match_percentage"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_moai_urgency_status"("p_moai_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_week_start DATE;
    members_completed INTEGER;
    total_members INTEGER;
    deadline_hours INTEGER;
    urgency_status TEXT;
BEGIN
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE;

    -- Get current week completion stats
    SELECT
                COUNT(*) FILTER (WHERE goal_met = true),
                COUNT(*)
    INTO members_completed, total_members
    FROM public.member_check_ins
    WHERE moai_id = p_moai_id
      AND week_start_date = current_week_start;

    -- Calculate hours until deadline
    SELECT EXTRACT(EPOCH FROM (check_in_deadline - now())) / 3600
    INTO deadline_hours
    FROM public.member_check_ins
    WHERE moai_id = p_moai_id
      AND week_start_date = current_week_start
    LIMIT 1;

    -- Determine urgency
    IF deadline_hours <= 24 AND (members_completed::FLOAT / NULLIF(total_members, 0)) < 0.8 THEN
        urgency_status := 'critical';
    ELSIF deadline_hours <= 72 AND (members_completed::FLOAT / NULLIF(total_members, 0)) < 0.6 THEN
        urgency_status := 'at_risk';
    ELSE
        urgency_status := 'on_track';
    END IF;

    -- Update moai urgency status
    UPDATE public.moais
    SET urgency_status = calculate_moai_urgency_status.urgency_status
    WHERE id = p_moai_id;

    RETURN urgency_status;
END;
$$;


ALTER FUNCTION "public"."calculate_moai_urgency_status"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_monthly_credit"("p_user_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    user_subscription RECORD;
    coached_count INTEGER;
    credit_amount DECIMAL(10,2) := 0.00;
BEGIN
    -- Get user's active coaching subscription
    SELECT * INTO user_subscription
    FROM public.coach_subscriptions cs
    WHERE cs.user_id = p_user_id
      AND cs.status = 'active'
    LIMIT 1;

    -- If no active subscription, return 0
    IF user_subscription IS NULL THEN
        RETURN 0.00;
    END IF;

    -- Get coached members count for this coach
    coached_count := public.get_coached_members_count(p_user_id, user_subscription.coach_id);

    -- Calculate credit based on tier
    credit_amount := public.calculate_credit_tier(coached_count);

    RETURN credit_amount;
END;
$$;


ALTER FUNCTION "public"."calculate_monthly_credit"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_movement_days"("p_profile_id" "uuid", "p_week_start_date" "date") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    movement_days INTEGER;
    week_end_date DATE;
BEGIN
    week_end_date := p_week_start_date + INTERVAL '6 days';

    -- Count distinct dates where user logged activities, excluding Rest Day activities
    SELECT COUNT(DISTINCT DATE(logged_at)) INTO movement_days
    FROM public.activity_logs
    WHERE profile_id = p_profile_id
      AND logged_at >= p_week_start_date
      AND logged_at <= week_end_date + INTERVAL '23 hours 59 minutes 59 seconds'
      AND activity_type != 'Rest Day'; -- Exclude rest days from movement day calculation

    RETURN COALESCE(movement_days, 0);
END;
$$;


ALTER FUNCTION "public"."calculate_movement_days"("p_profile_id" "uuid", "p_week_start_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_movement_days_tz"("p_profile_id" "uuid", "p_week_start_date" "date", "p_timezone" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    movement_days INTEGER;
    week_end_date DATE;
BEGIN
    week_end_date := p_week_start_date + INTERVAL '6 days';

    -- Count distinct dates where user logged activities, excluding Rest Day activities
    SELECT COUNT(DISTINCT DATE(logged_at AT TIME ZONE p_timezone)) INTO movement_days
    FROM public.activity_logs
    WHERE profile_id = p_profile_id
      AND logged_at >= (p_week_start_date::timestamp AT TIME ZONE p_timezone)
      AND logged_at <= ((week_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE p_timezone)
      AND activity_type != 'Rest Day'; -- Exclude rest days from movement day calculation

    RETURN COALESCE(movement_days, 0);
END;
$$;


ALTER FUNCTION "public"."calculate_movement_days_tz"("p_profile_id" "uuid", "p_week_start_date" "date", "p_timezone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_weekly_member_insights"("p_moai_id" "uuid", "p_week_start_date" "date") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    member_record RECORD;
    week_end_date DATE;
    workouts_assigned INTEGER;
    workouts_completed INTEGER;
    missed_days INTEGER;
    current_streak INTEGER;
    last_activity DATE;
    engagement_score NUMERIC;
    red_flags TEXT[];
BEGIN
    week_end_date := p_week_start_date + INTERVAL '6 days';

    -- Loop through all active members of the moai
    FOR member_record IN
        SELECT mm.profile_id
        FROM public.moai_members mm
        WHERE mm.moai_id = p_moai_id AND mm.is_active = true
        LOOP
            -- Calculate metrics for this member
            SELECT COUNT(*) INTO workouts_assigned
            FROM public.program_weeks pw
                     JOIN public.moais m ON m.current_program_id = pw.program_id
            WHERE m.id = p_moai_id
              AND pw.week_number = EXTRACT(WEEK FROM p_week_start_date);

            SELECT COUNT(*) INTO workouts_completed
            FROM public.workout_completions wc
            WHERE wc.profile_id = member_record.profile_id
              AND wc.completed_at >= p_week_start_date
              AND wc.completed_at < week_end_date + INTERVAL '1 day';

            -- Calculate missed days (days without any activity)
            SELECT 7 - COUNT(DISTINCT DATE(al.logged_at)) INTO missed_days
            FROM public.activity_logs al
            WHERE al.profile_id = member_record.profile_id
              AND al.logged_at >= p_week_start_date
              AND al.logged_at < week_end_date + INTERVAL '1 day';

            -- Get current streak
            SELECT COALESCE(was.activity_count, 0) INTO current_streak
            FROM public.weekly_activity_summary was
            WHERE was.profile_id = member_record.profile_id
              AND was.week_start_date = p_week_start_date;

            -- Get last activity date
            SELECT MAX(DATE(al.logged_at)) INTO last_activity
            FROM public.activity_logs al
            WHERE al.profile_id = member_record.profile_id;

            -- Calculate engagement score (0-100)
            engagement_score := CASE
                                    WHEN workouts_assigned > 0 THEN (workouts_completed::NUMERIC / workouts_assigned::NUMERIC) * 100
                                    ELSE 0
                END;

            -- Determine red flags
            red_flags := ARRAY[]::TEXT[];
            IF missed_days >= 3 THEN
                red_flags := array_append(red_flags, 'High missed days');
            END IF;
            IF last_activity < CURRENT_DATE - INTERVAL '3 days' THEN
                red_flags := array_append(red_flags, 'Inactive 3+ days');
            END IF;
            IF engagement_score < 50 THEN
                red_flags := array_append(red_flags, 'Low completion rate');
            END IF;

            -- Insert or update insights
            INSERT INTO public.coach_member_insights (
                moai_id, profile_id, week_start_date, workouts_assigned, workouts_completed,
                goals_achieved_percentage, missed_workout_days, current_streak,
                last_activity_date, engagement_score, red_flag_alerts
            ) VALUES (
                         p_moai_id, member_record.profile_id, p_week_start_date, workouts_assigned, workouts_completed,
                         engagement_score, missed_days, current_streak,
                         last_activity, engagement_score, red_flags
                     ) ON CONFLICT (moai_id, profile_id, week_start_date)
                DO UPDATE SET
                              workouts_assigned = EXCLUDED.workouts_assigned,
                              workouts_completed = EXCLUDED.workouts_completed,
                              goals_achieved_percentage = EXCLUDED.goals_achieved_percentage,
                              missed_workout_days = EXCLUDED.missed_workout_days,
                              current_streak = EXCLUDED.current_streak,
                              last_activity_date = EXCLUDED.last_activity_date,
                              engagement_score = EXCLUDED.engagement_score,
                              red_flag_alerts = EXCLUDED.red_flag_alerts,
                              updated_at = now();
        END LOOP;
END;
$$;


ALTER FUNCTION "public"."calculate_weekly_member_insights"("p_moai_id" "uuid", "p_week_start_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_create_new_moai"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_moai_count INTEGER;
BEGIN
    SELECT count(*)
    INTO v_moai_count
    FROM public.moais
    WHERE creator_id = p_user_id
      AND is_active = true
      AND is_archived = false;

    RETURN v_moai_count = 0;
END;
$$;


ALTER FUNCTION "public"."can_user_create_new_moai"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_view_moai"("p_moai_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_moai_type moai_type;
    v_creator_id uuid;
BEGIN
    -- Get moai details
    SELECT moai_type, creator_id INTO v_moai_type, v_creator_id
    FROM moais WHERE id = p_moai_id;

    -- Public moais are viewable by everyone
    IF v_moai_type = 'public' THEN
        RETURN true;
    END IF;

    -- Creator can always view their moai
    IF v_creator_id = p_user_id THEN
        RETURN true;
    END IF;

    -- Check if user is a member (bypassing RLS)
    RETURN EXISTS (
        SELECT 1 FROM moai_members mm
        WHERE mm.moai_id = p_moai_id
          AND mm.profile_id = p_user_id
          AND mm.is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."can_user_view_moai"("p_moai_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."capture_weekly_snapshots"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_week_start DATE;
    moai_record RECORD;
    member_record RECORD;
    activity_count INTEGER;
    commitment_met BOOLEAN;
BEGIN
    -- Get the start of the current week (Monday)
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE;

    -- Loop through all active moais
    FOR moai_record IN
        SELECT id, weekly_commitment_goal
        FROM public.moais
        WHERE is_active = true AND NOT is_archived
        LOOP
            -- Loop through all active members of this moai
            FOR member_record IN
                SELECT profile_id
                FROM public.moai_members
                WHERE moai_id = moai_record.id AND is_active = true
                LOOP
                    -- Count activities logged this week
                    SELECT COUNT(*) INTO activity_count
                    FROM public.activity_logs
                    WHERE profile_id = member_record.profile_id
                      AND logged_at >= current_week_start
                      AND logged_at < current_week_start + INTERVAL '7 days';

                    -- Check if commitment was met
                    commitment_met := activity_count >= moai_record.weekly_commitment_goal;

                    -- Insert or update snapshot
                    INSERT INTO public.moai_weekly_snapshots (
                        moai_id,
                        week_start_date,
                        member_id,
                        activities_logged_this_week,
                        met_weekly_commitment
                    ) VALUES (
                                 moai_record.id,
                                 current_week_start,
                                 member_record.profile_id,
                                 activity_count,
                                 commitment_met
                             ) ON CONFLICT (moai_id, week_start_date, member_id)
                        DO UPDATE SET
                                      activities_logged_this_week = EXCLUDED.activities_logged_this_week,
                                      met_weekly_commitment = EXCLUDED.met_weekly_commitment,
                                      updated_at = now();
                END LOOP;
        END LOOP;
END;
$$;


ALTER FUNCTION "public"."capture_weekly_snapshots"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_award_elite_week"("p_moai_id" "uuid", "p_week_start_date" "date") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_members_required INTEGER;
    v_members_completed INTEGER;
    v_elite_week_achieved BOOLEAN := false;
    v_member_record RECORD;
    v_commitment_goal INTEGER;
    v_movement_days INTEGER;
    v_user_timezone TEXT := 'America/Los_Angeles';
BEGIN
    -- Get total active members count
    SELECT COUNT(*) INTO v_members_required
    FROM public.moai_members
    WHERE moai_id = p_moai_id AND is_active = true;

    IF v_members_required = 0 THEN
        RETURN false;
    END IF;

    -- Check each member's commitment completion
    v_members_completed := 0;

    FOR v_member_record IN
        SELECT profile_id FROM public.moai_members
        WHERE moai_id = p_moai_id AND is_active = true
        LOOP
            -- Get member's commitment goal for this week
            SELECT movement_days_goal INTO v_commitment_goal
            FROM public.user_commitments
            WHERE profile_id = v_member_record.profile_id
              AND week_start_date = p_week_start_date
            ORDER BY created_at DESC
            LIMIT 1;

            -- If no commitment for this week, get most recent
            IF v_commitment_goal IS NULL THEN
                SELECT movement_days_goal INTO v_commitment_goal
                FROM public.user_commitments
                WHERE profile_id = v_member_record.profile_id
                ORDER BY week_start_date DESC, created_at DESC
                LIMIT 1;
            END IF;

            -- Default to moai's weekly goal if no personal commitment
            IF v_commitment_goal IS NULL THEN
                SELECT weekly_commitment_goal INTO v_commitment_goal
                FROM public.moais
                WHERE id = p_moai_id;
            END IF;

            -- Default to 5 if still null
            v_commitment_goal := COALESCE(v_commitment_goal, 5);

            -- Calculate member's movement days for this week using existing function
            SELECT public.calculate_movement_days_tz(
                           v_member_record.profile_id,
                           p_week_start_date,
                           v_user_timezone
                   ) INTO v_movement_days;

            -- Check if member met their commitment
            IF v_movement_days >= v_commitment_goal THEN
                v_members_completed := v_members_completed + 1;
            END IF;
        END LOOP;

    -- Elite week achieved if ALL members completed their commitments (100%)
    v_elite_week_achieved := (v_members_completed = v_members_required);

    -- Insert or update elite week tracker
    INSERT INTO public.elite_week_tracker (
        moai_id, week_start_date, members_completed, members_required, elite_week_achieved
    ) VALUES (
                 p_moai_id, p_week_start_date, v_members_completed, v_members_required, v_elite_week_achieved
             ) ON CONFLICT (moai_id, week_start_date)
        DO UPDATE SET
                      members_completed = EXCLUDED.members_completed,
                      members_required = EXCLUDED.members_required,
                      elite_week_achieved = EXCLUDED.elite_week_achieved,
                      updated_at = now();

    -- If elite week achieved, check for status/stone unlocks
    IF v_elite_week_achieved THEN
        PERFORM public.check_and_unlock_group_progression(p_moai_id);
    END IF;

    RETURN v_elite_week_achieved;
END;
$$;


ALTER FUNCTION "public"."check_and_award_elite_week"("p_moai_id" "uuid", "p_week_start_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_award_milestone_badges"("p_profile_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_total INTEGER;
    milestone_levels INTEGER[] := ARRAY[10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    milestone_names TEXT[] := ARRAY['Spark', 'Momentum', 'On Fire', 'Resilient', 'Relentless', 'Charged Up', 'Machine Mode', 'Lift Off', 'Climber', 'Pathfinder', 'Untamed', 'Legend'];
    milestone_icons TEXT[] := ARRAY['⭐️', '🍃', '🔥', '💪', '🏃', '⚡', '🧱', '🚀', '⛰️', '🧭', '🐉', '🏆'];
    milestone_descriptions TEXT[] := ARRAY[
        'You''ve started moving. Let''s go!',
        'You''ve got a rhythm. Keep it up.',
        'You''re heating up. 100 down.',
        'Strength in numbers — 200 strong.',
        'You never miss. Keep chasing.',
        'Energy for days. ⚡️ Charged.',
        'Built different. You''re a machine.',
        'You''ve launched. Sky''s the limit.',
        'Every rep is a step higher.',
        'You''ve found your groove.',
        'You''ve unlocked beast mode.',
        'You made history. Legend. 🏆'
        ];
    milestone_keys TEXT[] := ARRAY['spark', 'momentum', 'on_fire', 'resilient', 'relentless', 'charged_up', 'machine_mode', 'lift_off', 'climber', 'pathfinder', 'untamed', 'legend'];
    i INTEGER;
BEGIN
    -- Get current total activities
    SELECT total_activities_logged INTO current_total
    FROM public.profiles
    WHERE id = p_profile_id;

    -- Check each milestone
    FOR i IN 1..array_length(milestone_levels, 1) LOOP
            IF current_total >= milestone_levels[i] THEN
                -- Insert badge if not already awarded
                INSERT INTO public.user_badges (
                    profile_id,
                    badge_type,
                    badge_key,
                    badge_name,
                    badge_icon,
                    badge_description,
                    milestone_value
                ) VALUES (
                             p_profile_id,
                             'milestone',
                             milestone_keys[i],
                             milestone_names[i],
                             milestone_icons[i],
                             milestone_descriptions[i],
                             milestone_levels[i]
                         ) ON CONFLICT (profile_id, badge_key) DO NOTHING;
            END IF;
        END LOOP;
END;
$$;


ALTER FUNCTION "public"."check_and_award_milestone_badges"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_award_moai_mover_badge"("p_profile_id" "uuid", "p_week_start_date" "date") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    activity_days INTEGER;
    current_streak INTEGER := 0;
    week_end_date DATE;
BEGIN
    week_end_date := p_week_start_date + INTERVAL '6 days';

    -- Count distinct days with activities in the week
    SELECT COUNT(DISTINCT DATE(logged_at)) INTO activity_days
    FROM public.activity_logs
    WHERE profile_id = p_profile_id
      AND logged_at >= p_week_start_date
      AND logged_at <= week_end_date;

    -- If 5+ days, award or update moai mover badge
    IF activity_days >= 5 THEN
        -- Get current streak count
        SELECT COALESCE(milestone_value, 0) + 1 INTO current_streak
        FROM public.user_badges
        WHERE profile_id = p_profile_id
          AND badge_key = 'moai_mover'
        ORDER BY earned_at DESC
        LIMIT 1;

        IF current_streak = 0 THEN
            current_streak := 1;
        END IF;

        -- Insert new moai mover badge entry
        INSERT INTO public.user_badges (
            profile_id,
            badge_type,
            badge_key,
            badge_name,
            badge_icon,
            badge_description,
            milestone_value
        ) VALUES (
                     p_profile_id,
                     'moai_mover',
                     'moai_mover',
                     'Moai Mover',
                     '🌀',
                     'Active 5+ days this week',
                     current_streak
                 );
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_and_award_moai_mover_badge"("p_profile_id" "uuid", "p_week_start_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_create_group_coaching_chat"("p_moai_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    match_percentage NUMERIC;
    dominant_coach_id UUID;
BEGIN
    -- Calculate current match percentage
    match_percentage := public.calculate_moai_coach_match_percentage(p_moai_id);

    -- If 100% match, create group coaching chat
    IF match_percentage = 100 THEN
        -- Find the dominant coach
        SELECT cs.coach_id INTO dominant_coach_id
        FROM public.coach_subscriptions cs
                 JOIN public.moai_members mm ON mm.profile_id = cs.user_id
        WHERE mm.moai_id = p_moai_id
          AND mm.is_active = true
          AND cs.status = 'active'
        GROUP BY cs.coach_id
        ORDER BY COUNT(*) DESC
        LIMIT 1;

        -- Create group coaching chat if it doesn't exist
        INSERT INTO public.moai_coaching_chats (moai_id, coach_id, unlock_percentage)
        VALUES (p_moai_id, dominant_coach_id, 100)
        ON CONFLICT (moai_id, coach_id)
            DO UPDATE SET
                          is_active = true,
                          unlock_percentage = 100;
    ELSE
        -- Deactivate group coaching chat if percentage drops below 100%
        UPDATE public.moai_coaching_chats
        SET is_active = false, unlock_percentage = match_percentage
        WHERE moai_id = p_moai_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_and_create_group_coaching_chat"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_unlock_group_progression"("p_moai_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_elite_weeks_count INTEGER;
    v_current_status_count INTEGER;
    v_new_status_number INTEGER;
    v_new_stone_number INTEGER;
    v_status_names TEXT[] := ARRAY[
        'The First Step', 'The Quiet Rhythm', 'The Gathered Circle', 'The Shared Pulse',
        'The Steady Builders', 'The Promise Keepers', 'The Consistency Weavers', 'The Anchored Companions',
        'The Momentum Holders', 'The Rhythm Protectors', 'The Habit Guardians', 'The Flow Carriers',
        'The Integrity Builders', 'The Path Makers', 'The Legacy Shapers', 'The Moai Keepers',
        'The Cultural Anchors', 'The Trust Pillars', 'The Timeless Companions', 'The Eternal Circle'
        ];
    v_status_descriptions TEXT[] := ARRAY[
        'Your Moai has started its shared journey.',
        'You''ve begun to move together, steadily.',
        'Your group is forming strong connections.',
        'You now move in sync, week by week.',
        'Your rhythm is building something real.',
        'Your group is known for keeping its word.',
        'Your habits are tightly connected now.',
        'You''ve become a reliable social anchor.',
        'Your group protects its steady progress.',
        'You actively guard your shared pace.',
        'You''re stewards of your weekly routines.',
        'You help each other keep moving forward.',
        'You''ve built a culture of trust.',
        'You''ve paved a steady path together.',
        'Your Moai''s story is becoming lasting.',
        'You now protect your group''s identity.',
        'You''ve shaped your Moai''s social rhythm.',
        'You''ve become a rock for each other.',
        'Your journey now carries deep history.',
        'You''ve built a group that transcends time.'
        ];
    v_stone_names TEXT[] := ARRAY[
        'The First Stone', 'The Bound Stone', 'The Steadfast Stone', 'The Legacy Stone', 'The Eternal Stone'
        ];
    v_stone_descriptions TEXT[] := ARRAY[
        'The foundation stone of your shared journey.',
        'A stone symbolizing your group''s tight bond.',
        'A stone that marks your group''s resilience.',
        'A stone that holds your Moai''s growing story.',
        'The stone that cements your unshakable bond.'
        ];
BEGIN
    -- Count total elite weeks achieved
    SELECT COUNT(*) INTO v_elite_weeks_count
    FROM public.elite_week_tracker
    WHERE moai_id = p_moai_id AND elite_week_achieved = true;

    -- Count current statuses
    SELECT COUNT(*) INTO v_current_status_count
    FROM public.group_statuses
    WHERE moai_id = p_moai_id;

    -- Check for new status unlock (every 4 elite weeks)
    v_new_status_number := (v_elite_weeks_count / 4);

    IF v_new_status_number > v_current_status_count AND v_new_status_number <= 20 THEN
        -- Unlock new status
        INSERT INTO public.group_statuses (
            moai_id, status_number, status_name, status_description, elite_weeks_completed
        ) VALUES (
                     p_moai_id, v_new_status_number,
                     v_status_names[v_new_status_number],
                     v_status_descriptions[v_new_status_number],
                     v_elite_weeks_count
                 );

        -- Create notification for status unlock
        INSERT INTO public.notifications (profile_id, type, content, related_entity_id)
        SELECT mm.profile_id, 'group_status_unlock',
               'Your Moai has earned ' || v_status_names[v_new_status_number] || ' status. ' || v_status_descriptions[v_new_status_number],
               p_moai_id
        FROM public.moai_members mm
        WHERE mm.moai_id = p_moai_id AND mm.is_active = true;

        -- Check for stone unlock (every 4 statuses = 16 elite weeks)
        v_new_stone_number := (v_new_status_number / 4);

        IF v_new_stone_number > 0 AND v_new_stone_number <= 5 AND
           NOT EXISTS (SELECT 1 FROM public.group_stones WHERE moai_id = p_moai_id AND stone_number = v_new_stone_number) THEN
            -- Unlock new stone
            INSERT INTO public.group_stones (
                moai_id, stone_number, stone_name, stone_description, statuses_completed
            ) VALUES (
                         p_moai_id, v_new_stone_number,
                         v_stone_names[v_new_stone_number],
                         v_stone_descriptions[v_new_stone_number],
                         v_new_status_number
                     );

            -- Create notification for stone unlock
            INSERT INTO public.notifications (profile_id, type, content, related_entity_id)
            SELECT mm.profile_id, 'group_stone_unlock',
                   'Your Moai has placed ' || v_stone_names[v_new_stone_number] || '. ' || v_stone_descriptions[v_new_stone_number],
                   p_moai_id
            FROM public.moai_members mm
            WHERE mm.moai_id = p_moai_id AND mm.is_active = true;
        END IF;
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_and_unlock_group_progression"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_is_any_moai_member_for_rls"("p_moai_id" "uuid", "p_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM moai_members mm
        WHERE mm.moai_id = p_moai_id AND mm.profile_id = p_profile_id
    );
END;
$$;


ALTER FUNCTION "public"."check_is_any_moai_member_for_rls"("p_moai_id" "uuid", "p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_permission"("p_user_id" "uuid", "p_permission_key" "text", "p_moai_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    v_permission_id uuid;
    v_has_permission boolean := false;
BEGIN

    SELECT id INTO v_permission_id FROM public.permissions WHERE key = p_permission_key;

    IF v_permission_id IS NULL THEN
        RAISE WARNING 'Permission key % not found', p_permission_key;
        RETURN false;
    END IF;

    -- 1. Check direct user-specific permission for the given Moai (from moai_permissions)
    IF p_moai_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.moai_permissions mp
            WHERE mp.profile_id = p_user_id
              AND mp.moai_id = p_moai_id
              AND mp.permission_id = v_permission_id
        ) INTO v_has_permission;
        IF v_has_permission THEN RETURN true; END IF;
    END IF;

    -- 2. Check permissions granted by global roles (user_roles -> role_permissions)
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
                 JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.user_id = p_user_id AND rp.permission_id = v_permission_id
    ) INTO v_has_permission;
    IF v_has_permission THEN RETURN true; END IF;

    -- 3. Check permissions derived from moai_members.role_in_moai (contextual role within a moai)
    IF p_moai_id IS NOT NULL THEN
        DECLARE
            v_moai_member_context_role public.moai_member_role; -- Using your existing ENUM type
            v_mapped_global_role_name TEXT;
        BEGIN
            SELECT mm.role_in_moai INTO v_moai_member_context_role
            FROM public.moai_members mm
            WHERE mm.profile_id = p_user_id AND mm.moai_id = p_moai_id AND mm.is_active = true;

            IF v_moai_member_context_role IS NOT NULL THEN
                -- Map moai_member_role (enum) to a global role name (text in public.roles)
                -- This mapping is crucial and depends on your design.
                IF v_moai_member_context_role = 'admin'::public.moai_member_role THEN
                    v_mapped_global_role_name := 'MoaiAdmin'; -- This name MUST exist in public.roles
                ELSIF v_moai_member_context_role = 'coach'::public.moai_member_role THEN
                    v_mapped_global_role_name := 'MoaiCoach'; -- This name MUST exist in public.roles
                -- Add other mappings if 'member' in moai_members.role_in_moai implies different permissions
                -- than the global 'Member' role. For now, we assume 'member' doesn't grant extra moai-contextual perms here.
                END IF;

                IF v_mapped_global_role_name IS NOT NULL THEN
                    SELECT EXISTS (
                        SELECT 1
                        FROM public.roles r
                                 JOIN public.role_permissions rp ON r.id = rp.role_id
                        WHERE r.name = v_mapped_global_role_name
                          AND rp.permission_id = v_permission_id
                    ) INTO v_has_permission;
                    IF v_has_permission THEN RETURN true; END IF;
                END IF;
            END IF;
        END;
    END IF;

    RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_permission"("p_user_id" "uuid", "p_permission_key" "text", "p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."coach_can_access_moai"("p_coach_profile_id" "uuid", "p_moai_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.coach_relationships cr
                          JOIN public.coaches c ON c.id = cr.coach_id
        WHERE c.profile_id = p_coach_profile_id
          AND cr.moai_id = p_moai_id
          AND cr.relationship_type = 'moai'
          AND cr.status = 'active'
    );
END;
$$;


ALTER FUNCTION "public"."coach_can_access_moai"("p_coach_profile_id" "uuid", "p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."coach_can_access_user"("p_coach_profile_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.coach_relationships cr
                          JOIN public.coaches c ON c.id = cr.coach_id
        WHERE c.profile_id = p_coach_profile_id
          AND (
            (cr.user_id = p_user_id AND cr.relationship_type = '1v1') OR
            (cr.relationship_type = 'moai' AND EXISTS (
                SELECT 1 FROM public.moai_members mm
                WHERE mm.moai_id = cr.moai_id
                  AND mm.profile_id = p_user_id
                  AND mm.is_active = true
            ))
            )
          AND cr.status = 'active'
    );
END;
$$;


ALTER FUNCTION "public"."coach_can_access_user"("p_coach_profile_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_activity_tag"("tag_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    tag_record RECORD;
    new_activity_id UUID;
BEGIN
    -- Get the tag record
    SELECT at.*, al.activity_type, al.emoji, al.logged_at, al.notes
    INTO tag_record
    FROM public.activity_tags at
             JOIN public.activity_logs al ON at.activity_log_id = al.id
    WHERE at.id = tag_id
      AND at.tagged_user_id = auth.uid()
      AND at.status = 'pending'
      AND at.expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tag not found or expired';
    END IF;

    -- Create the linked activity log
    INSERT INTO public.activity_logs (
        profile_id,
        activity_type,
        emoji,
        logged_at,
        notes
    ) VALUES (
                 tag_record.tagged_user_id,
                 tag_record.activity_type,
                 tag_record.emoji,
                 tag_record.logged_at,
                 'Tagged by partner: ' || COALESCE(tag_record.notes, '')
             ) RETURNING id INTO new_activity_id;

    -- Update the tag status
    UPDATE public.activity_tags
    SET status = 'confirmed',
        responded_at = NOW(),
        linked_activity_log_id = new_activity_id
    WHERE id = tag_id;

    -- Create notification for original tagger
    INSERT INTO public.notifications (
        profile_id,
        type,
        content,
        related_entity_id
    ) VALUES (
                 tag_record.tagged_by_user_id,
                 'tag_confirmed',
                 'Your workout tag was confirmed!',
                 tag_record.activity_log_id
             );

    RETURN new_activity_id;
END;
$$;


ALTER FUNCTION "public"."confirm_activity_tag"("tag_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_user_active_moais"("p_profile_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    active_moai_count integer;
BEGIN
    -- Count active, non-archived moais for the user
    SELECT COUNT(*)
    INTO active_moai_count
    FROM public.moai_members mm
             JOIN public.moais m ON mm.moai_id = m.id
    WHERE mm.profile_id = p_profile_id
      AND mm.is_active = true
      AND m.is_active = true
      AND m.is_archived = false;

    RETURN active_moai_count;
END;
$$;


ALTER FUNCTION "public"."count_user_active_moais"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_buddy_chat_channel"("p_moai_id" "uuid", "p_week_start_date" "date", "p_buddy_group" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    buddy_names TEXT[];
    chat_name TEXT;
    channel_id UUID;
BEGIN
    -- Get buddy names for chat title
    SELECT ARRAY_AGG(COALESCE(first_name, 'Member'))
    INTO buddy_names
    FROM public.profiles
    WHERE id = ANY(
        SELECT jsonb_array_elements_text(p_buddy_group)::UUID
    );

    -- Create chat name
    chat_name := array_to_string(buddy_names, ' & ') || ' - Week ' ||
                 EXTRACT(WEEK FROM p_week_start_date);

    -- Insert or update buddy chat channel
    INSERT INTO public.buddy_chat_channels (
        moai_id, week_start_date, buddy_group, chat_name
    ) VALUES (
                 p_moai_id, p_week_start_date, p_buddy_group, chat_name
             )
    ON CONFLICT (moai_id, week_start_date, buddy_group)
        DO UPDATE SET
                      is_active = TRUE,
                      updated_at = NOW(),
                      chat_name = EXCLUDED.chat_name
    RETURNING id INTO channel_id;

    -- Send welcome message to buddy chat
    INSERT INTO public.messages (
        moai_id, profile_id, content, message_type,
        is_buddy_chat, buddy_chat_week_start
    ) VALUES (
                 p_moai_id,
                 (SELECT id FROM auth.users WHERE email = 'system@moai.com' LIMIT 1),
                 '🤝 Welcome to your weekly accountability buddy chat! Support each other this week and share your progress.',
                 'system',
                 TRUE,
                 p_week_start_date
             );

    RETURN channel_id;
END;
$$;


ALTER FUNCTION "public"."create_buddy_chat_channel"("p_moai_id" "uuid", "p_week_start_date" "date", "p_buddy_group" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_moai_invitation"("p_moai_id" "uuid", "p_max_uses" integer DEFAULT NULL::integer, "p_expires_hours" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invite_code text;
    v_expires_at timestamp with time zone;
    v_invitation_id uuid;
BEGIN
    -- Check if user is a member of the moai
    IF NOT EXISTS (
        SELECT 1 FROM public.moai_members
        WHERE moai_id = p_moai_id
          AND profile_id = auth.uid()
          AND is_active = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not a member of this moai');
    END IF;

    -- Generate unique invite code
    v_invite_code := encode(gen_random_bytes(6), 'base64');
    v_invite_code := replace(replace(replace(v_invite_code, '/', ''), '+', ''), '=', '');

    -- Set expiration if provided
    IF p_expires_hours IS NOT NULL THEN
        v_expires_at := now() + (p_expires_hours || ' hours')::interval;
    END IF;

    -- Create invitation
    INSERT INTO public.moai_invitations (
        moai_id, invited_by, invite_code, max_uses, expires_at
    ) VALUES (
                 p_moai_id, auth.uid(), v_invite_code, p_max_uses, v_expires_at
             ) RETURNING id INTO v_invitation_id;

    RETURN jsonb_build_object(
            'success', true,
            'invitation_id', v_invitation_id,
            'invite_code', v_invite_code,
            'expires_at', v_expires_at
           );
END;
$$;


ALTER FUNCTION "public"."create_moai_invitation"("p_moai_id" "uuid", "p_max_uses" integer, "p_expires_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_weekly_buddy_pairings"("p_moai_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    member_ids UUID[];
    current_week DATE;
    previous_week DATE;
    previous_pairings JSONB[];
    shuffled_members UUID[];
    i INTEGER;
    group_size INTEGER;
    current_group JSONB;
BEGIN
    -- Get the start of current week (Monday)
    current_week := date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '1 day';
    previous_week := current_week - INTERVAL '7 days';

    -- Get all active members of the moai
    SELECT ARRAY_AGG(profile_id) INTO member_ids
    FROM public.moai_members
    WHERE moai_id = p_moai_id AND is_active = true;

    IF array_length(member_ids, 1) < 2 THEN
        RETURN; -- Need at least 2 members
    END IF;

    -- Get previous week's pairings to avoid repeats
    SELECT ARRAY_AGG(buddy_group) INTO previous_pairings
    FROM public.weekly_buddy_pairings
    WHERE moai_id = p_moai_id AND week_start_date = previous_week;

    -- Simple shuffle algorithm (Fisher-Yates)
    shuffled_members := member_ids;
    FOR i IN REVERSE array_length(shuffled_members, 1)..2 LOOP
            shuffled_members := array_cat(
                    shuffled_members[1:floor(random() * i)::int],
                    ARRAY[shuffled_members[i]],
                    shuffled_members[floor(random() * i)::int + 1:i-1],
                    shuffled_members[i+1:array_length(shuffled_members, 1)]
                                );
        END LOOP;

    -- Create pairs (groups of 2, with one group of 3 if odd number)
    i := 1;
    WHILE i <= array_length(shuffled_members, 1) LOOP
            IF i = array_length(shuffled_members, 1) - 1 AND
               array_length(shuffled_members, 1) % 2 = 1 THEN
                -- Last group of 3 if odd total
                current_group := to_jsonb(ARRAY[shuffled_members[i], shuffled_members[i+1], shuffled_members[i+2]]);
                i := i + 3;
            ELSE
                -- Regular pair
                current_group := to_jsonb(ARRAY[shuffled_members[i], shuffled_members[i+1]]);
                i := i + 2;
            END IF;

            -- Insert the pairing
            INSERT INTO public.weekly_buddy_pairings (week_start_date, moai_id, buddy_group)
            VALUES (current_week, p_moai_id, current_group);
        END LOOP;

    -- Create notifications for new buddy assignments
    FOR i IN 1..array_length(shuffled_members, 1) LOOP
            -- Find this member's buddy group
            SELECT buddy_group INTO current_group
            FROM public.weekly_buddy_pairings
            WHERE moai_id = p_moai_id
              AND week_start_date = current_week
              AND buddy_group ? shuffled_members[i]::text;

            IF current_group IS NOT NULL THEN
                INSERT INTO public.notifications (profile_id, type, content, related_entity_id)
                VALUES (
                           shuffled_members[i],
                           'buddy_assignment',
                           'You have new accountability buddies this week!',
                           p_moai_id
                       );
            END IF;
        END LOOP;
END;
$$;


ALTER FUNCTION "public"."create_weekly_buddy_pairings"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_weekly_buddy_pairings_enhanced"("p_moai_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    member_ids UUID[];
    current_week DATE;
    previous_pairings JSONB[];
    shuffled_members UUID[];
    i INTEGER;
    j INTEGER;
    temp_id UUID;
    current_group JSONB;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
    valid_pairing BOOLEAN := false;
BEGIN
    -- Get the start of current week (Monday)
    current_week := date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '1 day';

    -- Get all active members of the moai
    SELECT ARRAY_AGG(profile_id) INTO member_ids
    FROM public.moai_members
    WHERE moai_id = p_moai_id AND is_active = true;

    IF array_length(member_ids, 1) < 2 THEN
        RETURN; -- Need at least 2 members
    END IF;

    -- Get previous 4 weeks of pairings to avoid recent repeats
    SELECT ARRAY_AGG(buddy_group) INTO previous_pairings
    FROM public.weekly_buddy_pairings
    WHERE moai_id = p_moai_id
      AND week_start_date >= current_week - INTERVAL '4 weeks'
      AND week_start_date < current_week;

    -- Try to create valid pairings (avoid recent repeats)
    WHILE attempt < max_attempts AND NOT valid_pairing LOOP
            shuffled_members := member_ids;

            -- Fisher-Yates shuffle
            FOR i IN REVERSE array_length(shuffled_members, 1)..2 LOOP
                    j := 1 + floor(random() * i)::int;
                    temp_id := shuffled_members[i];
                    shuffled_members[i] := shuffled_members[j];
                    shuffled_members[j] := temp_id;
                END LOOP;

            -- Check if this arrangement avoids recent pairings
            valid_pairing := true;
            i := 1;

            WHILE i <= array_length(shuffled_members, 1) AND valid_pairing LOOP
                    IF i = array_length(shuffled_members, 1) - 1 AND
                       array_length(shuffled_members, 1) % 2 = 1 THEN
                        -- Group of 3
                        current_group := to_jsonb(ARRAY[shuffled_members[i], shuffled_members[i+1], shuffled_members[i+2]]);
                        i := i + 3;
                    ELSE
                        -- Pair
                        current_group := to_jsonb(ARRAY[shuffled_members[i], shuffled_members[i+1]]);
                        i := i + 2;
                    END IF;

                    -- Check if this pairing existed recently
                    IF previous_pairings IS NOT NULL THEN
                        FOR j IN 1..array_length(previous_pairings, 1) LOOP
                                IF previous_pairings[j] @> current_group OR current_group @> previous_pairings[j] THEN
                                    valid_pairing := false;
                                    EXIT;
                                END IF;
                            END LOOP;
                    END IF;
                END LOOP;

            attempt := attempt + 1;
        END LOOP;

    -- Create the pairings (even if not perfectly avoiding repeats after max attempts)
    i := 1;
    WHILE i <= array_length(shuffled_members, 1) LOOP
            IF i = array_length(shuffled_members, 1) - 1 AND
               array_length(shuffled_members, 1) % 2 = 1 THEN
                -- Last group of 3 if odd total
                current_group := to_jsonb(ARRAY[shuffled_members[i], shuffled_members[i+1], shuffled_members[i+2]]);
                i := i + 3;
            ELSE
                -- Regular pair
                current_group := to_jsonb(ARRAY[shuffled_members[i], shuffled_members[i+1]]);
                i := i + 2;
            END IF;

            -- Insert the pairing
            INSERT INTO public.weekly_buddy_pairings (week_start_date, moai_id, buddy_group)
            VALUES (current_week, p_moai_id, current_group);
        END LOOP;

    -- Create notifications for new buddy assignments
    FOR i IN 1..array_length(shuffled_members, 1) LOOP
            -- Find this member's buddy group
            SELECT buddy_group INTO current_group
            FROM public.weekly_buddy_pairings
            WHERE moai_id = p_moai_id
              AND week_start_date = current_week
              AND buddy_group ? shuffled_members[i]::text;

            IF current_group IS NOT NULL THEN
                INSERT INTO public.notifications (profile_id, type, content, related_entity_id)
                VALUES (
                           shuffled_members[i],
                           'buddy_assignment',
                           'You have new accountability buddies this week! 🤝',
                           p_moai_id
                       );
            END IF;
        END LOOP;
END;
$$;


ALTER FUNCTION "public"."create_weekly_buddy_pairings_enhanced"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decline_activity_tag"("tag_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.activity_tags
    SET status = 'declined',
        responded_at = NOW()
    WHERE id = tag_id
      AND tagged_user_id = auth.uid()
      AND status = 'pending'
      AND expires_at > NOW();

    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."decline_activity_tag"("tag_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM public.coach_program_audio
    WHERE program_id = p_program_id
      AND coach_id = p_coach_id;
END;
$$;


ALTER FUNCTION "public"."delete_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."evaluate_weekly_group_progress"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    moai_record RECORD;
    current_week_start DATE;
    total_members INTEGER;
    members_met_commitment INTEGER;
    success_percentage NUMERIC;
    new_level INTEGER;
    required_weeks_for_level INTEGER;
BEGIN
    -- Get the start of the current week (Monday)
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE;

    -- Loop through all active moais
    FOR moai_record IN
        SELECT id, name, current_tier, current_streak_weeks, consecutive_missed_weeks, cumulative_success_weeks
        FROM public.moais
        WHERE is_active = true AND NOT is_archived
        LOOP
            -- Count total active members
            SELECT COUNT(*) INTO total_members
            FROM public.moai_members
            WHERE moai_id = moai_record.id AND is_active = true;

            -- Skip if no members
            IF total_members = 0 THEN
                CONTINUE;
            END IF;

            -- Count members who met their commitment this week
            SELECT COUNT(*) INTO members_met_commitment
            FROM public.moai_weekly_snapshots
            WHERE moai_id = moai_record.id
              AND week_start_date = current_week_start
              AND met_weekly_commitment = true;

            -- Calculate success percentage
            success_percentage := (members_met_commitment::NUMERIC / total_members::NUMERIC) * 100;

            -- Determine if group met 80% threshold
            IF success_percentage >= 80 THEN
                -- Group succeeded - increment success counters and reset missed weeks
                UPDATE public.moais
                SET
                    cumulative_success_weeks = cumulative_success_weeks + 1,
                    current_streak_weeks = current_streak_weeks + 1,
                    consecutive_missed_weeks = 0,
                    updated_at = now()
                WHERE id = moai_record.id;

                -- Calculate new level based on cumulative success weeks
                -- Level 1: 0 weeks, Level 2: 4 weeks, Level 3: 8 weeks, etc.
                new_level := LEAST(20, (moai_record.cumulative_success_weeks + 1) / 4 + 1);

                -- Update level if it has increased
                IF new_level > moai_record.current_tier THEN
                    UPDATE public.moais
                    SET
                        current_tier = new_level,
                        updated_at = now()
                    WHERE id = moai_record.id;

                    -- Log level advancement for debugging
                    RAISE NOTICE 'Moai % advanced to level % with % cumulative weeks',
                        moai_record.name, new_level, moai_record.cumulative_success_weeks + 1;
                END IF;

            ELSE
                -- Group failed - reset streak and increment missed weeks
                UPDATE public.moais
                SET
                    current_streak_weeks = 0,
                    consecutive_missed_weeks = consecutive_missed_weeks + 1,
                    updated_at = now()
                WHERE id = moai_record.id;

                -- Check if they missed two consecutive weeks - drop level
                IF (moai_record.consecutive_missed_weeks + 1) >= 2 THEN
                    -- Drop level by one (minimum level is 1)
                    IF moai_record.current_tier > 1 THEN
                        UPDATE public.moais
                        SET
                            current_tier = current_tier - 1,
                            consecutive_missed_weeks = 0,
                            updated_at = now()
                        WHERE id = moai_record.id;

                        -- Log level drop for debugging
                        RAISE NOTICE 'Moai % dropped to level % after missing 2 consecutive weeks',
                            moai_record.name, moai_record.current_tier - 1;
                    ELSE
                        -- Already at minimum level, just reset consecutive missed weeks
                        UPDATE public.moais
                        SET
                            consecutive_missed_weeks = 0,
                            updated_at = now()
                        WHERE id = moai_record.id;
                    END IF;
                END IF;
            END IF;

            -- Log the evaluation for debugging
            RAISE NOTICE 'Moai % evaluated: %/% members met commitment (% success)',
                moai_record.name, members_met_commitment, total_members, success_percentage;

        END LOOP;
END;
$$;


ALTER FUNCTION "public"."evaluate_weekly_group_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."evaluate_weekly_moai_progress"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_week_start DATE;
    moai_record RECORD;
    total_members INTEGER;
    committed_members INTEGER;
    success_percentage NUMERIC;
    current_tier INTEGER;
    new_tier INTEGER;
BEGIN
    -- Get the start of the current week (Monday)
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE;

    -- Loop through all active moais
    FOR moai_record IN
        SELECT id, name, current_tier, cumulative_success_weeks,
               current_streak_weeks, consecutive_missed_weeks
        FROM public.moais
        WHERE is_active = true AND NOT is_archived
        LOOP
            -- Count total active members
            SELECT COUNT(*) INTO total_members
            FROM public.moai_members
            WHERE moai_id = moai_record.id AND is_active = true;

            -- Skip if no members
            IF total_members = 0 THEN
                CONTINUE;
            END IF;

            -- Count members who met their commitment this week
            SELECT COUNT(*) INTO committed_members
            FROM public.moai_weekly_snapshots
            WHERE moai_id = moai_record.id
              AND week_start_date = current_week_start
              AND met_weekly_commitment = true;

            -- Calculate success percentage
            success_percentage := (committed_members::NUMERIC / total_members::NUMERIC) * 100;

            -- Determine if group met 80% threshold
            IF success_percentage >= 80 THEN
                -- Group succeeded this week
                UPDATE public.moais
                SET
                    cumulative_success_weeks = cumulative_success_weeks + 1,
                    current_streak_weeks = current_streak_weeks + 1,
                    consecutive_missed_weeks = 0,
                    updated_at = now()
                WHERE id = moai_record.id;

                RAISE NOTICE 'Moai % succeeded this week (%.1f%% commitment)', moai_record.name, success_percentage;

            ELSE
                -- Group failed this week
                current_tier := moai_record.current_tier;
                new_tier := current_tier;

                -- Check if this is the second consecutive miss
                IF moai_record.consecutive_missed_weeks + 1 >= 2 THEN
                    -- Drop tier by one level (minimum tier 1)
                    new_tier := GREATEST(current_tier - 1, 1);

                    UPDATE public.moais
                    SET
                        current_streak_weeks = 0,
                        consecutive_missed_weeks = 0,
                        current_tier = new_tier,
                        updated_at = now()
                    WHERE id = moai_record.id;

                    RAISE NOTICE 'Moai % dropped to tier % after 2 consecutive misses (%.1f%% commitment)',
                        moai_record.name, new_tier, success_percentage;
                ELSE
                    -- First miss - reset streak but don't drop tier yet
                    UPDATE public.moais
                    SET
                        current_streak_weeks = 0,
                        consecutive_missed_weeks = consecutive_missed_weeks + 1,
                        updated_at = now()
                    WHERE id = moai_record.id;

                    RAISE NOTICE 'Moai % missed week % (%.1f%% commitment)',
                        moai_record.name, moai_record.consecutive_missed_weeks + 1, success_percentage;
                END IF;
            END IF;

            -- Create notification for moai members about progress
            INSERT INTO public.notifications (profile_id, type, content, related_entity_id)
            SELECT
                mm.profile_id,
                'moai_progress',
                CASE
                    WHEN success_percentage >= 80 THEN
                        'Great job! Your Moai met this week''s group goal (' || ROUND(success_percentage, 1) || '% commitment)'
                    WHEN moai_record.consecutive_missed_weeks + 1 >= 2 AND new_tier < current_tier THEN
                        'Your Moai tier dropped due to consecutive missed weeks. Let''s get back on track!'
                    ELSE
                        'Your Moai missed this week''s group goal (' || ROUND(success_percentage, 1) || '% commitment). Let''s improve next week!'
                    END,
                moai_record.id
            FROM public.moai_members mm
            WHERE mm.moai_id = moai_record.id AND mm.is_active = true;

        END LOOP;

    RAISE NOTICE 'Weekly Moai progress evaluation completed for week starting %', current_week_start;
END;
$$;


ALTER FUNCTION "public"."evaluate_weekly_moai_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_coach_alerts"("p_moai_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    coach_record RECORD;
    alert_count INTEGER;
BEGIN
    -- Get coach information
    SELECT m.coach_id, m.name as moai_name
    INTO coach_record
    FROM public.moais m
    WHERE m.id = p_moai_id;

    IF coach_record.coach_id IS NULL THEN
        RETURN;
    END IF;

    -- Alert for members with high missed workouts
    SELECT COUNT(*) INTO alert_count
    FROM public.coach_member_insights cmi
    WHERE cmi.moai_id = p_moai_id
      AND cmi.missed_workout_days >= 3
      AND cmi.week_start_date = date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '1 day';

    IF alert_count > 0 THEN
        INSERT INTO public.coach_alerts (coach_id, moai_id, alert_type, alert_message, severity)
        VALUES (
                   coach_record.coach_id,
                   p_moai_id,
                   'missed_workouts',
                   alert_count || ' members missed 3+ workouts this week in ' || coach_record.moai_name,
                   'high'
               );
    END IF;

    -- Alert for low engagement
    SELECT COUNT(*) INTO alert_count
    FROM public.coach_member_insights cmi
    WHERE cmi.moai_id = p_moai_id
      AND cmi.engagement_score < 50
      AND cmi.week_start_date = date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '1 day';

    IF alert_count > 0 THEN
        INSERT INTO public.coach_alerts (coach_id, moai_id, alert_type, alert_message, severity)
        VALUES (
                   coach_record.coach_id,
                   p_moai_id,
                   'low_engagement',
                   alert_count || ' members have low engagement in ' || coach_record.moai_name,
                   'medium'
               );
    END IF;
END;
$$;


ALTER FUNCTION "public"."generate_coach_alerts"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_coaching_suggestions"("p_member_id" "uuid", "p_moai_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    suggestions TEXT[] := ARRAY[]::TEXT[];
    risk_score NUMERIC;
    last_activity DATE;
    completion_rate NUMERIC;
    days_inactive INTEGER;
BEGIN
    -- Get member data
    risk_score := public.calculate_member_risk_score(p_member_id, p_moai_id);

    SELECT MAX(logged_at)::DATE INTO last_activity
    FROM public.activity_logs
    WHERE profile_id = p_member_id;

    -- Calculate days inactive
    SELECT COALESCE(EXTRACT(days FROM (NOW() - MAX(logged_at))), 999)
    INTO days_inactive
    FROM public.activity_logs
    WHERE profile_id = p_member_id;

    -- Calculate completion rate
    SELECT COALESCE(COUNT(*) FILTER (WHERE logged_at >= CURRENT_DATE - INTERVAL '7 days'), 0) / 7.0
    INTO completion_rate
    FROM public.activity_logs
    WHERE profile_id = p_member_id;

    -- Generate suggestions based on data
    IF risk_score > 70 THEN
        suggestions := array_append(suggestions, 'High risk member - schedule immediate check-in');
    END IF;

    IF days_inactive > 3 THEN
        suggestions := array_append(suggestions, 'Member inactive for 3+ days - send motivational message');
    END IF;

    IF completion_rate < 0.3 THEN
        suggestions := array_append(suggestions, 'Low completion rate - consider program modification');
    END IF;

    IF days_inactive > 7 THEN
        suggestions := array_append(suggestions, 'Member has been inactive for over a week - urgent intervention needed');
    END IF;

    IF array_length(suggestions, 1) IS NULL THEN
        suggestions := array_append(suggestions, 'Member is performing well - continue current approach');
    END IF;

    RETURN suggestions;
END;
$$;


ALTER FUNCTION "public"."generate_coaching_suggestions"("p_member_id" "uuid", "p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_weekly_snapshots"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_week_start DATE;
    moai_record RECORD;
    member_record RECORD;
    activity_count INTEGER;
    commitment_met BOOLEAN;
BEGIN
    -- Get the start of the current week (Monday)
    current_week_start := date_trunc('week', CURRENT_DATE)::DATE;

    -- Loop through all active moais
    FOR moai_record IN
        SELECT id, weekly_commitment_goal
        FROM public.moais
        WHERE is_active = true AND NOT is_archived
        LOOP
            -- Loop through all active members of this moai
            FOR member_record IN
                SELECT profile_id
                FROM public.moai_members
                WHERE moai_id = moai_record.id AND is_active = true
                LOOP
                    -- Count activities for this member in the current week
                    SELECT COUNT(*) INTO activity_count
                    FROM public.activity_logs
                    WHERE profile_id = member_record.profile_id
                      AND logged_at >= current_week_start
                      AND logged_at < current_week_start + INTERVAL '7 days';

                    -- Check if commitment was met
                    commitment_met := activity_count >= moai_record.weekly_commitment_goal;

                    -- Insert or update snapshot
                    INSERT INTO public.moai_weekly_snapshots (
                        moai_id,
                        week_start_date,
                        member_id,
                        activities_logged_this_week,
                        met_weekly_commitment
                    )
                    VALUES (
                               moai_record.id,
                               current_week_start,
                               member_record.profile_id,
                               activity_count,
                               commitment_met
                           )
                    ON CONFLICT (moai_id, member_id, week_start_date)
                        DO UPDATE SET
                                      activities_logged_this_week = EXCLUDED.activities_logged_this_week,
                                      met_weekly_commitment = EXCLUDED.met_weekly_commitment,
                                      updated_at = now();
                END LOOP;
        END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_weekly_snapshots"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_moais_with_capacity"() RETURNS TABLE("id" "uuid", "name" "text", "goal_type" "text", "description" "text", "price" numeric, "capacity" integer, "current_member_count" integer, "spots_remaining" integer, "coach_name" "text", "coach_accountability_style" "text", "is_full" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            m.id,
            m.name,
            m.goal_type,
            m.description,
            m.price,
            m.capacity,
            m.member_count as current_member_count,
            (m.capacity - m.member_count) as spots_remaining,
            COALESCE(p.first_name || ' ' || p.last_name, 'No Coach Assigned') as coach_name,
            COALESCE(p.coach_accountability_style, 'standard') as coach_accountability_style,
            (m.member_count >= m.capacity) as is_full
        FROM public.moais m
                 LEFT JOIN public.profiles p ON m.coach_id = p.id
        WHERE m.is_active = true
          AND m.is_archived = false
          AND m.status = 'active'
        ORDER BY m.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_available_moais_with_capacity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") RETURNS TABLE("id" "uuid", "program_id" "uuid", "coach_id" "uuid", "audio_url" "text", "duration_seconds" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            cpa.id,
            cpa.program_id,
            cpa.coach_id,
            cpa.audio_url,
            cpa.duration_seconds,
            cpa.created_at,
            cpa.updated_at
        FROM public.coach_program_audio cpa
        WHERE cpa.program_id = p_program_id
          AND cpa.coach_id = p_coach_id;
END;
$$;


ALTER FUNCTION "public"."get_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_coach_program_audios"("p_coach_id" "uuid") RETURNS TABLE("id" "uuid", "program_id" "uuid", "coach_id" "uuid", "audio_url" "text", "duration_seconds" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            cpa.id,
            cpa.program_id,
            cpa.coach_id,
            cpa.audio_url,
            cpa.duration_seconds,
            cpa.created_at,
            cpa.updated_at
        FROM public.coach_program_audio cpa
        WHERE cpa.coach_id = p_coach_id;
END;
$$;


ALTER FUNCTION "public"."get_coach_program_audios"("p_coach_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_coached_members_count"("p_user_id" "uuid", "p_coach_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
    coached_count INTEGER := 0;
    moai_record RECORD;
BEGIN
    -- Get all active moais the user belongs to
    FOR moai_record IN
        SELECT DISTINCT mm.moai_id
        FROM public.moai_members mm
        WHERE mm.profile_id = p_user_id
          AND mm.is_active = true
        LOOP
            -- Count active coached members in this moai with the same coach
            SELECT COUNT(DISTINCT cs.user_id) INTO coached_count
            FROM public.coach_subscriptions cs
                     JOIN public.moai_members mm ON cs.user_id = mm.profile_id
            WHERE cs.coach_id = p_coach_id
              AND cs.status = 'active'
              AND mm.moai_id = moai_record.moai_id
              AND mm.is_active = true;

            -- Return the highest count across all moais (user gets best rate)
            IF coached_count > 0 THEN
                RETURN coached_count;
            END IF;
        END LOOP;

    RETURN 0;
END;
$$;


ALTER FUNCTION "public"."get_coached_members_count"("p_user_id" "uuid", "p_coach_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_buddy_cycle"("p_moai_id" "uuid") RETURNS TABLE("cycle_id" "uuid", "cycle_start_date" "date", "cycle_end_date" "date", "days_remaining" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            bc.id,
            bc.cycle_start_date,
            bc.cycle_end_date,
            (bc.cycle_end_date - CURRENT_DATE)::INTEGER as days_remaining
        FROM public.buddy_cycles bc
        WHERE bc.moai_id = p_moai_id
          AND CURRENT_DATE >= bc.cycle_start_date
          AND CURRENT_DATE <= bc.cycle_end_date
        ORDER BY bc.cycle_start_date DESC
        LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_current_buddy_cycle"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_week_start"("p_timezone" "text" DEFAULT 'UTC'::"text") RETURNS "date"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    current_timestamp_tz timestamptz;
    week_start_date date;
BEGIN
    -- Get current timestamp in the specified timezone
    current_timestamp_tz := now() AT TIME ZONE p_timezone;

    -- Calculate Monday of current week (not next week)
    -- If today is Sunday (0), we want to go back 6 days to get Monday
    -- If today is Monday (1), we stay on the same day
    -- If today is Tuesday (2), we go back 1 day, etc.
    week_start_date := (current_timestamp_tz::date - EXTRACT(DOW FROM current_timestamp_tz)::integer + 1)::date;

    -- Handle Sunday edge case: if DOW is 0 (Sunday), we need to subtract 6 more days
    IF EXTRACT(DOW FROM current_timestamp_tz) = 0 THEN
        week_start_date := week_start_date - INTERVAL '6 days';
    END IF;

    RETURN week_start_date;
END;
$$;


ALTER FUNCTION "public"."get_current_week_start"("p_timezone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_enhanced_member_insights"("p_coach_id" "uuid", "p_moai_id" "uuid") RETURNS TABLE("member_id" "uuid", "first_name" "text", "last_name" "text", "profile_image" "text", "total_activities" integer, "weekly_activities" integer, "current_streak" integer, "last_activity_date" "date", "has_notes" boolean, "latest_note" "text", "member_tags" "text"[], "last_checkin_date" timestamp with time zone, "days_since_checkin" integer, "engagement_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            p.id as member_id,
            p.first_name,
            p.last_name,
            p.profile_image,
            p.total_activities_logged as total_activities,
            COALESCE(was.activity_count, 0) as weekly_activities,
            COALESCE(was.activity_count, 0) as current_streak,
            MAX(al.logged_at)::date as last_activity_date,
            EXISTS(SELECT 1 FROM public.coach_member_notes cmn WHERE cmn.coach_id = p_coach_id AND cmn.member_id = p.id) as has_notes,
            (SELECT note_content FROM public.coach_member_notes cmn WHERE cmn.coach_id = p_coach_id AND cmn.member_id = p.id ORDER BY created_at DESC LIMIT 1) as latest_note,
            COALESCE(
                            ARRAY_AGG(DISTINCT cmt.tag_name) FILTER (WHERE cmt.tag_name IS NOT NULL),
                            ARRAY[]::text[]
            ) as member_tags,
            (SELECT last_checkin_at FROM public.coach_member_checkins cmc WHERE cmc.coach_id = p_coach_id AND cmc.member_id = p.id ORDER BY last_checkin_at DESC LIMIT 1) as last_checkin_date,
            COALESCE(
                    EXTRACT(DAYS FROM (NOW() - (SELECT last_checkin_at FROM public.coach_member_checkins cmc WHERE cmc.coach_id = p_coach_id AND cmc.member_id = p.id ORDER BY last_checkin_at DESC LIMIT 1))),
                    999
            )::integer as days_since_checkin,
            COALESCE(cmi.engagement_score, 0) as engagement_score
        FROM public.profiles p
                 JOIN public.moai_members mm ON p.id = mm.profile_id
                 LEFT JOIN public.weekly_activity_summary was ON p.id = was.profile_id
            AND was.week_start_date = date_trunc('week', CURRENT_DATE)::date + INTERVAL '1 day'
                 LEFT JOIN public.activity_logs al ON p.id = al.profile_id
            AND al.logged_at >= CURRENT_DATE - INTERVAL '30 days'
                 LEFT JOIN public.coach_member_tags cmt ON p.id = cmt.member_id
            AND cmt.coach_id = p_coach_id
                 LEFT JOIN public.coach_member_insights cmi ON p.id = cmi.profile_id
            AND cmi.moai_id = p_moai_id
        WHERE mm.moai_id = p_moai_id
          AND mm.is_active = true
        GROUP BY p.id, p.first_name, p.last_name, p.profile_image, p.total_activities_logged,
                 was.activity_count, cmi.engagement_score;
END;
$$;


ALTER FUNCTION "public"."get_enhanced_member_insights"("p_coach_id" "uuid", "p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_group_progression_summary"("p_moai_id" "uuid") RETURNS TABLE("elite_weeks_total" integer, "current_status_number" integer, "current_status_name" "text", "current_status_description" "text", "next_status_progress" integer, "current_stone_number" integer, "current_stone_name" "text", "next_stone_progress" integer, "recent_elite_weeks" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_elite_weeks_total INTEGER := 0;
    v_current_status_number INTEGER := 1;
    v_current_status_name TEXT := 'Emerging Moai';
    v_current_status_description TEXT := 'Starting your journey';
    v_next_status_progress INTEGER := 0;
    v_current_stone_number INTEGER := 0;
    v_current_stone_name TEXT := NULL;
    v_next_stone_progress INTEGER := 0;
    v_recent_elite_weeks JSONB := '[]'::jsonb;
BEGIN
    -- Get total elite weeks achieved
    SELECT COALESCE(COUNT(*), 0) INTO v_elite_weeks_total
    FROM public.elite_week_tracker
    WHERE moai_id = p_moai_id AND elite_week_achieved = true;

    -- Calculate current status based on elite weeks
    IF v_elite_weeks_total > 0 THEN
        v_current_status_number := GREATEST(1, (v_elite_weeks_total / 4) + 1);
        v_next_status_progress := v_elite_weeks_total % 4;
    ELSE
        v_current_status_number := 1;
        v_next_status_progress := 0;
    END IF;

    -- Set status name and description
    CASE v_current_status_number
        WHEN 1 THEN
            v_current_status_name := 'Emerging Moai';
            v_current_status_description := 'Starting your journey';
        WHEN 2 THEN
            v_current_status_name := 'Active Moai';
            v_current_status_description := 'Building momentum';
        WHEN 3 THEN
            v_current_status_name := 'Committed Moai';
            v_current_status_description := 'Forming strong habits';
        WHEN 4 THEN
            v_current_status_name := 'Resilient Moai';
            v_current_status_description := 'Overcoming challenges';
        WHEN 5 THEN
            v_current_status_name := 'Elite Moai';
            v_current_status_description := 'Peak performance';
        ELSE
            v_current_status_name := 'Legendary Moai';
            v_current_status_description := 'Beyond peak performance';
        END CASE;

    -- Calculate current stone (every 4 statuses = 1 stone)
    IF v_current_status_number >= 5 THEN
        v_current_stone_number := ((v_current_status_number - 1) / 4);
        v_next_stone_progress := (v_current_status_number - 1) % 4;

        CASE v_current_stone_number
            WHEN 1 THEN v_current_stone_name := 'Foundation Stone';
            WHEN 2 THEN v_current_stone_name := 'Strength Stone';
            WHEN 3 THEN v_current_stone_name := 'Wisdom Stone';
            WHEN 4 THEN v_current_stone_name := 'Unity Stone';
            WHEN 5 THEN v_current_stone_name := 'Legacy Stone';
            ELSE v_current_stone_name := 'Sacred Stone';
            END CASE;
    END IF;

    -- Get recent elite weeks (last 8 weeks) - handle empty case properly
    SELECT COALESCE(
                   jsonb_agg(
                           jsonb_build_object(
                                   'week_start_date', recent_weeks.week_start_date,
                                   'elite_week_achieved', recent_weeks.elite_week_achieved,
                                   'members_completed', recent_weeks.members_completed,
                                   'members_required', recent_weeks.members_required
                           )
                   ),
                   '[]'::jsonb
           ) INTO v_recent_elite_weeks
    FROM (
             SELECT
                 week_start_date,
                 elite_week_achieved,
                 members_completed,
                 members_required
             FROM public.elite_week_tracker ew
             WHERE ew.moai_id = p_moai_id
             ORDER BY ew.week_start_date DESC
             LIMIT 8
         ) recent_weeks;

    -- Return the results
    RETURN QUERY SELECT
                     v_elite_weeks_total,
                     v_current_status_number,
                     v_current_status_name,
                     v_current_status_description,
                     v_next_status_progress,
                     v_current_stone_number,
                     v_current_stone_name,
                     v_next_stone_progress,
                     v_recent_elite_weeks;
END;
$$;


ALTER FUNCTION "public"."get_group_progression_summary"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_member_leaderboard"() RETURNS TABLE("profile_id" "uuid", "first_name" "text", "last_name" "text", "profile_image" "text", "fire_badge_count" integer, "moai_names" "text"[])
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.profile_image,
    p.fire_streak_count as fire_badge_count,
    COALESCE(
                    ARRAY_AGG(DISTINCT m.name) FILTER (WHERE m.name IS NOT NULL),
                    ARRAY[]::TEXT[]
    ) as moai_names
FROM public.profiles p
         LEFT JOIN public.moai_members mm ON p.id = mm.profile_id AND mm.is_active = true
         LEFT JOIN public.moais m ON mm.moai_id = m.id AND m.is_active = true
WHERE p.first_name IS NOT NULL
GROUP BY p.id, p.first_name, p.last_name, p.profile_image, p.fire_streak_count
ORDER BY p.fire_streak_count DESC, p.first_name ASC;
$$;


ALTER FUNCTION "public"."get_member_leaderboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_moai_leaderboard"() RETURNS TABLE("moai_id" "uuid", "moai_name" "text", "moai_image" "text", "total_fire_badges" integer, "member_count" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT
    m.id as moai_id,
    m.name as moai_name,
    m.image_url as moai_image,
    COALESCE(SUM(p.fire_streak_count), 0) as total_fire_badges,
    COUNT(DISTINCT mm.profile_id) as member_count
FROM public.moais m
         LEFT JOIN public.moai_members mm ON m.id = mm.moai_id AND mm.is_active = true
         LEFT JOIN public.profiles p ON mm.profile_id = p.id
WHERE m.is_active = true AND NOT m.is_archived
GROUP BY m.id, m.name, m.image_url
ORDER BY total_fire_badges DESC, m.name ASC;
$$;


ALTER FUNCTION "public"."get_moai_leaderboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_moai_type"("p_moai_id" "uuid") RETURNS "public"."moai_type"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
SELECT moai_type FROM moais WHERE id = p_moai_id;
$$;


ALTER FUNCTION "public"."get_moai_type"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_personal_best"("p_user_id" "uuid", "p_exercise_id" "uuid") RETURNS TABLE("max_weight" numeric, "reps_at_max_weight" integer, "max_reps" integer, "weight_at_max_reps" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
        WITH max_weight_record AS (
            SELECT weight, reps
            FROM public.exercise_logs
            WHERE user_id = p_user_id AND exercise_id = p_exercise_id AND weight IS NOT NULL
            ORDER BY weight DESC, reps DESC
            LIMIT 1
        ),
             max_reps_record AS (
                 SELECT weight, reps
                 FROM public.exercise_logs
                 WHERE user_id = p_user_id AND exercise_id = p_exercise_id
                 ORDER BY reps DESC, weight DESC
                 LIMIT 1
             )
        SELECT
            mw.weight as max_weight,
            mw.reps as reps_at_max_weight,
            mr.reps as max_reps,
            mr.weight as weight_at_max_reps
        FROM max_weight_record mw
                 FULL OUTER JOIN max_reps_record mr ON true;
END;
$$;


ALTER FUNCTION "public"."get_personal_best"("p_user_id" "uuid", "p_exercise_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_personal_records"("p_user_id" "uuid", "p_exercise_id" "uuid") RETURNS TABLE("id" "uuid", "exercise_id" "uuid", "exercise_name" "text", "weight_lbs" numeric, "reps" integer, "achieved_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            pr.id,
            pr.exercise_id,
            e.name AS exercise_name,
            pr.weight_lbs,
            pr.reps,
            pr.achieved_at
        FROM
            public.strength_personal_records pr
                JOIN
            public.exercises e ON e.id = pr.exercise_id
        WHERE
            pr.user_id = p_user_id
          AND pr.exercise_id = p_exercise_id
        ORDER BY
            pr.weight_lbs DESC;
END;
$$;


ALTER FUNCTION "public"."get_personal_records"("p_user_id" "uuid", "p_exercise_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tier_info"("p_tier" integer) RETURNS TABLE("tier_number" integer, "tier_name" "text", "weeks_required" integer, "weeks_for_next_tier" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            p_tier as tier_number,
            CASE p_tier
                WHEN 1 THEN 'Start'
                WHEN 2 THEN 'Step'
                WHEN 3 THEN 'Flow'
                WHEN 4 THEN 'Link'
                WHEN 5 THEN 'Rise'
                WHEN 6 THEN 'Push'
                WHEN 7 THEN 'Hold'
                WHEN 8 THEN 'Climb'
                WHEN 9 THEN 'Stride'
                WHEN 10 THEN 'Spark'
                WHEN 11 THEN 'Surge'
                WHEN 12 THEN 'Pace'
                WHEN 13 THEN 'Trail'
                WHEN 14 THEN 'Build'
                WHEN 15 THEN 'Glow'
                WHEN 16 THEN 'Forge'
                WHEN 17 THEN 'Advance'
                WHEN 18 THEN 'Bond'
                WHEN 19 THEN 'Crest'
                WHEN 20 THEN 'Beacon'
                ELSE 'Unknown'
                END as tier_name,
            CASE
                WHEN p_tier = 1 THEN 0
                ELSE (p_tier - 1) * 4
                END as weeks_required,
            CASE
                WHEN p_tier >= 20 THEN NULL
                ELSE p_tier * 4
                END as weeks_for_next_tier;
END;
$$;


ALTER FUNCTION "public"."get_tier_info"("p_tier" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text", "_granted_by" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _permission_id UUID;
BEGIN
    -- Find permission ID from key
    SELECT id INTO _permission_id FROM public.permissions WHERE key = _permission_key;

    IF _permission_id IS NULL THEN
        RAISE EXCEPTION 'Permission with key % not found', _permission_key;
    END IF;

    -- Insert or update permission grant
    INSERT INTO public.moai_permissions (moai_id, profile_id, permission_id, granted_by)
    VALUES (_moai_id, _profile_id, _permission_id, _granted_by)
    ON CONFLICT (moai_id, profile_id, permission_id)
        DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."grant_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text", "_granted_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_default_role_id uuid;
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id);

    -- Assign default Member role
    SELECT id INTO v_default_role_id FROM public.roles WHERE name = 'Member';
    IF v_default_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, v_default_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_rest_day_replacement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    activity_date DATE;
    rest_day_id UUID;
BEGIN
    -- Only process non-rest day activities
    IF NEW.activity_type != 'Rest Day' THEN
        -- Get the date of the new activity
        activity_date := DATE(NEW.logged_at);

        -- Check if there's a rest day logged on the same date by the same user
        SELECT id INTO rest_day_id
        FROM public.activity_logs
        WHERE profile_id = NEW.profile_id
          AND activity_type = 'Rest Day'
          AND DATE(logged_at) = activity_date
          AND id != NEW.id; -- Don't match the current record being inserted/updated

        -- If a rest day exists on the same date, delete it
        IF rest_day_id IS NOT NULL THEN
            DELETE FROM public.activity_logs WHERE id = rest_day_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_rest_day_replacement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _permission_id UUID;
    _user_role profile_role;
BEGIN
    -- Get user role
    SELECT role INTO _user_role FROM public.profiles WHERE id = _profile_id;

    -- If user is admin, they have all permissions
    IF _user_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- Find permission ID from key
    SELECT id INTO _permission_id FROM public.permissions WHERE key = _permission_key;

    IF _permission_id IS NULL THEN
        RAISE EXCEPTION 'Permission with key % not found', _permission_key;
    END IF;

    -- Check if user has direct permission grant for this moai
    IF EXISTS (
        SELECT 1 FROM public.moai_permissions
        WHERE moai_id = _moai_id
          AND profile_id = _profile_id
          AND permission_id = _permission_id
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check if user's role has this permission by default
    RETURN EXISTS (
        SELECT 1 FROM public.role_permissions
        WHERE role = _user_role
          AND permission_id = _permission_id
    );
END;
$$;


ALTER FUNCTION "public"."has_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("_user_id" "uuid", "_permission_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
             JOIN public.role_permissions rp ON ur.role_id = rp.role_id
             JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id AND p.key = _permission_key
)
$$;


ALTER FUNCTION "public"."has_permission"("_user_id" "uuid", "_permission_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
             JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id AND r.name = _role
)
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_workout_photo"("workout_log_id" "uuid", "photo_url" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.workout_photo_logs(workout_log_id, photo_url)
    VALUES (workout_log_id, photo_url);
END;
$$;


ALTER FUNCTION "public"."insert_workout_photo"("workout_log_id" "uuid", "photo_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_email TEXT;
BEGIN
    -- Get the email of the current user using auth.uid()
    SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();

    -- Check if the email matches any of our admin emails
    RETURN current_email IN ('admin@example.com', 'jaynba@yahoo.com');
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get the email of the specified user
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;

    -- Check if the email matches any of our admin emails
    RETURN user_email IN ('admin@example.com', 'jaynba@yahoo.com');
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_authenticated_user"("_profile_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT _profile_id = auth.uid();
$$;


ALTER FUNCTION "public"."is_authenticated_user"("_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_coach_of"("_moai_id" "uuid", "_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.moais
        WHERE id = _moai_id
          AND coach_id = _profile_id
    ) OR EXISTS (
        SELECT 1 FROM public.moai_members
        WHERE moai_id = _moai_id
          AND profile_id = _profile_id
          AND role_in_moai = 'coach'
    );
END;
$$;


ALTER FUNCTION "public"."is_coach_of"("_moai_id" "uuid", "_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_commitment_window_open"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    current_day INTEGER;
    current_hour INTEGER;
BEGIN
    -- Get current day of week (0=Sunday, 1=Monday, etc.) and hour in user's timezone
    current_day := EXTRACT(DOW FROM NOW());
    current_hour := EXTRACT(HOUR FROM NOW());

    -- Sunday after 12PM or Monday before 12PM
    RETURN (current_day = 0 AND current_hour >= 12) OR (current_day = 1 AND current_hour < 12);
END;
$$;


ALTER FUNCTION "public"."is_commitment_window_open"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_commitment_window_open"("p_timezone" "text" DEFAULT 'UTC'::"text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    current_timestamp_tz timestamptz;
    current_day integer;
    current_hour integer;
BEGIN
    -- Get current timestamp in the specified timezone
    current_timestamp_tz := now() AT TIME ZONE p_timezone;

    -- Get day of week (0=Sunday, 1=Monday, etc.) and hour
    current_day := EXTRACT(DOW FROM current_timestamp_tz)::integer;
    current_hour := EXTRACT(HOUR FROM current_timestamp_tz)::integer;

    -- Sunday after 12PM or Monday before 12PM
    RETURN (current_day = 0 AND current_hour >= 12) OR (current_day = 1 AND current_hour < 12);
END;
$$;


ALTER FUNCTION "public"."is_commitment_window_open"("p_timezone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_moai_admin"("_moai_id" "uuid", "_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.moai_members
        WHERE moai_id = _moai_id
          AND profile_id = _profile_id
          AND role_in_moai = 'admin'
    );
END;
$$;


ALTER FUNCTION "public"."is_moai_admin"("_moai_id" "uuid", "_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_moai_full"("p_moai_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_member_count INTEGER;
    v_max_members INTEGER;
BEGIN
    -- SET search_path = public;
    SELECT member_count, max_members INTO v_member_count, v_max_members
    FROM public.moais WHERE id = p_moai_id;

    IF NOT FOUND THEN RETURN TRUE; END IF; -- Or handle as error (moai doesn't exist)
    RETURN v_member_count >= v_max_members;
END;
$$;


ALTER FUNCTION "public"."is_moai_full"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_moai_member"("_moai_id" "uuid", "_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.moai_members
        WHERE moai_id = _moai_id
          AND profile_id = _profile_id
    );
END;
$$;


ALTER FUNCTION "public"."is_moai_member"("_moai_id" "uuid", "_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_active_member_of_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM moai_members mm
        WHERE mm.moai_id = p_moai_id
          AND mm.profile_id = p_profile_id
          AND mm.is_active = TRUE
    );
END;
$$;


ALTER FUNCTION "public"."is_user_active_member_of_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_active_member_or_invitee"("p_moai_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- This function runs as the postgres user, so it bypasses the RLS policy on moai_members,
    -- preventing the infinite recursion.
    RETURN EXISTS (
        SELECT 1
        FROM moai_members mm
        WHERE
            mm.moai_id = p_moai_id
          AND mm.profile_id = p_user_id
          AND (
            mm.is_active = true
                OR (
                mm.is_active = false
                    AND mm.invite_token IS NOT NULL
                    AND mm.invite_expires_at > now()
                )
            )
    );
END;
$$;


ALTER FUNCTION "public"."is_user_active_member_or_invitee"("p_moai_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_blocked_from_moai"("user_id" "uuid", "moai_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $_$
SELECT EXISTS (
    SELECT 1 FROM public.moai_blocklist
    WHERE user_id = $1 AND moai_id = $2 AND is_active = true
);
$_$;


ALTER FUNCTION "public"."is_user_blocked_from_moai"("user_id" "uuid", "moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_coached_by"("p_user_id" "uuid", "p_coach_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.coach_relationships cr
        WHERE cr.coach_id = p_coach_id
          AND cr.status = 'active'
          AND (
            cr.user_id = p_user_id OR
            EXISTS (
                SELECT 1 FROM public.moai_members mm
                WHERE mm.moai_id = cr.moai_id
                  AND mm.profile_id = p_user_id
                  AND mm.is_active = true
            )
            )
    );
END;
$$;


ALTER FUNCTION "public"."is_user_coached_by"("p_user_id" "uuid", "p_coach_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_invited_to_private_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_moai_type moai_type;
BEGIN
    SELECT m.moai_type INTO v_moai_type FROM moais m WHERE m.id = p_moai_id;

    IF v_moai_type != 'private' THEN
        RETURN FALSE; -- Only applies to private moais
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM moai_members mm
        WHERE mm.moai_id = p_moai_id
          AND mm.profile_id = p_profile_id
          -- AND mm.is_active = FALSE -- Could be an invite to someone not yet a member
          AND mm.invite_token IS NOT NULL
          AND mm.invite_expires_at > NOW()
    );
END;
$$;


ALTER FUNCTION "public"."is_user_invited_to_private_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_moai_admin"("p_moai_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.moai_members mm
        WHERE mm.moai_id = p_moai_id
          AND mm.profile_id = p_user_id
          AND mm.role_in_moai = 'admin'
          AND mm.is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."is_user_moai_admin"("p_moai_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_moai_member"("moai_id_param" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.moai_members
        WHERE moai_id = moai_id_param AND profile_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."is_user_moai_member"("moai_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_and_consumable_invite_token"("p_invite_token" "uuid", "p_moai_id" "uuid", "p_profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    -- SET search_path = public;
    -- Check if a moai_members row exists for this profile, moai, with this token, not expired, and is_active = false
    RETURN EXISTS (
        SELECT 1 FROM public.moai_members mm
        WHERE mm.moai_id = p_moai_id
          AND mm.profile_id = p_profile_id
          AND mm.invite_token = p_invite_token
          AND mm.is_active = FALSE
          AND mm.invite_expires_at > NOW()
    );
END;
$$;


ALTER FUNCTION "public"."is_valid_and_consumable_invite_token"("p_invite_token" "uuid", "p_moai_id" "uuid", "p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_moai_action"("p_moai_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_moai moais%ROWTYPE;
    v_profile_id UUID := auth.uid();
    v_is_already_member BOOLEAN;
    v_is_blocked BOOLEAN;
    new_member_record moai_members%ROWTYPE;
BEGIN
    -- 1. Get Moai details
    SELECT * INTO v_moai FROM moais WHERE id = p_moai_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Moai not found.');
    END IF;

    -- 2. Check if user is blocked from this Moai
    SELECT public.is_user_blocked_from_moai(v_profile_id, p_moai_id) INTO v_is_blocked;
    IF v_is_blocked THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'You are blocked from joining this Moai.');
    END IF;

    -- 3. Check if already an active member
    SELECT public.is_user_active_member_of_moai(p_moai_id, v_profile_id) INTO v_is_already_member;
    IF v_is_already_member THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'You are already an active member of this Moai.');
    END IF;

    -- 4. Check if Moai is full
    IF v_moai.member_count >= v_moai.max_members THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'This Moai is full.');
    END IF;

    -- 5. Handle Private Moai invitation check
    IF v_moai.moai_type = 'private' THEN
        IF NOT public.is_user_invited_to_private_moai(p_moai_id, v_profile_id) THEN
            RETURN jsonb_build_object('status', 'error', 'message', 'You need a valid invitation to join this private Moai.');
        END IF;
        -- If invited, we'll update the existing invite record to active, or insert if no placeholder exists.
        -- The auto_assign_moai_program_to_new_member trigger will handle program assignment.
        UPDATE moai_members
        SET is_active = TRUE,
            joined_at = NOW(),
            invite_token = NULL, -- Clear invite token upon joining
            invite_expires_at = NULL
        WHERE moai_id = p_moai_id AND profile_id = v_profile_id
        RETURNING * INTO new_member_record;

        IF FOUND THEN
            RETURN jsonb_build_object('status', 'success', 'message', 'Successfully joined Moai.', 'member_data', row_to_json(new_member_record));
        ELSE
            -- This case should ideally not happen if an invite implies a moai_members row.
            -- If invites don't pre-create a moai_members row, you'd insert here.
            -- For now, assuming an invite means a row exists with is_active = false.
            -- Let's add an insert for safety if invite system is different.
            INSERT INTO public.moai_members (moai_id, profile_id, joined_at, is_active, role_in_moai)
            VALUES (p_moai_id, v_profile_id, NOW(), TRUE, 'member')
            RETURNING * INTO new_member_record;
            RETURN jsonb_build_object('status', 'success', 'message', 'Successfully joined Moai.', 'member_data', row_to_json(new_member_record));
        END IF;

    ELSIF v_moai.moai_type = 'public' THEN
        -- For public Moais, directly insert if not already a member (checked above) and not full.
        INSERT INTO public.moai_members (moai_id, profile_id, joined_at, is_active, role_in_moai)
        VALUES (p_moai_id, v_profile_id, NOW(), TRUE, 'member')
        ON CONFLICT (moai_id, profile_id) -- In case they had a deactivated record
            DO UPDATE SET
                          is_active = TRUE,
                          joined_at = NOW(),
                          role_in_moai = EXCLUDED.role_in_moai -- or keep existing role if preferred
        RETURNING * INTO new_member_record;
        RETURN jsonb_build_object('status', 'success', 'message', 'Successfully joined Moai.', 'member_data', row_to_json(new_member_record));
    END IF;

    RETURN jsonb_build_object('status', 'error', 'message', 'An unexpected error occurred.'); -- Should not reach here
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in join_moai_action: %', SQLERRM;
        RETURN jsonb_build_object('status', 'error', 'message', 'Database error: ' || SQLERRM);
END;
$$;


ALTER FUNCTION "public"."join_moai_action"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_workout_photo"("p_workout_log_id" "uuid", "p_photo_url" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.workout_photo_logs(workout_log_id, photo_url)
    VALUES (p_workout_log_id, p_photo_url);
END;
$$;


ALTER FUNCTION "public"."log_workout_photo"("p_workout_log_id" "uuid", "p_photo_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_messages_as_read"("p_moai_id" "uuid", "p_last_read_message_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_message RECORD;
BEGIN
    -- Mark all messages up to and including the specified message as read
    FOR v_message IN
        SELECT id 
        FROM public.messages
        WHERE moai_id = p_moai_id
        AND created_at <= (
            SELECT created_at 
            FROM public.messages 
            WHERE id = p_last_read_message_id
        )
        AND id NOT IN (
            SELECT message_id 
            FROM public.message_read_receipts 
            WHERE profile_id = auth.uid()
        )
    LOOP
        INSERT INTO public.message_read_receipts (message_id, profile_id)
        VALUES (v_message.id, auth.uid())
        ON CONFLICT (message_id, profile_id) DO NOTHING;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."mark_messages_as_read"("p_moai_id" "uuid", "p_last_read_message_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_activity_reaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    activity_owner_id uuid;
    reactor_name text;
    moai_name text;
BEGIN
    -- Get the activity owner
    SELECT al.profile_id INTO activity_owner_id
    FROM public.activity_logs al
    WHERE al.id = NEW.activity_log_id;

    -- Don't notify if user is reacting to their own activity
    IF activity_owner_id = NEW.profile_id THEN
        RETURN NEW;
    END IF;

    -- Get reactor's name
    SELECT COALESCE(p.first_name || ' ' || p.last_name, p.first_name, 'Someone')
    INTO reactor_name
    FROM public.profiles p
    WHERE p.id = NEW.profile_id;

    -- Get moai name (if activity is shared to a moai)
    SELECT m.name INTO moai_name
    FROM public.moais m
             JOIN public.moai_members mm1 ON m.id = mm1.moai_id
             JOIN public.moai_members mm2 ON m.id = mm2.moai_id
    WHERE mm1.profile_id = activity_owner_id
      AND mm2.profile_id = NEW.profile_id
      AND mm1.is_active = true
      AND mm2.is_active = true
    LIMIT 1;

    -- Create notification
    INSERT INTO public.notifications (
        profile_id,
        type,
        content,
        related_entity_id
    ) VALUES (
                 activity_owner_id,
                 'activity_reaction',
                 reactor_name || ' liked your activity photo' ||
                 CASE WHEN moai_name IS NOT NULL THEN ' in ' || moai_name ELSE '' END,
                 NEW.activity_log_id
             );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_activity_reaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pin_post"("post_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.posts
    SET is_pinned = true
    WHERE id = post_id_param;
END;
$$;


ALTER FUNCTION "public"."pin_post"("post_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _permission_id UUID;
BEGIN
    -- Find permission ID from key
    SELECT id INTO _permission_id FROM public.permissions WHERE key = _permission_key;

    IF _permission_id IS NULL THEN
        RAISE EXCEPTION 'Permission with key % not found', _permission_key;
    END IF;

    -- Delete permission grant
    DELETE FROM public.moai_permissions
    WHERE moai_id = _moai_id
      AND profile_id = _profile_id
      AND permission_id = _permission_id;
END;
$$;


ALTER FUNCTION "public"."revoke_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_enabled"("table_name" "text", "message" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rls_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = table_name)
    ) INTO rls_exists;

    PERFORM ok(rls_exists, message || ' (' || table_name || ')');
END;
$$;


ALTER FUNCTION "public"."rls_enabled"("table_name" "text", "message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid", "p_audio_url" "text", "p_duration_seconds" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO public.coach_program_audio (
        program_id,
        coach_id,
        audio_url,
        duration_seconds,
        updated_at
    ) VALUES (
                 p_program_id,
                 p_coach_id,
                 p_audio_url,
                 p_duration_seconds,
                 NOW()
             )
    ON CONFLICT (program_id, coach_id)
        DO UPDATE SET
                      audio_url = EXCLUDED.audio_url,
                      duration_seconds = EXCLUDED.duration_seconds,
                      updated_at = NOW()
    RETURNING id INTO result_id;

    RETURN result_id;
END;
$$;


ALTER FUNCTION "public"."save_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid", "p_audio_url" "text", "p_duration_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_buddy_nudge"("p_receiver_id" "uuid", "p_moai_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_week DATE;
    is_buddy BOOLEAN := false;
BEGIN
    current_week := date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '1 day';

    -- Check if users are buddies this week
    SELECT EXISTS(
        SELECT 1 FROM public.weekly_buddy_pairings
        WHERE moai_id = p_moai_id
          AND week_start_date = current_week
          AND buddy_group ? auth.uid()::text
          AND buddy_group ? p_receiver_id::text
    ) INTO is_buddy;

    IF NOT is_buddy THEN
        RETURN false; -- Not buddies
    END IF;

    -- Insert nudge (will fail if already sent today due to unique constraint)
    BEGIN
        INSERT INTO public.buddy_nudges (sender_id, receiver_id, moai_id, week_start_date, nudge_date)
        VALUES (auth.uid(), p_receiver_id, p_moai_id, current_week, CURRENT_DATE);

        -- Create notification
        INSERT INTO public.notifications (profile_id, type, content, related_entity_id)
        VALUES (
                   p_receiver_id,
                   'buddy_nudge',
                   'Your accountability buddy sent you a movement reminder! 👉',
                   p_moai_id
               );

        RETURN true;
    EXCEPTION
        WHEN unique_violation THEN
            RETURN false; -- Already sent today
    END;
END;
$$;


ALTER FUNCTION "public"."send_buddy_nudge"("p_receiver_id" "uuid", "p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tag_workout_member"("p_workout_log_id" "uuid", "p_tagged_by_id" "uuid", "p_tagged_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert the tag
    INSERT INTO public.workout_member_tags(
        workout_log_id,
        tagged_by_id,
        tagged_user_id,
        status
    )
    VALUES (
               p_workout_log_id,
               p_tagged_by_id,
               p_tagged_user_id,
               'pending'
           )
    ON CONFLICT (workout_log_id, tagged_user_id)
        DO NOTHING;

    -- Create a notification
    INSERT INTO public.notifications(
        profile_id,
        type,
        content,
        related_entity_id
    )
    VALUES (
               p_tagged_user_id,
               'workout_tag',
               'You were tagged in a workout',
               p_workout_log_id
           );
END;
$$;


ALTER FUNCTION "public"."tag_workout_member"("p_workout_log_id" "uuid", "p_tagged_by_id" "uuid", "p_tagged_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unblock_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.moai_blocklist
    SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id AND moai_id = p_moai_id;
END;
$$;


ALTER FUNCTION "public"."unblock_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unpin_moai_posts"("moai_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.posts
    SET is_pinned = false
    WHERE moai_id = moai_id_param AND is_pinned = true;
END;
$$;


ALTER FUNCTION "public"."unpin_moai_posts"("moai_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_activity_count_and_badges"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    week_start DATE;
BEGIN
    -- Update total activities count
    UPDATE public.profiles
    SET total_activities_logged = total_activities_logged + 1
    WHERE id = NEW.profile_id;

    -- Check and award milestone badges
    PERFORM public.check_and_award_milestone_badges(NEW.profile_id);

    -- Check and award moai mover badge for this week
    week_start := date_trunc('week', NEW.logged_at::date)::date + INTERVAL '1 day';
    PERFORM public.check_and_award_moai_mover_badge(NEW.profile_id, week_start);

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_activity_count_and_badges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_credit_history_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_credit_history_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_moai_member_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update count for the affected moai
    UPDATE moais
    SET member_count = (
        SELECT COUNT(*)
        FROM moai_members mm
        WHERE mm.moai_id = COALESCE(NEW.moai_id, OLD.moai_id) AND mm.is_active = true
    )
    WHERE id = COALESCE(NEW.moai_id, OLD.moai_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_moai_member_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_moai_tier_progression"("p_moai_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_tier_record RECORD;
    consistency_weeks INTEGER;
    tier_requirements INTEGER[];
    new_tier INTEGER;
BEGIN
    -- Get current tier info
    SELECT * INTO current_tier_record
    FROM public.moai_tiers
    WHERE moai_id = p_moai_id;

    IF NOT FOUND THEN
        -- Initialize tier record
        INSERT INTO public.moai_tiers (moai_id, current_tier, tier_name)
        VALUES (p_moai_id, 1, 'New Moai');
        RETURN;
    END IF;

    -- Define tier requirements (weeks of 80% consistency needed)
    tier_requirements := ARRAY[0, 4, 12, 24, 52]; -- Index matches tier level

    -- Count recent weeks with 80%+ consistency
    SELECT COUNT(*) INTO consistency_weeks
    FROM public.moai_streaks
    WHERE moai_id = p_moai_id
      AND group_consistency_percentage >= 80
      AND week_start_date >= CURRENT_DATE - INTERVAL '52 weeks';

    -- Determine appropriate tier
    new_tier := current_tier_record.current_tier;
    FOR i IN 2..5 LOOP
            IF consistency_weeks >= tier_requirements[i] THEN
                new_tier := i;
            END IF;
        END LOOP;

    -- Update tier if changed
    IF new_tier != current_tier_record.current_tier THEN
        UPDATE public.moai_tiers
        SET current_tier = new_tier,
            tier_name = CASE new_tier
                            WHEN 1 THEN 'New Moai'
                            WHEN 2 THEN 'Active Moai'
                            WHEN 3 THEN 'Resilient Moai'
                            WHEN 4 THEN 'Dedicated Moai'
                            WHEN 5 THEN 'Elite Moai'
                END,
            weeks_at_current_tier = 0,
            tier_achieved_at = now(),
            updated_at = now()
        WHERE moai_id = p_moai_id;

        -- Update moais table
        UPDATE public.moais
        SET current_tier = new_tier
        WHERE id = p_moai_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_moai_tier_progression"("p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_weekly_activity_and_fire_badges"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    week_start DATE;
    current_count INTEGER;
BEGIN
    -- Calculate Monday of the week for the logged activity
    week_start := date_trunc('week', NEW.logged_at::date)::date + INTERVAL '1 day';

    -- Insert or update weekly summary
    INSERT INTO public.weekly_activity_summary (profile_id, week_start_date, activity_count)
    VALUES (NEW.profile_id, week_start, 1)
    ON CONFLICT (profile_id, week_start_date)
        DO UPDATE SET
                      activity_count = weekly_activity_summary.activity_count + 1,
                      updated_at = now();

    -- Get current count after update
    SELECT activity_count INTO current_count
    FROM public.weekly_activity_summary
    WHERE profile_id = NEW.profile_id AND week_start_date = week_start;

    -- Award fire badge if 5+ activities and not already earned
    IF current_count >= 5 THEN
        UPDATE public.weekly_activity_summary
        SET fire_badge_earned = true,
            updated_at = now()
        WHERE profile_id = NEW.profile_id
          AND week_start_date = week_start
          AND fire_badge_earned = false;

        -- Update user's total fire streak count
        IF FOUND THEN
            UPDATE public.profiles
            SET fire_streak_count = fire_streak_count + 1,
                updated_at = now()
            WHERE id = NEW.profile_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_weekly_activity_and_fire_badges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_weekly_commitment_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_week_start DATE;
    movement_days INTEGER;
BEGIN
    -- Get current week start (Monday)
    current_week_start := (DATE_TRUNC('week', NEW.logged_at::DATE) + INTERVAL '1 day')::DATE;

    -- Calculate movement days for this week
    movement_days := public.calculate_movement_days(NEW.profile_id, current_week_start);

    -- Update all commitments for this user in this week (commitment_met will be auto-calculated)
    UPDATE public.weekly_member_commitments
    SET days_completed = movement_days
    WHERE profile_id = NEW.profile_id
      AND week_start_date = current_week_start;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_weekly_commitment_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_active_subscription"("p_user_id" "uuid", "p_moai_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = p_user_id
          AND moai_id = p_moai_id
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$;


ALTER FUNCTION "public"."user_has_active_subscription"("p_user_id" "uuid", "p_moai_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_global_role"("p_user_id" "uuid", "p_role_name" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
             JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.name = p_role_name
);
$$;


ALTER FUNCTION "public"."user_has_global_role"("p_user_id" "uuid", "p_role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_tagged_in_activity_log"("activity_log_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $_$
SELECT EXISTS (
    SELECT 1
    FROM public.activity_tags
    WHERE activity_log_id = $1
      AND tagged_user_id = auth.uid()
      AND status = 'pending'
);
$_$;


ALTER FUNCTION "public"."user_is_tagged_in_activity_log"("activity_log_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."users_share_moai"("user1_id" "uuid", "user2_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.moai_members m1
             JOIN public.moai_members m2 ON m1.moai_id = m2.moai_id
    WHERE m1.profile_id = user1_id
      AND m2.profile_id = user2_id
      AND m1.is_active = true
      AND m2.is_active = true
);
$$;


ALTER FUNCTION "public"."users_share_moai"("user1_id" "uuid", "user2_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_and_consume_invite"("p_invite_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitation moai_invitations%ROWTYPE;
    v_moai moais%ROWTYPE;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
    END IF;

    -- Get invitation details
    SELECT * INTO v_invitation
    FROM public.moai_invitations
    WHERE invite_code = p_invite_code AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
    END IF;

    -- Check if invitation is expired
    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
    END IF;

    -- Check if invitation has reached max uses
    IF v_invitation.max_uses IS NOT NULL AND v_invitation.current_uses >= v_invitation.max_uses THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation has reached maximum uses');
    END IF;

    -- Get moai details
    SELECT * INTO v_moai FROM public.moais WHERE id = v_invitation.moai_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Moai not found');
    END IF;

    -- Check if moai is full
    IF v_moai.member_count >= v_moai.max_members THEN
        RETURN jsonb_build_object('success', false, 'error', 'Moai is full');
    END IF;

    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.moai_members
        WHERE moai_id = v_invitation.moai_id
          AND profile_id = v_user_id
          AND is_active = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this moai');
    END IF;

    -- Add user to moai
    INSERT INTO public.moai_members (moai_id, profile_id, is_active, role_in_moai, invited_by)
    VALUES (v_invitation.moai_id, v_user_id, true, 'member', v_invitation.invited_by);

    -- Update invitation usage count
    UPDATE public.moai_invitations
    SET current_uses = current_uses + 1, updated_at = now()
    WHERE id = v_invitation.id;

    -- Create notification for the inviter
    INSERT INTO public.notifications (profile_id, type, content, related_entity_id)
    VALUES (
               v_invitation.invited_by,
               'moai_join',
               'Someone joined your moai through your invitation!',
               v_invitation.moai_id
           );

    RETURN jsonb_build_object(
            'success', true,
            'moai_id', v_invitation.moai_id,
            'moai_name', v_moai.name
           );
END;
$$;


ALTER FUNCTION "public"."validate_and_consume_invite"("p_invite_code" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "notes" "text",
    "logged_at" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration_minutes" integer,
    "image_url" "text"
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_log_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "reaction_type" "text" DEFAULT 'heart'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_log_id" "uuid" NOT NULL,
    "tagged_user_id" "uuid" NOT NULL,
    "tagged_by_user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '48:00:00'::interval),
    "linked_activity_log_id" "uuid",
    CONSTRAINT "activity_tags_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'declined'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."activity_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buddy_chat_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "buddy_group" "jsonb" NOT NULL,
    "chat_name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "buddy_type" "text" DEFAULT 'buddy_1on1'::"text",
    "cycle_start_date" "date",
    "cycle_end_date" "date"
);


ALTER TABLE "public"."buddy_chat_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buddy_cycle_pairings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cycle_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "buddy_group" "jsonb" NOT NULL,
    "buddy_type" "text" DEFAULT 'buddy_1on1'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."buddy_cycle_pairings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buddy_cycles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "cycle_start_date" "date" NOT NULL,
    "cycle_end_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."buddy_cycles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buddy_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "week_start_date" "date" NOT NULL,
    "moai_id" "uuid",
    "buddy_pair" "jsonb" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."buddy_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buddy_nudges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "nudge_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."buddy_nudges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buddy_prompt_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_text" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."buddy_prompt_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "alert_type" "text" NOT NULL,
    "member_id" "uuid",
    "alert_message" "text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."coach_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid",
    "moai_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "announcement_type" "text" DEFAULT 'general'::"text",
    "is_pinned" boolean DEFAULT false,
    "scheduled_for" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "coach_announcements_announcement_type_check" CHECK (("announcement_type" = ANY (ARRAY['general'::"text", 'workout'::"text", 'milestone'::"text", 'reminder'::"text"])))
);


ALTER TABLE "public"."coach_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_bulletins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "video_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_bulletins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "moai_id" "uuid",
    "member_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_title" "text" NOT NULL,
    "event_description" "text",
    "event_date" timestamp with time zone NOT NULL,
    "is_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_member_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "checkin_type" "text" DEFAULT 'message'::"text" NOT NULL,
    "checkin_notes" "text",
    "last_checkin_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_member_checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_member_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "workouts_assigned" integer DEFAULT 0,
    "workouts_completed" integer DEFAULT 0,
    "goals_achieved_percentage" numeric DEFAULT 0,
    "missed_workout_days" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "streak_broken" boolean DEFAULT false,
    "last_activity_date" "date",
    "engagement_score" numeric DEFAULT 0,
    "red_flag_alerts" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workout_completion_trend" "text",
    "last_milestone_date" "date",
    "preferred_workout_time" time without time zone,
    "motivation_triggers" "text"[],
    "risk_factors" "text"[]
);


ALTER TABLE "public"."coach_member_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_member_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "note_content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_member_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_member_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "tag_name" "text" NOT NULL,
    "tag_color" "text" DEFAULT '#6366f1'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_member_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coach_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."coach_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "note_content" "text" NOT NULL,
    "note_category" "text" DEFAULT 'general'::"text",
    "is_priority" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_private_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "message_content" "text" NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "is_automated" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_private_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_private_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."coach_private_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_program_audio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "audio_url" "text" NOT NULL,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_program_audio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "moai_id" "uuid",
    "user_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "start_date" "date" DEFAULT CURRENT_DATE,
    "end_date" "date",
    "monthly_price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_relationship_consistency" CHECK (((("relationship_type" = 'moai'::"text") AND ("moai_id" IS NOT NULL) AND ("user_id" IS NULL)) OR (("relationship_type" = '1v1'::"text") AND ("user_id" IS NOT NULL) AND ("moai_id" IS NULL)))),
    CONSTRAINT "coach_relationships_relationship_type_check" CHECK (("relationship_type" = ANY (ARRAY['moai'::"text", '1v1'::"text"]))),
    CONSTRAINT "coach_relationships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."coach_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "url" "text" NOT NULL,
    "resource_type" "text" DEFAULT 'link'::"text" NOT NULL,
    "category" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "session_type" "text" NOT NULL,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "group_members" "jsonb" DEFAULT '[]'::"jsonb",
    "start_date" "date",
    "end_date" "date",
    "price" numeric DEFAULT 0,
    "session_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coach_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['one-off'::"text", 'micro-group'::"text", 'long-term'::"text"]))),
    CONSTRAINT "coach_sessions_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."coach_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "plan_type" "text" NOT NULL,
    "plan_duration_months" integer NOT NULL,
    "amount_paid" numeric NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "auto_renew" boolean DEFAULT true NOT NULL,
    "stripe_payment_intent_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "next_billing_date" "date",
    CONSTRAINT "coach_subscriptions_plan_duration_months_check" CHECK (("plan_duration_months" = ANY (ARRAY[3, 6, 12]))),
    CONSTRAINT "coach_subscriptions_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['quarterly'::"text", 'semi_annual'::"text", 'annual'::"text"]))),
    CONSTRAINT "coach_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."coach_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_workout_audio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workout_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "audio_url" "text" NOT NULL,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coach_workout_audio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coaches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "bio" "text",
    "specialties" "text"[] DEFAULT ARRAY[]::"text"[],
    "availability_json" "jsonb" DEFAULT '{}'::"jsonb",
    "pricing_json" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "rating" numeric DEFAULT 0,
    "total_sessions" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "certifications" "text"[],
    "languages_spoken" "text"[],
    "group_coaching_price" numeric(10,2),
    "one_on_one_price" numeric(10,2),
    "coach_status" "text" DEFAULT 'active'::"text",
    "internal_notes" "text",
    CONSTRAINT "coaches_coach_status_check" CHECK (("coach_status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."coaches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coaching_questionnaires" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "fitness_goals" "text"[],
    "current_fitness_level" "text",
    "preferred_workout_types" "text"[],
    "available_days" "text"[],
    "equipment_access" "text"[],
    "injuries_limitations" "text",
    "motivation_style" "text",
    "additional_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coaching_questionnaires" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collaborative_workout_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "added_by" "uuid" NOT NULL,
    "exercise_order" integer DEFAULT 1 NOT NULL,
    "sets" integer DEFAULT 3 NOT NULL,
    "reps" "text" DEFAULT '10'::"text" NOT NULL,
    "rest_time" "text" DEFAULT '60s'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."collaborative_workout_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collaborative_workout_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'invited'::"text" NOT NULL,
    "joined_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "collaborative_workout_participants_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'joined'::"text", 'completed'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."collaborative_workout_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collaborative_workout_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "set_number" integer NOT NULL,
    "reps" "text" NOT NULL,
    "weight" "text",
    "is_completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."collaborative_workout_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collaborative_workout_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "session_name" "text",
    "status" "text" DEFAULT 'waiting_for_partner'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "collaborative_workout_sessions_status_check" CHECK (("status" = ANY (ARRAY['waiting_for_partner'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."collaborative_workout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commitment_check_ins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_commitment_id" "uuid" NOT NULL,
    "check_in_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "progress_data" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."commitment_check_ins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "profile_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credit_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "description" "text",
    "moai_id" "uuid",
    "coach_id" "uuid",
    "billing_cycle_start" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_history_credit_type_check" CHECK (("credit_type" = ANY (ARRAY['earned'::"text", 'used'::"text"])))
);


ALTER TABLE "public"."credit_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_checkin_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checkin_id" "uuid",
    "member_id" "uuid",
    "response_text" "text",
    "response_data" "jsonb",
    "responded_at" timestamp with time zone DEFAULT "now"(),
    "is_private_response" boolean DEFAULT false
);


ALTER TABLE "public"."daily_checkin_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid",
    "coach_id" "uuid",
    "prompt_text" "text" NOT NULL,
    "prompt_type" "text" DEFAULT 'open_text'::"text",
    "prompt_options" "jsonb",
    "scheduled_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "daily_checkins_prompt_type_check" CHECK (("prompt_type" = ANY (ARRAY['open_text'::"text", 'scale'::"text", 'multiple_choice'::"text", 'yes_no'::"text"])))
);


ALTER TABLE "public"."daily_checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."elite_week_tracker" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "members_completed" integer DEFAULT 0 NOT NULL,
    "members_required" integer DEFAULT 0 NOT NULL,
    "elite_week_achieved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."elite_week_tracker" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_approvals" (
    "event_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "event_approvals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."event_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_rsvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "rsvp_status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "event_rsvps_rsvp_status_check" CHECK (("rsvp_status" = ANY (ARRAY['yes'::"text", 'no'::"text"])))
);


ALTER TABLE "public"."event_rsvps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text" NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_type" "text" DEFAULT 'irl'::"text" NOT NULL,
    "address" "text",
    "meeting_link" "text",
    "is_global" boolean DEFAULT false NOT NULL,
    "timezone" "text" DEFAULT 'America/Los_Angeles'::"text" NOT NULL,
    "needs_approval" boolean DEFAULT true,
    "approval_status" "text" DEFAULT 'pending'::"text",
    "emoji" "text" DEFAULT '📅'::"text",
    "rsvp_capacity" integer
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workout_exercise_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "sets" integer,
    "reps" integer,
    "weight" numeric,
    "duration_seconds" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exercise_details_type_check" CHECK (("type" = ANY (ARRAY['weighted'::"text", 'bodyweight'::"text", 'timed'::"text"])))
);


ALTER TABLE "public"."exercise_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_library_extended" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exercise_id" "uuid",
    "coach_id" "uuid",
    "video_demo_url" "text",
    "custom_instructions" "text",
    "difficulty_level" "text",
    "equipment_needed" "text"[],
    "is_custom" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exercise_library_extended_difficulty_level_check" CHECK (("difficulty_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"])))
);


ALTER TABLE "public"."exercise_library_extended" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "workout_completion_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "set_number" integer NOT NULL,
    "reps" integer NOT NULL,
    "weight" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exercise_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "muscle_group" "text",
    "instructions" "text",
    "form_video_url" "text",
    "default_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exercises_default_type_check" CHECK (("default_type" = ANY (ARRAY['weighted'::"text", 'bodyweight'::"text", 'timed'::"text"])))
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goal_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_statuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "status_number" integer NOT NULL,
    "status_name" "text" NOT NULL,
    "status_description" "text" NOT NULL,
    "elite_weeks_completed" integer NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "group_statuses_status_number_check" CHECK ((("status_number" >= 1) AND ("status_number" <= 20)))
);


ALTER TABLE "public"."group_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_stones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "stone_number" integer NOT NULL,
    "stone_name" "text" NOT NULL,
    "stone_description" "text" NOT NULL,
    "statuses_completed" integer NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "group_stones_stone_number_check" CHECK ((("stone_number" >= 1) AND ("stone_number" <= 5)))
);


ALTER TABLE "public"."group_stones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hobbies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."hobbies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_check_ins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "activities_logged" integer DEFAULT 0 NOT NULL,
    "goal_met" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "check_in_deadline" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "member_check_ins_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'missed'::"text"])))
);


ALTER TABLE "public"."member_check_ins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid",
    "moai_id" "uuid",
    "coach_id" "uuid",
    "milestone_type" "text" NOT NULL,
    "milestone_value" "text" NOT NULL,
    "achieved_date" "date" NOT NULL,
    "celebration_message" "text",
    "is_group_shared" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."member_milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_read_receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "read_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_read_receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_replies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_message_id" "uuid" NOT NULL,
    "reply_message_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_replies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid",
    "template_name" "text" NOT NULL,
    "template_content" "text" NOT NULL,
    "template_category" "text" DEFAULT 'general'::"text",
    "is_quick_response" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "message_templates_template_category_check" CHECK (("template_category" = ANY (ARRAY['general'::"text", 'motivation'::"text", 'check_in'::"text", 'workout_reminder'::"text", 'celebration'::"text"])))
);


ALTER TABLE "public"."message_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_url" "text",
    "message_type" "text" DEFAULT 'text'::"text",
    "is_pinned" boolean DEFAULT false,
    "metadata" "jsonb",
    "is_buddy_chat" boolean DEFAULT false,
    "buddy_chat_week_start" "date",
    "chat_type" "text" DEFAULT 'moai_general'::"text",
    "coach_private_chat_id" "uuid",
    "moai_coaching_chat_id" "uuid",
    "message_subtype" "text",
    "buddy_chat_cycle_start" "date",
    CONSTRAINT "messages_chat_type_check" CHECK (("chat_type" = ANY (ARRAY['moai_general'::"text", 'coach_private'::"text", 'coach_group'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_album_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moai_album_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_blocklist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "blocked_by" "uuid" NOT NULL,
    "reason" "text",
    "blocked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moai_blocklist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_coaching_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "unlock_percentage" numeric DEFAULT 0 NOT NULL,
    CONSTRAINT "moai_coaching_chats_unlock_percentage_check" CHECK ((("unlock_percentage" >= (0)::numeric) AND ("unlock_percentage" <= (100)::numeric)))
);


ALTER TABLE "public"."moai_coaching_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "invite_code" "text" NOT NULL,
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moai_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role_in_moai" "text" DEFAULT 'member'::"text",
    "invite_token" "uuid",
    "invited_by" "uuid",
    "invite_expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "current_program_id" "uuid"
);


ALTER TABLE "public"."moai_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "granted_by" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moai_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_photo_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photo_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "tagged_by" "uuid" NOT NULL,
    "tagged_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moai_photo_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_program_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "program_id" "uuid" NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "week_start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moai_program_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "reason" "text",
    "score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moai_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_user_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "invited_user_id" "uuid" NOT NULL,
    "invited_by_user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "moai_user_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."moai_user_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moai_weekly_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "activities_logged_this_week" integer DEFAULT 0 NOT NULL,
    "met_weekly_commitment" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moai_weekly_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "max_members" integer DEFAULT 8,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hobbies" "text"[] DEFAULT '{}'::"text"[],
    "is_archived" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_path_moai" boolean DEFAULT false,
    "creator_id" "uuid",
    "monthly_subscription_cost" numeric DEFAULT 0,
    "program_schedule" "jsonb",
    "moai_type" "public"."moai_type" DEFAULT 'public'::"public"."moai_type" NOT NULL,
    "weekly_goal" "text",
    "status" "public"."moai_status" DEFAULT 'active'::"public"."moai_status" NOT NULL,
    "coach_id" "uuid",
    "member_count" integer DEFAULT 0,
    "type" "text" DEFAULT 'activity'::"text" NOT NULL,
    "latitude" numeric,
    "longitude" numeric,
    "location_address" "text",
    "current_program_id" "uuid",
    "goals" "text"[] DEFAULT '{}'::"text"[],
    "allow_member_invites" boolean DEFAULT true,
    "current_tier" integer DEFAULT 1,
    "current_streak_weeks" integer DEFAULT 0,
    "missed_weeks_count" integer DEFAULT 0,
    "commitment_threshold" integer DEFAULT 5,
    "commitment_type" "text" DEFAULT 'weekly_activities'::"text",
    "urgency_status" "text" DEFAULT 'on_track'::"text",
    "next_checkin_deadline" timestamp with time zone,
    "weekly_commitment_goal" integer DEFAULT 5 NOT NULL,
    "cumulative_success_weeks" integer DEFAULT 0 NOT NULL,
    "consecutive_missed_weeks" integer DEFAULT 0 NOT NULL,
    "requires_payment" boolean DEFAULT false NOT NULL,
    "goal_type" "text",
    "price" numeric DEFAULT 49.00,
    "capacity" integer DEFAULT 6,
    "coach_match_percentage" numeric DEFAULT 0,
    CONSTRAINT "moais_coach_match_percentage_check" CHECK ((("coach_match_percentage" >= (0)::numeric) AND ("coach_match_percentage" <= (100)::numeric))),
    CONSTRAINT "moais_current_tier_check" CHECK ((("current_tier" >= 1) AND ("current_tier" <= 5))),
    CONSTRAINT "moais_urgency_status_check" CHECK (("urgency_status" = ANY (ARRAY['on_track'::"text", 'at_risk'::"text", 'critical'::"text"]))),
    CONSTRAINT "weekly_commitment_goal_min_check" CHECK (("weekly_commitment_goal" >= 1))
);


ALTER TABLE "public"."moais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "related_entity_id" "uuid",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nudge_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "template_name" "text" NOT NULL,
    "template_content" "text" NOT NULL,
    "template_category" "text" DEFAULT 'general'::"text",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nudge_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_trends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "exercise_id" "uuid",
    "metric_type" "text" NOT NULL,
    "metric_value" numeric NOT NULL,
    "week_start_date" "date" NOT NULL,
    "trend_direction" "text",
    "percentage_change" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."performance_trends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" "text" NOT NULL,
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_workouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid",
    "workout_template_id" "uuid",
    "display_order" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plan_workouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_pinned" boolean DEFAULT false
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "age" integer,
    "gender" "text",
    "relationship_status" "text",
    "phone_number" "text",
    "street_address" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "country" "text" DEFAULT 'United States'::"text",
    "latitude" numeric,
    "longitude" numeric,
    "profile_image" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "hobbies" "text"[] DEFAULT '{}'::"text"[],
    "fire_streak_count" integer DEFAULT 0 NOT NULL,
    "social_handles" "jsonb",
    "bio" "text",
    "preferred_contact" "text",
    "total_activities_logged" integer DEFAULT 0,
    "primary_goal" "text",
    "movement_frequency" "text",
    "preferred_activities" "text"[],
    "movement_time" "text",
    "user_archetype" "text",
    "accountability_style" "text",
    "coach_accountability_style" "text" DEFAULT 'standard'::"text",
    "current_coach_id" "uuid",
    "moai_credit_balance" numeric(10,2) DEFAULT 0.00,
    "monthly_coach_credit" numeric(10,2) DEFAULT 0.00,
    "last_credit_calculation" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid",
    "template_name" "text" NOT NULL,
    "description" "text",
    "duration_weeks" integer,
    "difficulty_level" "text",
    "template_data" "jsonb" NOT NULL,
    "is_public" boolean DEFAULT false,
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "program_templates_difficulty_level_check" CHECK (("difficulty_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"])))
);


ALTER TABLE "public"."program_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_weeks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "workout_id" "uuid" NOT NULL,
    "week_number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "workout_order" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."program_weeks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."story_views" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unread_message_counts" AS
 SELECT "m"."moai_id",
    "mm"."profile_id",
    "count"(DISTINCT "m"."id") AS "unread_count"
   FROM (("public"."messages" "m"
     JOIN "public"."moai_members" "mm" ON (("m"."moai_id" = "mm"."moai_id")))
     LEFT JOIN "public"."message_read_receipts" "mrr" ON ((("m"."id" = "mrr"."message_id") AND ("mrr"."profile_id" = "mm"."profile_id"))))
  WHERE (("mrr"."id" IS NULL) AND ("m"."profile_id" <> "mm"."profile_id") AND ("mm"."joined_at" IS NOT NULL))
  GROUP BY "m"."moai_id", "mm"."profile_id";


ALTER TABLE "public"."unread_message_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "badge_type" "text" NOT NULL,
    "badge_key" "text" NOT NULL,
    "badge_name" "text" NOT NULL,
    "badge_icon" "text" NOT NULL,
    "badge_description" "text",
    "milestone_value" integer,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "commitment_id" "uuid",
    "moai_id" "uuid",
    "week_start_date" "date" NOT NULL,
    "check_in_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "activity_type" "text",
    "frequency_count" integer,
    "commitment_type" "text" DEFAULT 'custom'::"text",
    "movement_days_goal" integer,
    CONSTRAINT "check_frequency_count" CHECK ((("frequency_count" IS NULL) OR (("frequency_count" >= 1) AND ("frequency_count" <= 6))))
);


ALTER TABLE "public"."user_commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_program_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "program_id" "uuid" NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "status" "text" DEFAULT 'assigned'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "moai_id" "uuid",
    "assigned_via_moai" boolean DEFAULT false,
    "assignment_type" "text" DEFAULT 'manual'::"text",
    CONSTRAINT "user_program_assignments_status_check" CHECK (("status" = ANY (ARRAY['assigned'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."user_program_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "online" boolean DEFAULT true NOT NULL,
    "last_active" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "subscription_id" "text",
    "stripe_customer_id" "text",
    "amount_paid" numeric DEFAULT 0,
    "currency" "text" DEFAULT 'usd'::"text",
    "payment_date" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone_number" "text",
    "age" integer NOT NULL,
    "gender" "text",
    "location" "text",
    "fitness_apps" "text"[] DEFAULT '{}'::"text"[],
    "training_apps" "text"[] DEFAULT '{}'::"text"[],
    "primary_goal" "text" NOT NULL,
    "workout_types" "text"[] NOT NULL,
    "referral_source" "text" NOT NULL,
    "other_fitness_app" "text",
    "other_training_app" "text",
    "other_goal" "text",
    "other_workout" "text",
    "other_referral" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "city" "text",
    "state" "text",
    "referral_code" "text"
);


ALTER TABLE "public"."waitlist_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_activity_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "activity_count" integer DEFAULT 0 NOT NULL,
    "fire_badge_earned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."weekly_activity_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_buddy_pairings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "week_start_date" "date" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "buddy_group" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weekly_buddy_pairings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "challenge_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "total_participants" integer DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."weekly_commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_member_commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "commitment_count" integer NOT NULL,
    "activities_completed" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "movement_days_goal" integer DEFAULT 5,
    "days_completed" integer DEFAULT 0,
    "commitment_met" boolean GENERATED ALWAYS AS (("days_completed" >= "movement_days_goal")) STORED,
    CONSTRAINT "weekly_member_commitments_commitment_count_check" CHECK (("commitment_count" > 0))
);


ALTER TABLE "public"."weekly_member_commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "moai_id" "uuid",
    "workout_type" "text",
    "completion_date" "date" NOT NULL,
    "duration_minutes" integer,
    "exercises_completed" integer,
    "total_exercises" integer,
    "completion_rate" numeric(5,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workout_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workout_completion_id" "uuid",
    "exercise_id" "uuid",
    "coach_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "moai_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "comment_type" "text" DEFAULT 'general'::"text",
    "is_private" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workout_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "workout_id" "uuid" NOT NULL,
    "program_id" "uuid",
    "activity_log_id" "uuid",
    "exercise_data" "jsonb" NOT NULL,
    "notes" "text",
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "program_week_id" "uuid"
);


ALTER TABLE "public"."workout_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workout_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "exercise_order" integer DEFAULT 1 NOT NULL,
    "sets" integer,
    "reps" "text",
    "weight" "text",
    "duration" "text",
    "rest_time" "text",
    "notes" "text"
);


ALTER TABLE "public"."workout_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workout_programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "is_freeform" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_template" boolean DEFAULT false
);


ALTER TABLE "public"."workouts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_reactions"
    ADD CONSTRAINT "activity_reactions_activity_log_id_profile_id_key" UNIQUE ("activity_log_id", "profile_id");



ALTER TABLE ONLY "public"."activity_reactions"
    ADD CONSTRAINT "activity_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_tags"
    ADD CONSTRAINT "activity_tags_activity_log_id_tagged_user_id_key" UNIQUE ("activity_log_id", "tagged_user_id");



ALTER TABLE ONLY "public"."activity_tags"
    ADD CONSTRAINT "activity_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buddy_chat_channels"
    ADD CONSTRAINT "buddy_chat_channels_moai_id_week_start_date_buddy_group_key" UNIQUE ("moai_id", "week_start_date", "buddy_group");



ALTER TABLE ONLY "public"."buddy_chat_channels"
    ADD CONSTRAINT "buddy_chat_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buddy_cycle_pairings"
    ADD CONSTRAINT "buddy_cycle_pairings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buddy_cycles"
    ADD CONSTRAINT "buddy_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buddy_interactions"
    ADD CONSTRAINT "buddy_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buddy_nudges"
    ADD CONSTRAINT "buddy_nudges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buddy_nudges"
    ADD CONSTRAINT "buddy_nudges_sender_id_receiver_id_moai_id_nudge_date_key" UNIQUE ("sender_id", "receiver_id", "moai_id", "nudge_date");



ALTER TABLE ONLY "public"."buddy_prompt_templates"
    ADD CONSTRAINT "buddy_prompt_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_alerts"
    ADD CONSTRAINT "coach_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_announcements"
    ADD CONSTRAINT "coach_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_bulletins"
    ADD CONSTRAINT "coach_bulletins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_calendar_events"
    ADD CONSTRAINT "coach_calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_member_checkins"
    ADD CONSTRAINT "coach_member_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_member_insights"
    ADD CONSTRAINT "coach_member_insights_moai_id_profile_id_week_start_date_key" UNIQUE ("moai_id", "profile_id", "week_start_date");



ALTER TABLE ONLY "public"."coach_member_insights"
    ADD CONSTRAINT "coach_member_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_member_notes"
    ADD CONSTRAINT "coach_member_notes_coach_id_member_id_created_at_key" UNIQUE ("coach_id", "member_id", "created_at");



ALTER TABLE ONLY "public"."coach_member_notes"
    ADD CONSTRAINT "coach_member_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_member_tags"
    ADD CONSTRAINT "coach_member_tags_coach_id_member_id_tag_name_key" UNIQUE ("coach_id", "member_id", "tag_name");



ALTER TABLE ONLY "public"."coach_member_tags"
    ADD CONSTRAINT "coach_member_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_messages"
    ADD CONSTRAINT "coach_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_notes"
    ADD CONSTRAINT "coach_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_private_chat_messages"
    ADD CONSTRAINT "coach_private_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_private_chats"
    ADD CONSTRAINT "coach_private_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_program_audio"
    ADD CONSTRAINT "coach_program_audio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_program_audio"
    ADD CONSTRAINT "coach_program_audio_program_id_coach_id_key" UNIQUE ("program_id", "coach_id");



ALTER TABLE ONLY "public"."coach_relationships"
    ADD CONSTRAINT "coach_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_resources"
    ADD CONSTRAINT "coach_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_sessions"
    ADD CONSTRAINT "coach_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_subscriptions"
    ADD CONSTRAINT "coach_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_workout_audio"
    ADD CONSTRAINT "coach_workout_audio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_workout_audio"
    ADD CONSTRAINT "coach_workout_audio_workout_id_coach_id_key" UNIQUE ("workout_id", "coach_id");



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."coaching_questionnaires"
    ADD CONSTRAINT "coaching_questionnaires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collaborative_workout_exercises"
    ADD CONSTRAINT "collaborative_workout_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collaborative_workout_participants"
    ADD CONSTRAINT "collaborative_workout_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collaborative_workout_participants"
    ADD CONSTRAINT "collaborative_workout_participants_session_id_profile_id_key" UNIQUE ("session_id", "profile_id");



ALTER TABLE ONLY "public"."collaborative_workout_progress"
    ADD CONSTRAINT "collaborative_workout_progres_session_id_exercise_id_profil_key" UNIQUE ("session_id", "exercise_id", "profile_id", "set_number");



ALTER TABLE ONLY "public"."collaborative_workout_progress"
    ADD CONSTRAINT "collaborative_workout_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collaborative_workout_sessions"
    ADD CONSTRAINT "collaborative_workout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commitment_check_ins"
    ADD CONSTRAINT "commitment_check_ins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_history"
    ADD CONSTRAINT "credit_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_checkin_responses"
    ADD CONSTRAINT "daily_checkin_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."elite_week_tracker"
    ADD CONSTRAINT "elite_week_tracker_moai_id_week_start_date_key" UNIQUE ("moai_id", "week_start_date");



ALTER TABLE ONLY "public"."elite_week_tracker"
    ADD CONSTRAINT "elite_week_tracker_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_profile_id_key" UNIQUE ("event_id", "profile_id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_details"
    ADD CONSTRAINT "exercise_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_library_extended"
    ADD CONSTRAINT "exercise_library_extended_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_logs"
    ADD CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_types"
    ADD CONSTRAINT "goal_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."goal_types"
    ADD CONSTRAINT "goal_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_statuses"
    ADD CONSTRAINT "group_statuses_moai_id_status_number_key" UNIQUE ("moai_id", "status_number");



ALTER TABLE ONLY "public"."group_statuses"
    ADD CONSTRAINT "group_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_stones"
    ADD CONSTRAINT "group_stones_moai_id_stone_number_key" UNIQUE ("moai_id", "stone_number");



ALTER TABLE ONLY "public"."group_stones"
    ADD CONSTRAINT "group_stones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hobbies"
    ADD CONSTRAINT "hobbies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."hobbies"
    ADD CONSTRAINT "hobbies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_post_id_profile_id_key" UNIQUE ("post_id", "profile_id");



ALTER TABLE ONLY "public"."member_check_ins"
    ADD CONSTRAINT "member_check_ins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_milestones"
    ADD CONSTRAINT "member_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_profile_id_emoji_key" UNIQUE ("message_id", "profile_id", "emoji");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_read_receipts"
    ADD CONSTRAINT "message_read_receipts_message_id_profile_id_key" UNIQUE ("message_id", "profile_id");



ALTER TABLE ONLY "public"."message_read_receipts"
    ADD CONSTRAINT "message_read_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_replies"
    ADD CONSTRAINT "message_replies_parent_message_id_reply_message_id_key" UNIQUE ("parent_message_id", "reply_message_id");



ALTER TABLE ONLY "public"."message_replies"
    ADD CONSTRAINT "message_replies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_album_photos"
    ADD CONSTRAINT "moai_album_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_blocklist"
    ADD CONSTRAINT "moai_blocklist_moai_id_user_id_key" UNIQUE ("moai_id", "user_id");



ALTER TABLE ONLY "public"."moai_blocklist"
    ADD CONSTRAINT "moai_blocklist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_coaching_chats"
    ADD CONSTRAINT "moai_coaching_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_invitations"
    ADD CONSTRAINT "moai_invitations_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."moai_invitations"
    ADD CONSTRAINT "moai_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_members"
    ADD CONSTRAINT "moai_members_moai_id_profile_id_key" UNIQUE ("moai_id", "profile_id");



ALTER TABLE ONLY "public"."moai_members"
    ADD CONSTRAINT "moai_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_permissions"
    ADD CONSTRAINT "moai_permissions_moai_id_profile_id_permission_id_key" UNIQUE ("moai_id", "profile_id", "permission_id");



ALTER TABLE ONLY "public"."moai_permissions"
    ADD CONSTRAINT "moai_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_photo_tags"
    ADD CONSTRAINT "moai_photo_tags_photo_id_profile_id_key" UNIQUE ("photo_id", "profile_id");



ALTER TABLE ONLY "public"."moai_photo_tags"
    ADD CONSTRAINT "moai_photo_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_program_history"
    ADD CONSTRAINT "moai_program_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_recommendations"
    ADD CONSTRAINT "moai_recommendations_moai_id_profile_id_key" UNIQUE ("moai_id", "profile_id");



ALTER TABLE ONLY "public"."moai_recommendations"
    ADD CONSTRAINT "moai_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_user_invitations"
    ADD CONSTRAINT "moai_user_invitations_moai_id_invited_user_id_key" UNIQUE ("moai_id", "invited_user_id");



ALTER TABLE ONLY "public"."moai_user_invitations"
    ADD CONSTRAINT "moai_user_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moai_weekly_snapshots"
    ADD CONSTRAINT "moai_weekly_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moais"
    ADD CONSTRAINT "moais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nudge_templates"
    ADD CONSTRAINT "nudge_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_trends"
    ADD CONSTRAINT "performance_trends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_trends"
    ADD CONSTRAINT "performance_trends_profile_id_exercise_id_metric_type_week__key" UNIQUE ("profile_id", "exercise_id", "metric_type", "week_start_date");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_workouts"
    ADD CONSTRAINT "plan_workouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_templates"
    ADD CONSTRAINT "program_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_weeks"
    ADD CONSTRAINT "program_weeks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_views"
    ADD CONSTRAINT "story_views_moai_id_profile_id_key" UNIQUE ("moai_id", "profile_id");



ALTER TABLE ONLY "public"."story_views"
    ADD CONSTRAINT "story_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_relationships"
    ADD CONSTRAINT "unique_active_moai_coach" UNIQUE ("coach_id", "moai_id", "status") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."coach_relationships"
    ADD CONSTRAINT "unique_active_user_coach" UNIQUE ("coach_id", "user_id", "status") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."coach_bulletins"
    ADD CONSTRAINT "unique_bulletin_per_moai" UNIQUE ("moai_id");



ALTER TABLE ONLY "public"."coach_private_chats"
    ADD CONSTRAINT "unique_coach_private_chat" UNIQUE ("coach_id", "client_id");



ALTER TABLE ONLY "public"."moai_coaching_chats"
    ADD CONSTRAINT "unique_moai_coaching_chat" UNIQUE ("moai_id", "coach_id");



ALTER TABLE ONLY "public"."program_weeks"
    ADD CONSTRAINT "unique_program_week_order" UNIQUE ("program_id", "week_number", "workout_order");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "unique_user_badge_key" UNIQUE ("profile_id", "badge_key");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_commitments"
    ADD CONSTRAINT "user_commitments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_commitments"
    ADD CONSTRAINT "user_commitments_profile_id_week_start_date_key" UNIQUE ("profile_id", "week_start_date");



ALTER TABLE ONLY "public"."user_program_assignments"
    ADD CONSTRAINT "user_program_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_program_assignments"
    ADD CONSTRAINT "user_program_assignments_profile_id_program_id_status_key" UNIQUE ("profile_id", "program_id", "status");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_id_key" UNIQUE ("user_id", "role_id");



ALTER TABLE ONLY "public"."user_status"
    ADD CONSTRAINT "user_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_status"
    ADD CONSTRAINT "user_status_profile_id_moai_id_key" UNIQUE ("profile_id", "moai_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_moai_id_key" UNIQUE ("user_id", "moai_id");



ALTER TABLE ONLY "public"."waitlist_submissions"
    ADD CONSTRAINT "waitlist_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_activity_summary"
    ADD CONSTRAINT "weekly_activity_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_activity_summary"
    ADD CONSTRAINT "weekly_activity_summary_profile_id_week_start_date_key" UNIQUE ("profile_id", "week_start_date");



ALTER TABLE ONLY "public"."weekly_buddy_pairings"
    ADD CONSTRAINT "weekly_buddy_pairings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_commitments"
    ADD CONSTRAINT "weekly_commitments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_member_commitments"
    ADD CONSTRAINT "weekly_member_commitments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_member_commitments"
    ADD CONSTRAINT "weekly_member_commitments_profile_id_moai_id_week_start_dat_key" UNIQUE ("profile_id", "moai_id", "week_start_date");



ALTER TABLE ONLY "public"."workout_analytics"
    ADD CONSTRAINT "workout_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_comments"
    ADD CONSTRAINT "workout_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_completions"
    ADD CONSTRAINT "workout_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_programs"
    ADD CONSTRAINT "workout_programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_logs_logged_at_timestamp" ON "public"."activity_logs" USING "btree" ("logged_at");



CREATE INDEX "idx_activity_tags_expires" ON "public"."activity_tags" USING "btree" ("expires_at");



CREATE INDEX "idx_activity_tags_status" ON "public"."activity_tags" USING "btree" ("status");



CREATE INDEX "idx_activity_tags_tagged_user" ON "public"."activity_tags" USING "btree" ("tagged_user_id");



CREATE INDEX "idx_buddy_interactions_week_moai" ON "public"."buddy_interactions" USING "btree" ("week_start_date", "moai_id");



CREATE INDEX "idx_coach_alerts_coach_unread" ON "public"."coach_alerts" USING "btree" ("coach_id", "is_read");



CREATE INDEX "idx_coach_announcements_moai_coach" ON "public"."coach_announcements" USING "btree" ("moai_id", "coach_id");



CREATE INDEX "idx_coach_member_insights_moai_id" ON "public"."coach_member_insights" USING "btree" ("moai_id");



CREATE INDEX "idx_coach_member_insights_moai_week" ON "public"."coach_member_insights" USING "btree" ("moai_id", "week_start_date");



CREATE INDEX "idx_coach_member_insights_profile_id" ON "public"."coach_member_insights" USING "btree" ("profile_id");



CREATE INDEX "idx_coach_notes_coach_id" ON "public"."coach_notes" USING "btree" ("coach_id");



CREATE INDEX "idx_coach_notes_created_at" ON "public"."coach_notes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_coach_notes_member_id" ON "public"."coach_notes" USING "btree" ("member_id");



CREATE INDEX "idx_coach_notes_moai_id" ON "public"."coach_notes" USING "btree" ("moai_id");



CREATE INDEX "idx_collaborative_exercises_session" ON "public"."collaborative_workout_exercises" USING "btree" ("session_id");



CREATE INDEX "idx_collaborative_participants_session_profile" ON "public"."collaborative_workout_participants" USING "btree" ("session_id", "profile_id");



CREATE INDEX "idx_collaborative_progress_session_user" ON "public"."collaborative_workout_progress" USING "btree" ("session_id", "profile_id");



CREATE INDEX "idx_collaborative_sessions_created_by" ON "public"."collaborative_workout_sessions" USING "btree" ("created_by");



CREATE INDEX "idx_collaborative_sessions_status" ON "public"."collaborative_workout_sessions" USING "btree" ("status");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_credit_history_billing_cycle" ON "public"."credit_history" USING "btree" ("billing_cycle_start");



CREATE INDEX "idx_credit_history_type" ON "public"."credit_history" USING "btree" ("credit_type");



CREATE INDEX "idx_credit_history_user_id" ON "public"."credit_history" USING "btree" ("user_id");



CREATE INDEX "idx_daily_checkin_responses_checkin_member" ON "public"."daily_checkin_responses" USING "btree" ("checkin_id", "member_id");



CREATE INDEX "idx_daily_checkins_moai_coach" ON "public"."daily_checkins" USING "btree" ("moai_id", "coach_id");



CREATE INDEX "idx_elite_week_tracker_moai_week" ON "public"."elite_week_tracker" USING "btree" ("moai_id", "week_start_date");



CREATE INDEX "idx_events_moai_id" ON "public"."events" USING "btree" ("moai_id");



CREATE INDEX "idx_exercise_details_workout_exercise_id" ON "public"."exercise_details" USING "btree" ("workout_exercise_id");



CREATE INDEX "idx_exercise_library_extended_coach_id" ON "public"."exercise_library_extended" USING "btree" ("coach_id");



CREATE INDEX "idx_exercise_logs_date" ON "public"."exercise_logs" USING "btree" ("date");



CREATE INDEX "idx_exercise_logs_user_exercise" ON "public"."exercise_logs" USING "btree" ("user_id", "exercise_id");



CREATE INDEX "idx_exercises_category" ON "public"."exercises" USING "btree" ("category");



CREATE INDEX "idx_exercises_default_type" ON "public"."exercises" USING "btree" ("default_type");



CREATE INDEX "idx_exercises_muscle_group" ON "public"."exercises" USING "btree" ("muscle_group");



CREATE INDEX "idx_group_statuses_moai" ON "public"."group_statuses" USING "btree" ("moai_id", "status_number");



CREATE INDEX "idx_group_stones_moai" ON "public"."group_stones" USING "btree" ("moai_id", "stone_number");



CREATE INDEX "idx_likes_post_id" ON "public"."likes" USING "btree" ("post_id");



CREATE INDEX "idx_member_check_ins_moai_member_week" ON "public"."member_check_ins" USING "btree" ("moai_id", "member_id", "week_start_date");



CREATE INDEX "idx_member_milestones_member_moai" ON "public"."member_milestones" USING "btree" ("member_id", "moai_id");



CREATE INDEX "idx_message_read_receipts_message_id" ON "public"."message_read_receipts" USING "btree" ("message_id");



CREATE INDEX "idx_message_read_receipts_profile_id" ON "public"."message_read_receipts" USING "btree" ("profile_id");



CREATE INDEX "idx_message_read_receipts_read_at" ON "public"."message_read_receipts" USING "btree" ("read_at");



CREATE INDEX "idx_messages_buddy_chat" ON "public"."messages" USING "btree" ("is_buddy_chat", "buddy_chat_week_start") WHERE ("is_buddy_chat" = true);



CREATE INDEX "idx_messages_moai_id" ON "public"."messages" USING "btree" ("moai_id");



CREATE INDEX "idx_moai_blocklist_moai_user" ON "public"."moai_blocklist" USING "btree" ("moai_id", "user_id");



CREATE INDEX "idx_moai_members_active" ON "public"."moai_members" USING "btree" ("is_active");



CREATE INDEX "idx_moai_members_moai_active" ON "public"."moai_members" USING "btree" ("moai_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_moai_members_moai_id" ON "public"."moai_members" USING "btree" ("moai_id");



CREATE INDEX "idx_moai_members_moai_profile_active" ON "public"."moai_members" USING "btree" ("moai_id", "profile_id", "is_active");



CREATE INDEX "idx_moai_members_profile_active" ON "public"."moai_members" USING "btree" ("profile_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_moai_members_profile_id" ON "public"."moai_members" USING "btree" ("profile_id");



CREATE INDEX "idx_moai_user_invitations_invited_user" ON "public"."moai_user_invitations" USING "btree" ("invited_user_id");



CREATE INDEX "idx_moai_user_invitations_moai" ON "public"."moai_user_invitations" USING "btree" ("moai_id");



CREATE INDEX "idx_moai_weekly_snapshots_commitment" ON "public"."moai_weekly_snapshots" USING "btree" ("met_weekly_commitment");



CREATE INDEX "idx_moai_weekly_snapshots_member_id" ON "public"."moai_weekly_snapshots" USING "btree" ("member_id");



CREATE INDEX "idx_moai_weekly_snapshots_moai_id" ON "public"."moai_weekly_snapshots" USING "btree" ("moai_id");



CREATE UNIQUE INDEX "idx_moai_weekly_snapshots_unique" ON "public"."moai_weekly_snapshots" USING "btree" ("moai_id", "member_id", "week_start_date");



CREATE INDEX "idx_moai_weekly_snapshots_week_start" ON "public"."moai_weekly_snapshots" USING "btree" ("week_start_date");



CREATE INDEX "idx_moais_capacity_available" ON "public"."moais" USING "btree" ("capacity", "member_count") WHERE ("member_count" < "capacity");



CREATE INDEX "idx_moais_goal_type" ON "public"."moais" USING "btree" ("goal_type");



CREATE INDEX "idx_moais_status_active" ON "public"."moais" USING "btree" ("status", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_moais_type" ON "public"."moais" USING "btree" ("type");



CREATE INDEX "idx_notifications_profile_id" ON "public"."notifications" USING "btree" ("profile_id");



CREATE INDEX "idx_nudge_templates_coach" ON "public"."nudge_templates" USING "btree" ("coach_id");



CREATE INDEX "idx_performance_trends_profile_week" ON "public"."performance_trends" USING "btree" ("profile_id", "week_start_date");



CREATE INDEX "idx_posts_moai_id" ON "public"."posts" USING "btree" ("moai_id");



CREATE INDEX "idx_program_templates_coach_id" ON "public"."program_templates" USING "btree" ("coach_id");



CREATE INDEX "idx_program_weeks_program_id" ON "public"."program_weeks" USING "btree" ("program_id");



CREATE INDEX "idx_program_weeks_week_number" ON "public"."program_weeks" USING "btree" ("week_number");



CREATE UNIQUE INDEX "idx_unique_active_user_coach" ON "public"."coach_subscriptions" USING "btree" ("user_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_user_badges_profile_key" ON "public"."user_badges" USING "btree" ("profile_id", "badge_key");



CREATE INDEX "idx_user_badges_profile_type" ON "public"."user_badges" USING "btree" ("profile_id", "badge_type");



CREATE INDEX "idx_user_commitments_week_profile" ON "public"."user_commitments" USING "btree" ("week_start_date", "profile_id");



CREATE INDEX "idx_waitlist_submissions_referral_code" ON "public"."waitlist_submissions" USING "btree" ("referral_code") WHERE ("referral_code" IS NOT NULL);



CREATE INDEX "idx_weekly_member_commitments_moai_week" ON "public"."weekly_member_commitments" USING "btree" ("moai_id", "week_start_date");



CREATE INDEX "idx_weekly_member_commitments_profile_moai" ON "public"."weekly_member_commitments" USING "btree" ("profile_id", "moai_id");



CREATE INDEX "idx_weekly_member_commitments_week" ON "public"."weekly_member_commitments" USING "btree" ("week_start_date");



CREATE INDEX "idx_workout_analytics_profile_moai" ON "public"."workout_analytics" USING "btree" ("profile_id", "moai_id");



CREATE INDEX "idx_workout_comments_moai_member" ON "public"."workout_comments" USING "btree" ("moai_id", "member_id");



CREATE INDEX "idx_workout_completions_completed_at" ON "public"."workout_completions" USING "btree" ("completed_at");



CREATE INDEX "idx_workout_completions_profile_program_week_completed" ON "public"."workout_completions" USING "btree" ("profile_id", "program_week_id", "completed_at");



CREATE INDEX "idx_workout_completions_profile_workout" ON "public"."workout_completions" USING "btree" ("profile_id", "workout_id");



CREATE INDEX "idx_workout_completions_program_week_id" ON "public"."workout_completions" USING "btree" ("program_week_id");



CREATE INDEX "idx_workout_exercises_order_index" ON "public"."workout_exercises" USING "btree" ("order_index");



CREATE INDEX "idx_workout_exercises_workout_id" ON "public"."workout_exercises" USING "btree" ("workout_id");



CREATE OR REPLACE TRIGGER "auto_assign_program_on_member_join" AFTER INSERT ON "public"."moai_members" FOR EACH ROW EXECUTE FUNCTION "public"."auto_assign_moai_program_to_new_member"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_coach_sessions" BEFORE UPDATE ON "public"."coach_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_coaches" BEFORE UPDATE ON "public"."coaches" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_user_commitments" BEFORE UPDATE ON "public"."user_commitments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_weekly_commitments" BEFORE UPDATE ON "public"."weekly_commitments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_notify_activity_reaction" AFTER INSERT ON "public"."activity_reactions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_activity_reaction"();



CREATE OR REPLACE TRIGGER "trigger_rest_day_replacement" AFTER INSERT OR UPDATE ON "public"."activity_logs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_rest_day_replacement"();



CREATE OR REPLACE TRIGGER "trigger_update_activity_count_and_badges" AFTER INSERT ON "public"."activity_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_count_and_badges"();



CREATE OR REPLACE TRIGGER "trigger_update_moai_member_count_delete" AFTER DELETE ON "public"."moai_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_moai_member_count"();



CREATE OR REPLACE TRIGGER "trigger_update_moai_member_count_insert" AFTER INSERT ON "public"."moai_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_moai_member_count"();



CREATE OR REPLACE TRIGGER "trigger_update_moai_member_count_update" AFTER UPDATE ON "public"."moai_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_moai_member_count"();



CREATE OR REPLACE TRIGGER "update_coach_relationships_updated_at" BEFORE UPDATE ON "public"."coach_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_coach_resources_updated_at" BEFORE UPDATE ON "public"."coach_resources" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_coach_subscriptions_updated_at" BEFORE UPDATE ON "public"."coach_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_coaching_questionnaires_updated_at" BEFORE UPDATE ON "public"."coaching_questionnaires" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_commitment_progress_trigger" AFTER INSERT OR UPDATE ON "public"."activity_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_weekly_commitment_progress"();



CREATE OR REPLACE TRIGGER "update_credit_history_updated_at" BEFORE UPDATE ON "public"."credit_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_credit_history_updated_at"();



CREATE OR REPLACE TRIGGER "update_fire_badges_trigger" AFTER INSERT ON "public"."activity_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_weekly_activity_and_fire_badges"();



CREATE OR REPLACE TRIGGER "update_moai_count_on_member_change" AFTER INSERT OR DELETE ON "public"."moai_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_moai_member_count"();



CREATE OR REPLACE TRIGGER "update_moai_user_invitations_updated_at" BEFORE UPDATE ON "public"."moai_user_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_waitlist_submissions_updated_at" BEFORE UPDATE ON "public"."waitlist_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_weekly_member_commitments_updated_at" BEFORE UPDATE ON "public"."weekly_member_commitments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."activity_reactions"
    ADD CONSTRAINT "activity_reactions_activity_log_id_fkey" FOREIGN KEY ("activity_log_id") REFERENCES "public"."activity_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_reactions"
    ADD CONSTRAINT "activity_reactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_tags"
    ADD CONSTRAINT "activity_tags_activity_log_id_fkey" FOREIGN KEY ("activity_log_id") REFERENCES "public"."activity_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_tags"
    ADD CONSTRAINT "activity_tags_linked_activity_log_id_fkey" FOREIGN KEY ("linked_activity_log_id") REFERENCES "public"."activity_logs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_tags"
    ADD CONSTRAINT "activity_tags_tagged_by_user_id_fkey" FOREIGN KEY ("tagged_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_tags"
    ADD CONSTRAINT "activity_tags_tagged_user_id_fkey" FOREIGN KEY ("tagged_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buddy_cycle_pairings"
    ADD CONSTRAINT "buddy_cycle_pairings_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."buddy_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buddy_interactions"
    ADD CONSTRAINT "buddy_interactions_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buddy_nudges"
    ADD CONSTRAINT "buddy_nudges_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buddy_nudges"
    ADD CONSTRAINT "buddy_nudges_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buddy_nudges"
    ADD CONSTRAINT "buddy_nudges_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_announcements"
    ADD CONSTRAINT "coach_announcements_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_announcements"
    ADD CONSTRAINT "coach_announcements_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_member_insights"
    ADD CONSTRAINT "coach_member_insights_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_messages"
    ADD CONSTRAINT "coach_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_messages"
    ADD CONSTRAINT "coach_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."coach_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_notes"
    ADD CONSTRAINT "coach_notes_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_notes"
    ADD CONSTRAINT "coach_notes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_notes"
    ADD CONSTRAINT "coach_notes_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_private_chat_messages"
    ADD CONSTRAINT "coach_private_chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."coach_private_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_private_chats"
    ADD CONSTRAINT "coach_private_chats_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_private_chats"
    ADD CONSTRAINT "coach_private_chats_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_relationships"
    ADD CONSTRAINT "coach_relationships_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_relationships"
    ADD CONSTRAINT "coach_relationships_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_relationships"
    ADD CONSTRAINT "coach_relationships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_resources"
    ADD CONSTRAINT "coach_resources_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_sessions"
    ADD CONSTRAINT "coach_sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_sessions"
    ADD CONSTRAINT "coach_sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_subscriptions"
    ADD CONSTRAINT "coach_subscriptions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_subscriptions"
    ADD CONSTRAINT "coach_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_workout_audio"
    ADD CONSTRAINT "coach_workout_audio_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_workout_audio"
    ADD CONSTRAINT "coach_workout_audio_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_exercises"
    ADD CONSTRAINT "collaborative_workout_exercises_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_exercises"
    ADD CONSTRAINT "collaborative_workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_exercises"
    ADD CONSTRAINT "collaborative_workout_exercises_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."collaborative_workout_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_participants"
    ADD CONSTRAINT "collaborative_workout_participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_participants"
    ADD CONSTRAINT "collaborative_workout_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."collaborative_workout_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_progress"
    ADD CONSTRAINT "collaborative_workout_progress_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_progress"
    ADD CONSTRAINT "collaborative_workout_progress_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_progress"
    ADD CONSTRAINT "collaborative_workout_progress_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."collaborative_workout_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborative_workout_sessions"
    ADD CONSTRAINT "collaborative_workout_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commitment_check_ins"
    ADD CONSTRAINT "commitment_check_ins_user_commitment_id_fkey" FOREIGN KEY ("user_commitment_id") REFERENCES "public"."user_commitments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."credit_history"
    ADD CONSTRAINT "credit_history_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id");



ALTER TABLE ONLY "public"."credit_history"
    ADD CONSTRAINT "credit_history_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id");



ALTER TABLE ONLY "public"."credit_history"
    ADD CONSTRAINT "credit_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_checkin_responses"
    ADD CONSTRAINT "daily_checkin_responses_checkin_id_fkey" FOREIGN KEY ("checkin_id") REFERENCES "public"."daily_checkins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_checkin_responses"
    ADD CONSTRAINT "daily_checkin_responses_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_details"
    ADD CONSTRAINT "exercise_details_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_library_extended"
    ADD CONSTRAINT "exercise_library_extended_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_library_extended"
    ADD CONSTRAINT "exercise_library_extended_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_bulletins"
    ADD CONSTRAINT "fk_coach_bulletins_coach_id" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_bulletins"
    ADD CONSTRAINT "fk_coach_bulletins_moai_id" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "fk_permission" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "fk_role" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "fk_workout_exercises_exercise_id" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_check_ins"
    ADD CONSTRAINT "member_check_ins_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_check_ins"
    ADD CONSTRAINT "member_check_ins_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_milestones"
    ADD CONSTRAINT "member_milestones_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_milestones"
    ADD CONSTRAINT "member_milestones_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_milestones"
    ADD CONSTRAINT "member_milestones_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_read_receipts"
    ADD CONSTRAINT "message_read_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_read_receipts"
    ADD CONSTRAINT "message_read_receipts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_replies"
    ADD CONSTRAINT "message_replies_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_replies"
    ADD CONSTRAINT "message_replies_reply_message_id_fkey" FOREIGN KEY ("reply_message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_coach_private_chat_id_fkey" FOREIGN KEY ("coach_private_chat_id") REFERENCES "public"."coach_private_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_moai_coaching_chat_id_fkey" FOREIGN KEY ("moai_coaching_chat_id") REFERENCES "public"."moai_coaching_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_album_photos"
    ADD CONSTRAINT "moai_album_photos_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_album_photos"
    ADD CONSTRAINT "moai_album_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_blocklist"
    ADD CONSTRAINT "moai_blocklist_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."moai_blocklist"
    ADD CONSTRAINT "moai_blocklist_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_blocklist"
    ADD CONSTRAINT "moai_blocklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_coaching_chats"
    ADD CONSTRAINT "moai_coaching_chats_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_coaching_chats"
    ADD CONSTRAINT "moai_coaching_chats_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_invitations"
    ADD CONSTRAINT "moai_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_invitations"
    ADD CONSTRAINT "moai_invitations_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_members"
    ADD CONSTRAINT "moai_members_current_program_id_fkey" FOREIGN KEY ("current_program_id") REFERENCES "public"."workout_programs"("id");



ALTER TABLE ONLY "public"."moai_members"
    ADD CONSTRAINT "moai_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."moai_members"
    ADD CONSTRAINT "moai_members_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_members"
    ADD CONSTRAINT "moai_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_permissions"
    ADD CONSTRAINT "moai_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."moai_permissions"
    ADD CONSTRAINT "moai_permissions_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_permissions"
    ADD CONSTRAINT "moai_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_permissions"
    ADD CONSTRAINT "moai_permissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_photo_tags"
    ADD CONSTRAINT "moai_photo_tags_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."moai_album_photos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_photo_tags"
    ADD CONSTRAINT "moai_photo_tags_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_photo_tags"
    ADD CONSTRAINT "moai_photo_tags_tagged_by_fkey" FOREIGN KEY ("tagged_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_program_history"
    ADD CONSTRAINT "moai_program_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."moai_program_history"
    ADD CONSTRAINT "moai_program_history_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_program_history"
    ADD CONSTRAINT "moai_program_history_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."workout_programs"("id");



ALTER TABLE ONLY "public"."moai_recommendations"
    ADD CONSTRAINT "moai_recommendations_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_recommendations"
    ADD CONSTRAINT "moai_recommendations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_user_invitations"
    ADD CONSTRAINT "moai_user_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_user_invitations"
    ADD CONSTRAINT "moai_user_invitations_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_user_invitations"
    ADD CONSTRAINT "moai_user_invitations_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_weekly_snapshots"
    ADD CONSTRAINT "moai_weekly_snapshots_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moai_weekly_snapshots"
    ADD CONSTRAINT "moai_weekly_snapshots_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moais"
    ADD CONSTRAINT "moais_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."moais"
    ADD CONSTRAINT "moais_current_program_id_fkey" FOREIGN KEY ("current_program_id") REFERENCES "public"."workout_programs"("id");



ALTER TABLE ONLY "public"."moais"
    ADD CONSTRAINT "moais_guide_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_workouts"
    ADD CONSTRAINT "plan_workouts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_current_coach_id_fkey" FOREIGN KEY ("current_coach_id") REFERENCES "public"."coaches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_templates"
    ADD CONSTRAINT "program_templates_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_weeks"
    ADD CONSTRAINT "program_weeks_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."workout_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_weeks"
    ADD CONSTRAINT "program_weeks_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_views"
    ADD CONSTRAINT "story_views_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_views"
    ADD CONSTRAINT "story_views_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_commitments"
    ADD CONSTRAINT "user_commitments_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "public"."weekly_commitments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_commitments"
    ADD CONSTRAINT "user_commitments_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_commitments"
    ADD CONSTRAINT "user_commitments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_program_assignments"
    ADD CONSTRAINT "user_program_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_program_assignments"
    ADD CONSTRAINT "user_program_assignments_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id");



ALTER TABLE ONLY "public"."user_program_assignments"
    ADD CONSTRAINT "user_program_assignments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_program_assignments"
    ADD CONSTRAINT "user_program_assignments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."workout_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_status"
    ADD CONSTRAINT "user_status_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_status"
    ADD CONSTRAINT "user_status_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_activity_summary"
    ADD CONSTRAINT "weekly_activity_summary_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_buddy_pairings"
    ADD CONSTRAINT "weekly_buddy_pairings_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_member_commitments"
    ADD CONSTRAINT "weekly_member_commitments_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_member_commitments"
    ADD CONSTRAINT "weekly_member_commitments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_analytics"
    ADD CONSTRAINT "workout_analytics_moai_id_fkey" FOREIGN KEY ("moai_id") REFERENCES "public"."moais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_analytics"
    ADD CONSTRAINT "workout_analytics_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_completions"
    ADD CONSTRAINT "workout_completions_activity_log_id_fkey" FOREIGN KEY ("activity_log_id") REFERENCES "public"."activity_logs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workout_completions"
    ADD CONSTRAINT "workout_completions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_completions"
    ADD CONSTRAINT "workout_completions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."workout_programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workout_completions"
    ADD CONSTRAINT "workout_completions_program_week_id_fkey" FOREIGN KEY ("program_week_id") REFERENCES "public"."program_weeks"("id");



ALTER TABLE ONLY "public"."workout_completions"
    ADD CONSTRAINT "workout_completions_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_programs"
    ADD CONSTRAINT "workout_programs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete waitlist submissions" ON "public"."waitlist_submissions" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage buddy pairings" ON "public"."weekly_buddy_pairings" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage permissions" ON "public"."permissions" USING ("public"."is_admin"());



CREATE POLICY "Admins can update any profile" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Admins can update waitlist submissions" ON "public"."waitlist_submissions" FOR UPDATE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view waitlist submissions" ON "public"."waitlist_submissions" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Allow anyone to read hobbies" ON "public"."hobbies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public waitlist submissions" ON "public"."waitlist_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can add participants" ON "public"."collaborative_workout_participants" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view active coach resources" ON "public"."coach_resources" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active coaches" ON "public"."coaches" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active commitments" ON "public"."weekly_commitments" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active prompt templates" ON "public"."buddy_prompt_templates" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view community posts" ON "public"."community_posts" FOR SELECT USING (true);



CREATE POLICY "Anyone can view events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Anyone can view exercises" ON "public"."exercises" FOR SELECT USING (true);



CREATE POLICY "Anyone can view hobbies" ON "public"."hobbies" FOR SELECT USING (true);



CREATE POLICY "Anyone can view user status" ON "public"."user_status" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can create events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create exercises" ON "public"."exercises" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create sessions" ON "public"."collaborative_workout_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Authenticated users can delete exercises" ON "public"."exercises" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update exercises" ON "public"."exercises" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all profiles for collaboration" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Chat participants can send messages" ON "public"."coach_private_chat_messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."coach_private_chats" "cpc"
  WHERE (("cpc"."id" = "coach_private_chat_messages"."chat_id") AND (("cpc"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."coaches" "c"
          WHERE (("c"."id" = "cpc"."coach_id") AND ("c"."profile_id" = "auth"."uid"()))))))))));



CREATE POLICY "Chat participants can view messages" ON "public"."coach_private_chat_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."coach_private_chats" "cpc"
  WHERE (("cpc"."id" = "coach_private_chat_messages"."chat_id") AND (("cpc"."client_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."coaches" "c"
          WHERE (("c"."id" = "cpc"."coach_id") AND ("c"."profile_id" = "auth"."uid"())))))))));



CREATE POLICY "Coaches and clients can update sessions" ON "public"."coach_sessions" FOR UPDATE USING ((("auth"."uid"() = "client_id") OR ("auth"."uid"() IN ( SELECT "c"."profile_id"
   FROM "public"."coaches" "c"
  WHERE ("c"."id" = "coach_sessions"."coach_id")))));



CREATE POLICY "Coaches can create calendar events" ON "public"."coach_calendar_events" FOR INSERT WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can create member checkins" ON "public"."coach_member_checkins" FOR INSERT WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can create member notes" ON "public"."coach_member_notes" FOR INSERT WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can create member tags" ON "public"."coach_member_tags" FOR INSERT WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can create notes for their moai members" ON "public"."coach_notes" FOR INSERT WITH CHECK (((("auth"."uid"() = "coach_id") AND (EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "coach_notes"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."role_in_moai" = 'coach'::"text"))))) OR (EXISTS ( SELECT 1
   FROM "public"."moais" "m"
  WHERE (("m"."id" = "coach_notes"."moai_id") AND ("m"."coach_id" = "auth"."uid"()))))));



CREATE POLICY "Coaches can delete their own calendar events" ON "public"."coach_calendar_events" FOR DELETE USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can delete their own member notes" ON "public"."coach_member_notes" FOR DELETE USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can delete their own member tags" ON "public"."coach_member_tags" FOR DELETE USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can delete their own notes" ON "public"."coach_notes" FOR DELETE USING (("auth"."uid"() = "coach_id"));



CREATE POLICY "Coaches can manage comments for their moais" ON "public"."workout_comments" USING ((("coach_id" = "auth"."uid"()) OR ("member_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."moais" "m"
  WHERE (("m"."id" = "workout_comments"."moai_id") AND ("m"."coach_id" = "auth"."uid"()))))));



CREATE POLICY "Coaches can manage their own bulletins" ON "public"."coach_bulletins" USING (("auth"."uid"() = "coach_id"));



CREATE POLICY "Coaches can manage their own program audio" ON "public"."coach_program_audio" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can manage their own resources" ON "public"."coach_resources" USING ((EXISTS ( SELECT 1
   FROM "public"."coaches" "c"
  WHERE (("c"."id" = "coach_resources"."coach_id") AND ("c"."profile_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."coaches" "c"
  WHERE (("c"."id" = "coach_resources"."coach_id") AND ("c"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Coaches can manage their own templates" ON "public"."nudge_templates" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can manage their own workout audio" ON "public"."coach_workout_audio" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can update their own calendar events" ON "public"."coach_calendar_events" FOR UPDATE USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can update their own member checkins" ON "public"."coach_member_checkins" FOR UPDATE USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can update their own member notes" ON "public"."coach_member_notes" FOR UPDATE USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can update their own member tags" ON "public"."coach_member_tags" FOR UPDATE USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can update their own notes" ON "public"."coach_notes" FOR UPDATE USING (("auth"."uid"() = "coach_id"));



CREATE POLICY "Coaches can view insights for their moais" ON "public"."coach_member_insights" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."moais" "m"
  WHERE (("m"."id" = "coach_member_insights"."moai_id") AND ("m"."coach_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "mm"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."role_in_moai" = 'coach'::"text"))))));



CREATE POLICY "Coaches can view member trends in their moais" ON "public"."performance_trends" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."moai_members" "mm"
     JOIN "public"."moais" "m" ON (("mm"."moai_id" = "m"."id")))
  WHERE (("mm"."profile_id" = "mm"."profile_id") AND (("m"."coach_id" = "auth"."uid"()) OR (("mm"."profile_id" = "auth"."uid"()) AND ("mm"."role_in_moai" = 'coach'::"text")))))));



CREATE POLICY "Coaches can view notes for their moai members" ON "public"."coach_notes" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "coach_notes"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."role_in_moai" = 'coach'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."moais" "m"
  WHERE (("m"."id" = "coach_notes"."moai_id") AND ("m"."coach_id" = "auth"."uid"()))))));



CREATE POLICY "Coaches can view their client chats" ON "public"."coach_private_chats" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."coaches" "c"
  WHERE (("c"."id" = "coach_private_chats"."coach_id") AND ("c"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Coaches can view their client questionnaires" ON "public"."coaching_questionnaires" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."coaches" "c"
  WHERE (("c"."id" = "coaching_questionnaires"."coach_id") AND ("c"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Coaches can view their client subscriptions" ON "public"."coach_subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."coaches" "c"
  WHERE (("c"."id" = "coach_subscriptions"."coach_id") AND ("c"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Coaches can view their group coaching chats" ON "public"."moai_coaching_chats" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."coaches" "c"
  WHERE (("c"."id" = "moai_coaching_chats"."coach_id") AND ("c"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Coaches can view their own alerts" ON "public"."coach_alerts" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can view their own calendar events" ON "public"."coach_calendar_events" FOR SELECT USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can view their own member checkins" ON "public"."coach_member_checkins" FOR SELECT USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can view their own member notes" ON "public"."coach_member_notes" FOR SELECT USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can view their own member tags" ON "public"."coach_member_tags" FOR SELECT USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches can view their own relationships" ON "public"."coach_relationships" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."coaches" "c"
  WHERE (("c"."id" = "coach_relationships"."coach_id") AND ("c"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Creators can delete their moais" ON "public"."moais" FOR DELETE TO "authenticated" USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Creators can delete their own moais" ON "public"."moais" FOR DELETE TO "authenticated" USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Creators can update their moais" ON "public"."moais" FOR UPDATE TO "authenticated" USING (("creator_id" = "auth"."uid"())) WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Creators can update their own moais" ON "public"."moais" FOR UPDATE TO "authenticated" USING (("creator_id" = "auth"."uid"())) WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Everyone can view permissions" ON "public"."permissions" FOR SELECT USING (true);



CREATE POLICY "Exercise adders can remove their exercises" ON "public"."collaborative_workout_exercises" FOR DELETE USING (("added_by" = "auth"."uid"()));



CREATE POLICY "Exercise creators can delete their exercises" ON "public"."collaborative_workout_exercises" FOR DELETE USING (("auth"."uid"() = "added_by"));



CREATE POLICY "Exercise details are viewable by everyone" ON "public"."exercise_details" FOR SELECT USING (true);



CREATE POLICY "Exercises are viewable by everyone" ON "public"."exercises" FOR SELECT USING (true);



CREATE POLICY "Goal types are viewable by authenticated users" ON "public"."goal_types" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Invited users can join moai" ON "public"."moai_members" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."moai_invitations" "mi"
  WHERE (("mi"."moai_id" = "moai_members"."moai_id") AND ("mi"."is_active" = true) AND (("mi"."expires_at" IS NULL) OR ("mi"."expires_at" > "now"())) AND (("mi"."max_uses" IS NULL) OR ("mi"."current_uses" < "mi"."max_uses"))))) AND ("profile_id" = "auth"."uid"())));



CREATE POLICY "Invited users can update their invitation status" ON "public"."moai_user_invitations" FOR UPDATE USING (("invited_user_id" = "auth"."uid"()));



CREATE POLICY "Members can add photos to their moai" ON "public"."moai_album_photos" FOR INSERT WITH CHECK ((("auth"."uid"() = "uploaded_by") AND (EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "moai_album_photos"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Members can delete their own photos" ON "public"."moai_album_photos" FOR DELETE USING ((("auth"."uid"() = "uploaded_by") AND (EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "moai_album_photos"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Members can delete their own tags" ON "public"."moai_photo_tags" FOR DELETE USING ((("auth"."uid"() = "tagged_by") OR ("auth"."uid"() = "profile_id")));



CREATE POLICY "Members can insert their own check-ins" ON "public"."member_check_ins" FOR INSERT WITH CHECK (("member_id" = "auth"."uid"()));



CREATE POLICY "Members can tag other members in photos" ON "public"."moai_photo_tags" FOR INSERT WITH CHECK ((("auth"."uid"() = "tagged_by") AND (EXISTS ( SELECT 1
   FROM ("public"."moai_album_photos" "p"
     JOIN "public"."moai_members" "m" ON (("m"."moai_id" = "p"."moai_id")))
  WHERE (("p"."id" = "moai_photo_tags"."photo_id") AND ("m"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Members can update their own check-ins" ON "public"."member_check_ins" FOR UPDATE USING (("member_id" = "auth"."uid"()));



CREATE POLICY "Members can update their own photos" ON "public"."moai_album_photos" FOR UPDATE USING ((("auth"."uid"() = "uploaded_by") AND (EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "moai_album_photos"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Members can view moai photos" ON "public"."moai_album_photos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "moai_album_photos"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Members can view photo tags" ON "public"."moai_photo_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."moai_album_photos" "p"
     JOIN "public"."moai_members" "m" ON (("m"."moai_id" = "p"."moai_id")))
  WHERE (("p"."id" = "moai_photo_tags"."photo_id") AND ("m"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Members can view profiles of users in the same moai" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "id") OR "public"."users_share_moai"("auth"."uid"(), "id")));



CREATE POLICY "Members can view their coach's program audio" ON "public"."coach_program_audio" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."moai_members" "mm"
     JOIN "public"."moais" "m" ON (("mm"."moai_id" = "m"."id")))
  WHERE (("mm"."profile_id" = "auth"."uid"()) AND ("m"."coach_id" = "m"."coach_id") AND ("mm"."is_active" = true)))));



CREATE POLICY "Members can view their coach's resources" ON "public"."coach_resources" FOR SELECT USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."coach_subscriptions" "cs"
  WHERE (("cs"."coach_id" = "coach_resources"."coach_id") AND ("cs"."user_id" = "auth"."uid"()) AND ("cs"."status" = 'active'::"text"))))));



CREATE POLICY "Members can view their coach's workout audio" ON "public"."coach_workout_audio" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."moai_members" "mm"
     JOIN "public"."moais" "m" ON (("mm"."moai_id" = "m"."id")))
  WHERE (("mm"."profile_id" = "auth"."uid"()) AND ("m"."coach_id" = "coach_workout_audio"."coach_id")))));



CREATE POLICY "Members can view their moai check-ins" ON "public"."member_check_ins" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "member_check_ins"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Moai admins can manage members" ON "public"."moai_members" TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "public"."is_user_moai_admin"("moai_id", "auth"."uid"()))) WITH CHECK ((("profile_id" = "auth"."uid"()) OR "public"."is_user_moai_admin"("moai_id", "auth"."uid"())));



CREATE POLICY "Moai members can create invitations" ON "public"."moai_invitations" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "moai_invitations"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))) AND ("invited_by" = "auth"."uid"())));



CREATE POLICY "Moai members can insert photo tags" ON "public"."moai_photo_tags" FOR INSERT WITH CHECK ((("auth"."uid"() = "tagged_by") AND (EXISTS ( SELECT 1
   FROM ("public"."moai_album_photos"
     JOIN "public"."moai_members" ON (("moai_album_photos"."moai_id" = "moai_members"."moai_id")))
  WHERE (("moai_album_photos"."id" = "moai_photo_tags"."photo_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Moai members can insert photos" ON "public"."moai_album_photos" FOR INSERT WITH CHECK ((("auth"."uid"() = "uploaded_by") AND (EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "moai_album_photos"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Moai members can view bulletins" ON "public"."coach_bulletins" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "coach_bulletins"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Moai members can view each other's activity logs" ON "public"."activity_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."moai_members" "mm1"
     JOIN "public"."moai_members" "mm2" ON (("mm1"."moai_id" = "mm2"."moai_id")))
  WHERE (("mm1"."profile_id" = "auth"."uid"()) AND ("mm2"."profile_id" = "activity_logs"."profile_id") AND ("mm1"."is_active" = true) AND ("mm2"."is_active" = true)))));



CREATE POLICY "Moai members can view each other's commitments" ON "public"."user_commitments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."moai_members" "mm1"
     JOIN "public"."moai_members" "mm2" ON (("mm1"."moai_id" = "mm2"."moai_id")))
  WHERE (("mm1"."profile_id" = "auth"."uid"()) AND ("mm2"."profile_id" = "user_commitments"."profile_id") AND ("mm1"."is_active" = true) AND ("mm2"."is_active" = true)))));



CREATE POLICY "Moai members can view elite week progress" ON "public"."elite_week_tracker" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "elite_week_tracker"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Moai members can view group coaching chats" ON "public"."moai_coaching_chats" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "moai_coaching_chats"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Moai members can view group statuses" ON "public"."group_statuses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "group_statuses"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Moai members can view group stones" ON "public"."group_stones" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "group_stones"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Moai members can view photo tags" ON "public"."moai_photo_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."moai_album_photos"
     JOIN "public"."moai_members" ON (("moai_album_photos"."moai_id" = "moai_members"."moai_id")))
  WHERE (("moai_album_photos"."id" = "moai_photo_tags"."photo_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Moai members can view photos" ON "public"."moai_album_photos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "moai_album_photos"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Moai moderators can manage the blocklist" ON "public"."moai_blocklist" TO "authenticated" USING ("public"."check_permission"("auth"."uid"(), 'moai.manage_blocklist'::"text", "moai_id")) WITH CHECK (("public"."check_permission"("auth"."uid"(), 'moai.manage_blocklist'::"text", "moai_id") AND ("blocked_by" = "auth"."uid"())));



CREATE POLICY "Moai moderators can view the blocklist" ON "public"."moai_blocklist" FOR SELECT TO "authenticated" USING ("public"."check_permission"("auth"."uid"(), 'moai.manage_blocklist'::"text", "moai_id"));



CREATE POLICY "Moai program history manageable by admins and coaches" ON "public"."moai_program_history" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."moais"
  WHERE (("moais"."id" = "moai_program_history"."moai_id") AND ("moais"."coach_id" = "auth"."uid"()))))));



CREATE POLICY "Moai program history viewable by members" ON "public"."moai_program_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "moai_program_history"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Only admins can delete hobbies" ON "public"."hobbies" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can insert hobbies" ON "public"."hobbies" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can modify hobbies" ON "public"."hobbies" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'admin@example.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'admin@example.com'::"text"))));



CREATE POLICY "Only admins can update hobbies" ON "public"."hobbies" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Participants can update their own status" ON "public"."collaborative_workout_participants" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Plan workouts are viewable by everyone" ON "public"."plan_workouts" FOR SELECT USING (true);



CREATE POLICY "Plan workouts can be created by authenticated users" ON "public"."plan_workouts" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Platform Admins can manage all user roles" ON "public"."user_roles" TO "authenticated" USING ("public"."user_has_global_role"("auth"."uid"(), 'PlatformAdmin'::"text")) WITH CHECK ("public"."user_has_global_role"("auth"."uid"(), 'PlatformAdmin'::"text"));



CREATE POLICY "Platform admins can create profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ("public"."user_has_global_role"("auth"."uid"(), 'PlatformAdmin'::"text"));



CREATE POLICY "Platform admins can manage all coach relationships" ON "public"."coach_relationships" USING ("public"."user_has_global_role"("auth"."uid"(), 'PlatformAdmin'::"text")) WITH CHECK ("public"."user_has_global_role"("auth"."uid"(), 'PlatformAdmin'::"text"));



CREATE POLICY "Platform admins can manage all coaches" ON "public"."coaches" USING ("public"."user_has_global_role"("auth"."uid"(), 'PlatformAdmin'::"text")) WITH CHECK ("public"."user_has_global_role"("auth"."uid"(), 'PlatformAdmin'::"text"));



CREATE POLICY "Platform admins can view all moai members" ON "public"."moai_members" FOR SELECT USING ("public"."user_has_global_role"("auth"."uid"(), 'PlatformAdmin'::"text"));



CREATE POLICY "Program creators can manage program weeks" ON "public"."program_weeks" USING ((EXISTS ( SELECT 1
   FROM "public"."workout_programs"
  WHERE (("workout_programs"."id" = "program_weeks"."program_id") AND ("workout_programs"."created_by" = "auth"."uid"())))));



CREATE POLICY "Program weeks are viewable by everyone" ON "public"."program_weeks" FOR SELECT USING (true);



CREATE POLICY "Public can validate invitations by code" ON "public"."moai_invitations" FOR SELECT USING ((("invite_code" IS NOT NULL) AND ("is_active" = true)));



CREATE POLICY "Public can view moai details via valid invite" ON "public"."moais" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_invitations" "mi"
  WHERE (("mi"."moai_id" = "moais"."id") AND ("mi"."is_active" = true) AND (("mi"."expires_at" IS NULL) OR ("mi"."expires_at" > "now"())) AND (("mi"."max_uses" IS NULL) OR ("mi"."current_uses" < "mi"."max_uses"))))));



CREATE POLICY "Public can view profile info for invite validation" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_invitations" "mi"
  WHERE (("mi"."invited_by" = "profiles"."id") AND ("mi"."is_active" = true)))));



CREATE POLICY "Session creators can update their sessions" ON "public"."collaborative_workout_sessions" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Session participants can send messages" ON "public"."coach_messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."coach_sessions" "cs"
  WHERE (("cs"."id" = "coach_messages"."session_id") AND (("cs"."client_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "c"."profile_id"
           FROM "public"."coaches" "c"
          WHERE ("c"."id" = "cs"."coach_id")))))))));



CREATE POLICY "Session participants can view messages" ON "public"."coach_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."coach_sessions" "cs"
  WHERE (("cs"."id" = "coach_messages"."session_id") AND (("cs"."client_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "c"."profile_id"
           FROM "public"."coaches" "c"
          WHERE ("c"."id" = "cs"."coach_id"))))))));



CREATE POLICY "System can insert/update insights" ON "public"."coach_member_insights" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage buddy chat channels" ON "public"."buddy_chat_channels" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage coaching chats" ON "public"."coach_private_chats" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage credit history" ON "public"."credit_history" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage elite week tracking" ON "public"."elite_week_tracker" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage group coaching chats" ON "public"."moai_coaching_chats" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage group statuses" ON "public"."group_statuses" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage group stones" ON "public"."group_stones" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage performance trends" ON "public"."performance_trends" USING (true) WITH CHECK (true);



CREATE POLICY "Tagged users can update their tags" ON "public"."activity_tags" FOR UPDATE USING (("auth"."uid"() = "tagged_user_id"));



CREATE POLICY "Users can add exercises" ON "public"."collaborative_workout_exercises" FOR INSERT WITH CHECK (("auth"."uid"() = "added_by"));



CREATE POLICY "Users can add members if they have permission" ON "public"."moai_members" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_permission"("auth"."uid"(), 'moai.manage_members.assigned_admin'::"text", "moai_id") OR "public"."check_permission"("auth"."uid"(), 'moai.manage_members.assigned_coach'::"text", "moai_id") OR "public"."check_permission"("auth"."uid"(), 'moai.manage_members.own_created'::"text", "moai_id") OR "public"."check_permission"("auth"."uid"(), 'platform.manage_all_moais'::"text") OR "public"."check_permission"("auth"."uid"(), 'moai.invite'::"text", "moai_id")));



CREATE POLICY "Users can add reactions in their moais" ON "public"."message_reactions" FOR INSERT WITH CHECK ((("profile_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."moai_members" "mm" ON (("m"."moai_id" = "mm"."moai_id")))
  WHERE (("m"."id" = "message_reactions"."message_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true))))));



CREATE POLICY "Users can be added to sessions" ON "public"."collaborative_workout_participants" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can cancel invitations they sent" ON "public"."moai_user_invitations" FOR UPDATE USING (("invited_by_user_id" = "auth"."uid"()));



CREATE POLICY "Users can comment on posts they can view" ON "public"."comments" FOR INSERT WITH CHECK ((("auth"."uid"() = "profile_id") AND (EXISTS ( SELECT 1
   FROM ("public"."posts"
     JOIN "public"."moai_members" ON (("posts"."moai_id" = "moai_members"."moai_id")))
  WHERE (("posts"."id" = "comments"."post_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create activity logs" ON "public"."activity_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can create events in their moais" ON "public"."events" FOR INSERT WITH CHECK ((("auth"."uid"() = "creator_id") AND (EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "events"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create invitations" ON "public"."moai_user_invitations" FOR INSERT WITH CHECK (("invited_by_user_id" = "auth"."uid"()));



CREATE POLICY "Users can create own moai" ON "public"."moais" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can create posts in their moais" ON "public"."posts" FOR INSERT WITH CHECK ((("auth"."uid"() = "profile_id") AND (EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "posts"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create reactions on activities they can see" ON "public"."activity_reactions" FOR INSERT WITH CHECK ((("profile_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."activity_logs" "al"
     JOIN "public"."moai_members" "mm" ON (("mm"."profile_id" = "auth"."uid"())))
  WHERE (("al"."id" = "activity_reactions"."activity_log_id") AND ("mm"."is_active" = true))))));



CREATE POLICY "Users can create replies in their moais" ON "public"."message_replies" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."moai_members" "mm" ON (("m"."moai_id" = "mm"."moai_id")))
  WHERE (("m"."id" = "message_replies"."parent_message_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Users can create sessions" ON "public"."coach_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "client_id"));



CREATE POLICY "Users can create sessions" ON "public"."collaborative_workout_sessions" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create tags" ON "public"."activity_tags" FOR INSERT WITH CHECK (("auth"."uid"() = "tagged_by_user_id"));



CREATE POLICY "Users can create tags for others" ON "public"."activity_tags" FOR INSERT WITH CHECK (("tagged_by_user_id" = "auth"."uid"()));



CREATE POLICY "Users can create their own check-ins" ON "public"."commitment_check_ins" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_commitments" "uc"
  WHERE (("uc"."id" = "commitment_check_ins"."user_commitment_id") AND ("uc"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can create their own commitments" ON "public"."user_commitments" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can create their own commitments" ON "public"."weekly_member_commitments" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can create their own community posts" ON "public"."community_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can create their own exercise logs" ON "public"."exercise_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own questionnaires" ON "public"."coaching_questionnaires" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own read receipts" ON "public"."message_read_receipts" FOR INSERT WITH CHECK ((("profile_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."moai_members" "mm" ON (("m"."moai_id" = "mm"."moai_id")))
  WHERE (("m"."id" = "message_read_receipts"."message_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."joined_at" IS NOT NULL))))));



CREATE POLICY "Users can create their own sessions" ON "public"."collaborative_workout_sessions" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create their own subscriptions" ON "public"."coach_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own workout completions" ON "public"."workout_completions" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can create workout programs" ON "public"."workout_programs" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create workouts" ON "public"."workouts" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete events they created" ON "public"."events" FOR DELETE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can delete tags they created" ON "public"."moai_photo_tags" FOR DELETE USING (("auth"."uid"() = "tagged_by"));



CREATE POLICY "Users can delete their own RSVPs" ON "public"."event_rsvps" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own activity logs" ON "public"."activity_logs" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own community posts" ON "public"."community_posts" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own events" ON "public"."events" FOR DELETE TO "authenticated" USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own exercise logs" ON "public"."exercise_logs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own photos" ON "public"."moai_album_photos" FOR DELETE USING (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can delete their own posts" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own reactions" ON "public"."activity_reactions" FOR DELETE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own workout completions" ON "public"."workout_completions" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own workout programs" ON "public"."workout_programs" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own workouts" ON "public"."workouts" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can insert their own RSVPs" ON "public"."event_rsvps" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own credit history" ON "public"."credit_history" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own status" ON "public"."user_status" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own story views" ON "public"."story_views" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own subscriptions" ON "public"."user_subscriptions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert themselves as members" ON "public"."moai_members" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can like posts they can view" ON "public"."likes" FOR INSERT WITH CHECK ((("auth"."uid"() = "profile_id") AND (EXISTS ( SELECT 1
   FROM ("public"."posts"
     JOIN "public"."moai_members" ON (("posts"."moai_id" = "moai_members"."moai_id")))
  WHERE (("posts"."id" = "likes"."post_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users can manage their own coach profile" ON "public"."coaches" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can manage their own progress" ON "public"."collaborative_workout_progress" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can mark their notifications as read" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can remove their own reactions" ON "public"."message_reactions" FOR DELETE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can send messages in their moais" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "profile_id") AND (EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "messages"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users can send messages to buddy chats they are part of" ON "public"."messages" FOR INSERT WITH CHECK ((("is_buddy_chat" = true) AND ("profile_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."buddy_chat_channels" "bcc"
  WHERE (("bcc"."moai_id" = "messages"."moai_id") AND ("bcc"."week_start_date" = "messages"."buddy_chat_week_start") AND ("bcc"."is_active" = true) AND (EXISTS ( SELECT 1
           FROM "jsonb_array_elements_text"("bcc"."buddy_group") "member_id"("value")
          WHERE (("member_id"."value")::"uuid" = "auth"."uid"()))))))));



CREATE POLICY "Users can send nudges" ON "public"."buddy_nudges" FOR INSERT WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can track their own progress" ON "public"."collaborative_workout_progress" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can unlike posts (delete likes)" ON "public"."likes" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update events they created" ON "public"."events" FOR UPDATE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can update moai memberships" ON "public"."moai_members" FOR UPDATE USING ((("profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."moais" "m"
  WHERE (("m"."id" = "moai_members"."moai_id") AND ("m"."creator_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."moai_members" "admin_mm"
  WHERE (("admin_mm"."moai_id" = "moai_members"."moai_id") AND ("admin_mm"."profile_id" = "auth"."uid"()) AND ("admin_mm"."role_in_moai" = 'admin'::"text") AND ("admin_mm"."is_active" = true)))))) WITH CHECK ((("profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."moais" "m"
  WHERE (("m"."id" = "moai_members"."moai_id") AND ("m"."creator_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."moai_members" "admin_mm"
  WHERE (("admin_mm"."moai_id" = "moai_members"."moai_id") AND ("admin_mm"."profile_id" = "auth"."uid"()) AND ("admin_mm"."role_in_moai" = 'admin'::"text") AND ("admin_mm"."is_active" = true))))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own RSVPs" ON "public"."event_rsvps" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own activity logs" ON "public"."activity_logs" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own commitments" ON "public"."user_commitments" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own commitments" ON "public"."weekly_member_commitments" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own community posts" ON "public"."community_posts" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own events" ON "public"."events" FOR UPDATE TO "authenticated" USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own exercise logs" ON "public"."exercise_logs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own invitations" ON "public"."moai_invitations" FOR UPDATE USING (("invited_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own membership" ON "public"."moai_members" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own participation status" ON "public"."collaborative_workout_participants" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own photos" ON "public"."moai_album_photos" FOR UPDATE USING (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can update their own posts" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own progress" ON "public"."collaborative_workout_progress" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own questionnaires" ON "public"."coaching_questionnaires" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own read receipts" ON "public"."message_read_receipts" FOR UPDATE USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own status" ON "public"."user_status" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own story views" ON "public"."story_views" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own subscriptions" ON "public"."coach_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own subscriptions" ON "public"."user_subscriptions" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own tag responses" ON "public"."activity_tags" FOR UPDATE USING (("tagged_user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own weekly summaries" ON "public"."weekly_activity_summary" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own workout completions" ON "public"."workout_completions" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own workout programs" ON "public"."workout_programs" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own workouts" ON "public"."workouts" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view accessible moais" ON "public"."moais" FOR SELECT TO "authenticated" USING ("public"."can_user_view_moai"("id", "auth"."uid"()));



CREATE POLICY "Users can view activity logs they are tagged in" ON "public"."activity_logs" FOR SELECT USING ("public"."user_is_tagged_in_activity_log"("id"));



CREATE POLICY "Users can view all event RSVPs" ON "public"."event_rsvps" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view all weekly activity summaries" ON "public"."weekly_activity_summary" FOR SELECT USING (true);



CREATE POLICY "Users can view basic profile info for search" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can view buddy chats they are part of" ON "public"."buddy_chat_channels" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"("buddy_chat_channels"."buddy_group") "member_id"("value")
  WHERE (("member_id"."value")::"uuid" = "auth"."uid"()))));



CREATE POLICY "Users can view buddy pairings for their moais" ON "public"."weekly_buddy_pairings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "weekly_buddy_pairings"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view comments on posts they can view" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."posts"
     JOIN "public"."moai_members" ON (("posts"."moai_id" = "moai_members"."moai_id")))
  WHERE (("posts"."id" = "comments"."post_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view cycles for their moais" ON "public"."buddy_cycles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "buddy_cycles"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Users can view events in their moais" ON "public"."events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "events"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view exercises" ON "public"."collaborative_workout_exercises" FOR SELECT USING (true);



CREATE POLICY "Users can view exercises in sessions they participate in" ON "public"."collaborative_workout_exercises" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."collaborative_workout_sessions"
  WHERE (("collaborative_workout_sessions"."id" = "collaborative_workout_exercises"."session_id") AND ("collaborative_workout_sessions"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."collaborative_workout_participants"
  WHERE (("collaborative_workout_participants"."session_id" = "collaborative_workout_exercises"."session_id") AND ("collaborative_workout_participants"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view invitations for their moais" ON "public"."moai_invitations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "moai_invitations"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Users can view likes on posts they can view" ON "public"."likes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."posts"
     JOIN "public"."moai_members" ON (("posts"."moai_id" = "moai_members"."moai_id")))
  WHERE (("posts"."id" = "likes"."post_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view messages in buddy chats they are part of" ON "public"."messages" FOR SELECT USING ((("is_buddy_chat" = true) AND (EXISTS ( SELECT 1
   FROM "public"."buddy_chat_channels" "bcc"
  WHERE (("bcc"."moai_id" = "messages"."moai_id") AND ("bcc"."week_start_date" = "messages"."buddy_chat_week_start") AND ("bcc"."is_active" = true) AND (EXISTS ( SELECT 1
           FROM "jsonb_array_elements_text"("bcc"."buddy_group") "member_id"("value")
          WHERE (("member_id"."value")::"uuid" = "auth"."uid"()))))))));



CREATE POLICY "Users can view messages in their moais" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "messages"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view moai details based on type and invitation" ON "public"."moais" FOR SELECT TO "authenticated" USING (("public"."check_permission"("auth"."uid"(), 'platform.manage_all_moais'::"text") OR ("moai_type" = 'public'::"public"."moai_type") OR (("moai_type" = 'private'::"public"."moai_type") AND ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "moais"."id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))) OR (EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "moais"."id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = false) AND ("mm"."invite_token" IS NOT NULL) AND ("mm"."invite_expires_at" > "now"()))))))));



CREATE POLICY "Users can view moai member lists based on moai type and status" ON "public"."moai_members" FOR SELECT TO "authenticated" USING (("public"."check_permission"("auth"."uid"(), 'platform.manage_all_moais'::"text") OR "public"."check_permission"("auth"."uid"(), 'moai.view_any'::"text", "moai_id") OR (("public"."get_moai_type"("moai_id") = 'public'::"public"."moai_type") AND ("is_active" = true)) OR (("public"."get_moai_type"("moai_id") = 'private'::"public"."moai_type") AND ("is_active" = true) AND "public"."is_user_active_member_or_invitee"("moai_id", "auth"."uid"())) OR ("profile_id" = "auth"."uid"())));



CREATE POLICY "Users can view others' badges" ON "public"."user_badges" FOR SELECT USING (true);



CREATE POLICY "Users can view pairings they are part of" ON "public"."buddy_cycle_pairings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"("buddy_cycle_pairings"."buddy_group") "member_id"("value")
  WHERE (("member_id"."value")::"uuid" = "auth"."uid"()))));



CREATE POLICY "Users can view participants in sessions they're part of" ON "public"."collaborative_workout_participants" FOR SELECT USING ((("profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."collaborative_workout_sessions"
  WHERE (("collaborative_workout_sessions"."id" = "collaborative_workout_participants"."session_id") AND ("collaborative_workout_sessions"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."collaborative_workout_participants" "p2"
  WHERE (("p2"."session_id" = "collaborative_workout_participants"."session_id") AND ("p2"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view posts in their moais" ON "public"."posts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "posts"."moai_id") AND ("moai_members"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view progress" ON "public"."collaborative_workout_progress" FOR SELECT USING (true);



CREATE POLICY "Users can view progress in sessions they participate in" ON "public"."collaborative_workout_progress" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."collaborative_workout_sessions"
  WHERE (("collaborative_workout_sessions"."id" = "collaborative_workout_progress"."session_id") AND ("collaborative_workout_sessions"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."collaborative_workout_participants"
  WHERE (("collaborative_workout_participants"."session_id" = "collaborative_workout_progress"."session_id") AND ("collaborative_workout_participants"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view reactions in their moais" ON "public"."message_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."moai_members" "mm" ON (("m"."moai_id" = "mm"."moai_id")))
  WHERE (("m"."id" = "message_reactions"."message_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Users can view reactions on activities they can see" ON "public"."activity_reactions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."activity_logs" "al"
  WHERE (("al"."id" = "activity_reactions"."activity_log_id") AND ("al"."profile_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."activity_logs" "al"
     JOIN "public"."moai_members" "mm" ON (("mm"."profile_id" = "auth"."uid"())))
  WHERE (("al"."id" = "activity_reactions"."activity_log_id") AND ("mm"."is_active" = true))))));



CREATE POLICY "Users can view read receipts in their MOAIs" ON "public"."message_read_receipts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."moai_members" "mm" ON (("m"."moai_id" = "mm"."moai_id")))
  WHERE (("m"."id" = "message_read_receipts"."message_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."joined_at" IS NOT NULL)))));



CREATE POLICY "Users can view replies in their moais" ON "public"."message_replies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."moai_members" "mm" ON (("m"."moai_id" = "mm"."moai_id")))
  WHERE (("m"."id" = "message_replies"."parent_message_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Users can view sessions they created" ON "public"."collaborative_workout_sessions" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view snapshots for their moais" ON "public"."moai_weekly_snapshots" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "moai_weekly_snapshots"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true)))));



CREATE POLICY "Users can view tags related to them" ON "public"."activity_tags" FOR SELECT USING ((("auth"."uid"() = "tagged_user_id") OR ("auth"."uid"() = "tagged_by_user_id") OR ("auth"."uid"() IN ( SELECT "activity_logs"."profile_id"
   FROM "public"."activity_logs"
  WHERE ("activity_logs"."id" = "activity_tags"."activity_log_id")))));



CREATE POLICY "Users can view their moais or moais they belong to" ON "public"."moais" FOR SELECT TO "authenticated" USING ((("creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."moai_members"
  WHERE (("moai_members"."moai_id" = "moais"."id") AND ("moai_members"."profile_id" = "auth"."uid"()) AND ("moai_members"."is_active" = true)))) OR ("moai_type" = 'public'::"public"."moai_type")));



CREATE POLICY "Users can view their own activity logs" ON "public"."activity_logs" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own assigned roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own badges" ON "public"."user_badges" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own check-ins" ON "public"."commitment_check_ins" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_commitments" "uc"
  WHERE (("uc"."id" = "commitment_check_ins"."user_commitment_id") AND ("uc"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own coaching chats" ON "public"."coach_private_chats" FOR SELECT USING (("auth"."uid"() = "client_id"));



CREATE POLICY "Users can view their own coaching relationships" ON "public"."coach_relationships" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "coach_relationships"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true))))));



CREATE POLICY "Users can view their own commitments" ON "public"."user_commitments" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own commitments" ON "public"."weekly_member_commitments" FOR SELECT USING ((("profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."moai_members" "mm"
  WHERE (("mm"."moai_id" = "weekly_member_commitments"."moai_id") AND ("mm"."profile_id" = "auth"."uid"()) AND ("mm"."is_active" = true))))));



CREATE POLICY "Users can view their own credit history" ON "public"."credit_history" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own exercise logs" ON "public"."exercise_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own invitations" ON "public"."moai_user_invitations" FOR SELECT USING ((("invited_user_id" = "auth"."uid"()) OR ("invited_by_user_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own membership" ON "public"."moai_members" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own nudges" ON "public"."buddy_nudges" FOR SELECT USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own participation" ON "public"."collaborative_workout_participants" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own program assignments" ON "public"."user_program_assignments" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own questionnaires" ON "public"."coaching_questionnaires" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own recommendations" ON "public"."moai_recommendations" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own sessions" ON "public"."coach_sessions" FOR SELECT USING ((("auth"."uid"() = "client_id") OR ("auth"."uid"() IN ( SELECT "c"."profile_id"
   FROM "public"."coaches" "c"
  WHERE ("c"."id" = "coach_sessions"."coach_id")))));



CREATE POLICY "Users can view their own story views" ON "public"."story_views" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own subscriptions" ON "public"."coach_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."user_subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own tags" ON "public"."activity_tags" FOR SELECT USING ((("tagged_user_id" = "auth"."uid"()) OR ("tagged_by_user_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own trends" ON "public"."performance_trends" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own workout completions" ON "public"."workout_completions" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Workout creators can manage exercise details" ON "public"."exercise_details" USING ((EXISTS ( SELECT 1
   FROM ("public"."workout_exercises" "we"
     JOIN "public"."workouts" "w" ON (("w"."id" = "we"."workout_id")))
  WHERE (("we"."id" = "exercise_details"."workout_exercise_id") AND ("w"."created_by" = "auth"."uid"())))));



CREATE POLICY "Workout creators can manage workout exercises" ON "public"."workout_exercises" USING ((EXISTS ( SELECT 1
   FROM "public"."workouts"
  WHERE (("workouts"."id" = "workout_exercises"."workout_id") AND ("workouts"."created_by" = "auth"."uid"())))));



CREATE POLICY "Workout exercises are viewable by everyone" ON "public"."workout_exercises" FOR SELECT USING (true);



CREATE POLICY "Workout programs are viewable by everyone" ON "public"."workout_programs" FOR SELECT USING (true);



CREATE POLICY "Workouts are viewable by everyone" ON "public"."workouts" FOR SELECT USING (true);



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buddy_chat_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buddy_cycle_pairings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buddy_cycles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buddy_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buddy_nudges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buddy_prompt_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_bulletins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_member_checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_member_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_member_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_member_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_private_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_private_chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_program_audio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_workout_audio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coaches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coaching_questionnaires" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collaborative_workout_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collaborative_workout_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collaborative_workout_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commitment_check_ins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_checkin_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."elite_week_tracker" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_library_extended" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_stones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_check_ins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_milestones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_read_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_replies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_album_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_blocklist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_coaching_chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_photo_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_program_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_user_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moai_weekly_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nudge_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_trends" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_workouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."program_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."program_weeks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_commitments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_program_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_activity_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_buddy_pairings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_commitments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_member_commitments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workouts" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."archive_previous_buddy_chats"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_previous_buddy_chats"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_previous_buddy_chats"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_program_from_template"("p_template_id" "uuid", "p_moai_id" "uuid", "p_assigned_by" "uuid", "p_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_program_from_template"("p_template_id" "uuid", "p_moai_id" "uuid", "p_assigned_by" "uuid", "p_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_program_from_template"("p_template_id" "uuid", "p_moai_id" "uuid", "p_assigned_by" "uuid", "p_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_program_to_moai_members"("p_moai_id" "uuid", "p_program_id" "uuid", "p_assigned_by" "uuid", "p_week_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_program_to_moai_members"("p_moai_id" "uuid", "p_program_id" "uuid", "p_assigned_by" "uuid", "p_week_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_program_to_moai_members"("p_moai_id" "uuid", "p_program_id" "uuid", "p_assigned_by" "uuid", "p_week_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_to_existing_buddy_group"("p_moai_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_to_existing_buddy_group"("p_moai_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_to_existing_buddy_group"("p_moai_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_moai_program_to_new_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_moai_program_to_new_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_moai_program_to_new_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."block_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid", "p_blocked_by" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."block_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid", "p_blocked_by" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid", "p_blocked_by" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_credit_tier"("coached_members_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_credit_tier"("coached_members_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_credit_tier"("coached_members_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_group_success_percentage"("p_moai_id" "uuid", "p_week_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_group_success_percentage"("p_moai_id" "uuid", "p_week_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_group_success_percentage"("p_moai_id" "uuid", "p_week_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_member_risk_score"("p_member_id" "uuid", "p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_member_risk_score"("p_member_id" "uuid", "p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_member_risk_score"("p_member_id" "uuid", "p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_moai_coach_match_percentage"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_moai_coach_match_percentage"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_moai_coach_match_percentage"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_moai_urgency_status"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_moai_urgency_status"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_moai_urgency_status"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_monthly_credit"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_monthly_credit"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_monthly_credit"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_movement_days"("p_profile_id" "uuid", "p_week_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_movement_days"("p_profile_id" "uuid", "p_week_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_movement_days"("p_profile_id" "uuid", "p_week_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_movement_days_tz"("p_profile_id" "uuid", "p_week_start_date" "date", "p_timezone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_movement_days_tz"("p_profile_id" "uuid", "p_week_start_date" "date", "p_timezone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_movement_days_tz"("p_profile_id" "uuid", "p_week_start_date" "date", "p_timezone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_weekly_member_insights"("p_moai_id" "uuid", "p_week_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_weekly_member_insights"("p_moai_id" "uuid", "p_week_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_weekly_member_insights"("p_moai_id" "uuid", "p_week_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_create_new_moai"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_create_new_moai"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_create_new_moai"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_user_view_moai"("p_moai_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_user_view_moai"("p_moai_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_user_view_moai"("p_moai_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."capture_weekly_snapshots"() TO "anon";
GRANT ALL ON FUNCTION "public"."capture_weekly_snapshots"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."capture_weekly_snapshots"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_award_elite_week"("p_moai_id" "uuid", "p_week_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_award_elite_week"("p_moai_id" "uuid", "p_week_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_elite_week"("p_moai_id" "uuid", "p_week_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_award_milestone_badges"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_award_milestone_badges"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_milestone_badges"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_award_moai_mover_badge"("p_profile_id" "uuid", "p_week_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_award_moai_mover_badge"("p_profile_id" "uuid", "p_week_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_moai_mover_badge"("p_profile_id" "uuid", "p_week_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_create_group_coaching_chat"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_create_group_coaching_chat"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_create_group_coaching_chat"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_unlock_group_progression"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_unlock_group_progression"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_unlock_group_progression"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_is_any_moai_member_for_rls"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_is_any_moai_member_for_rls"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_is_any_moai_member_for_rls"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_permission"("p_user_id" "uuid", "p_permission_key" "text", "p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_permission"("p_user_id" "uuid", "p_permission_key" "text", "p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_permission"("p_user_id" "uuid", "p_permission_key" "text", "p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."coach_can_access_moai"("p_coach_profile_id" "uuid", "p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."coach_can_access_moai"("p_coach_profile_id" "uuid", "p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."coach_can_access_moai"("p_coach_profile_id" "uuid", "p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."coach_can_access_user"("p_coach_profile_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."coach_can_access_user"("p_coach_profile_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."coach_can_access_user"("p_coach_profile_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_activity_tag"("tag_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_activity_tag"("tag_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_activity_tag"("tag_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_user_active_moais"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."count_user_active_moais"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_user_active_moais"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_buddy_chat_channel"("p_moai_id" "uuid", "p_week_start_date" "date", "p_buddy_group" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_buddy_chat_channel"("p_moai_id" "uuid", "p_week_start_date" "date", "p_buddy_group" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_buddy_chat_channel"("p_moai_id" "uuid", "p_week_start_date" "date", "p_buddy_group" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_moai_invitation"("p_moai_id" "uuid", "p_max_uses" integer, "p_expires_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_moai_invitation"("p_moai_id" "uuid", "p_max_uses" integer, "p_expires_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_moai_invitation"("p_moai_id" "uuid", "p_max_uses" integer, "p_expires_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_weekly_buddy_pairings"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_weekly_buddy_pairings"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_weekly_buddy_pairings"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_weekly_buddy_pairings_enhanced"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_weekly_buddy_pairings_enhanced"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_weekly_buddy_pairings_enhanced"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decline_activity_tag"("tag_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decline_activity_tag"("tag_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decline_activity_tag"("tag_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."evaluate_weekly_group_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."evaluate_weekly_group_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."evaluate_weekly_group_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."evaluate_weekly_moai_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."evaluate_weekly_moai_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."evaluate_weekly_moai_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_coach_alerts"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_coach_alerts"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_coach_alerts"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_coaching_suggestions"("p_member_id" "uuid", "p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_coaching_suggestions"("p_member_id" "uuid", "p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_coaching_suggestions"("p_member_id" "uuid", "p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_weekly_snapshots"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_weekly_snapshots"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_weekly_snapshots"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_moais_with_capacity"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_moais_with_capacity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_moais_with_capacity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_coach_program_audios"("p_coach_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_coach_program_audios"("p_coach_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_coach_program_audios"("p_coach_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_coached_members_count"("p_user_id" "uuid", "p_coach_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_coached_members_count"("p_user_id" "uuid", "p_coach_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_coached_members_count"("p_user_id" "uuid", "p_coach_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_buddy_cycle"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_buddy_cycle"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_buddy_cycle"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_week_start"("p_timezone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_week_start"("p_timezone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_week_start"("p_timezone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_enhanced_member_insights"("p_coach_id" "uuid", "p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_enhanced_member_insights"("p_coach_id" "uuid", "p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_enhanced_member_insights"("p_coach_id" "uuid", "p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_group_progression_summary"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_progression_summary"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_progression_summary"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_member_leaderboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_member_leaderboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_member_leaderboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_moai_leaderboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_moai_leaderboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_moai_leaderboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_moai_type"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_moai_type"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_moai_type"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_personal_best"("p_user_id" "uuid", "p_exercise_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_personal_best"("p_user_id" "uuid", "p_exercise_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_personal_best"("p_user_id" "uuid", "p_exercise_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_personal_records"("p_user_id" "uuid", "p_exercise_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_personal_records"("p_user_id" "uuid", "p_exercise_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_personal_records"("p_user_id" "uuid", "p_exercise_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tier_info"("p_tier" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_tier_info"("p_tier" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tier_info"("p_tier" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text", "_granted_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text", "_granted_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text", "_granted_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_rest_day_replacement"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_rest_day_replacement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_rest_day_replacement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("_user_id" "uuid", "_permission_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("_user_id" "uuid", "_permission_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("_user_id" "uuid", "_permission_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_workout_photo"("workout_log_id" "uuid", "photo_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_workout_photo"("workout_log_id" "uuid", "photo_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_workout_photo"("workout_log_id" "uuid", "photo_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_authenticated_user"("_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_authenticated_user"("_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_authenticated_user"("_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_coach_of"("_moai_id" "uuid", "_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_coach_of"("_moai_id" "uuid", "_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_coach_of"("_moai_id" "uuid", "_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_commitment_window_open"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_commitment_window_open"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_commitment_window_open"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_commitment_window_open"("p_timezone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_commitment_window_open"("p_timezone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_commitment_window_open"("p_timezone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_moai_admin"("_moai_id" "uuid", "_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_moai_admin"("_moai_id" "uuid", "_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_moai_admin"("_moai_id" "uuid", "_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_moai_full"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_moai_full"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_moai_full"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_moai_member"("_moai_id" "uuid", "_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_moai_member"("_moai_id" "uuid", "_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_moai_member"("_moai_id" "uuid", "_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_active_member_of_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_active_member_of_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_active_member_of_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_active_member_or_invitee"("p_moai_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_active_member_or_invitee"("p_moai_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_active_member_or_invitee"("p_moai_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_blocked_from_moai"("user_id" "uuid", "moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_blocked_from_moai"("user_id" "uuid", "moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_blocked_from_moai"("user_id" "uuid", "moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_coached_by"("p_user_id" "uuid", "p_coach_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_coached_by"("p_user_id" "uuid", "p_coach_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_coached_by"("p_user_id" "uuid", "p_coach_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_invited_to_private_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_invited_to_private_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_invited_to_private_moai"("p_moai_id" "uuid", "p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_moai_admin"("p_moai_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_moai_admin"("p_moai_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_moai_admin"("p_moai_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_moai_member"("moai_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_moai_member"("moai_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_moai_member"("moai_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_valid_and_consumable_invite_token"("p_invite_token" "uuid", "p_moai_id" "uuid", "p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_and_consumable_invite_token"("p_invite_token" "uuid", "p_moai_id" "uuid", "p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_and_consumable_invite_token"("p_invite_token" "uuid", "p_moai_id" "uuid", "p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."join_moai_action"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."join_moai_action"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_moai_action"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_workout_photo"("p_workout_log_id" "uuid", "p_photo_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_workout_photo"("p_workout_log_id" "uuid", "p_photo_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_workout_photo"("p_workout_log_id" "uuid", "p_photo_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_moai_id" "uuid", "p_last_read_message_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_moai_id" "uuid", "p_last_read_message_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_moai_id" "uuid", "p_last_read_message_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_activity_reaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_activity_reaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_activity_reaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pin_post"("post_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."pin_post"("post_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pin_post"("post_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_moai_permission"("_moai_id" "uuid", "_profile_id" "uuid", "_permission_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_enabled"("table_name" "text", "message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rls_enabled"("table_name" "text", "message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_enabled"("table_name" "text", "message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid", "p_audio_url" "text", "p_duration_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."save_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid", "p_audio_url" "text", "p_duration_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_coach_program_audio"("p_program_id" "uuid", "p_coach_id" "uuid", "p_audio_url" "text", "p_duration_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."send_buddy_nudge"("p_receiver_id" "uuid", "p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_buddy_nudge"("p_receiver_id" "uuid", "p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_buddy_nudge"("p_receiver_id" "uuid", "p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."tag_workout_member"("p_workout_log_id" "uuid", "p_tagged_by_id" "uuid", "p_tagged_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."tag_workout_member"("p_workout_log_id" "uuid", "p_tagged_by_id" "uuid", "p_tagged_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."tag_workout_member"("p_workout_log_id" "uuid", "p_tagged_by_id" "uuid", "p_tagged_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."unblock_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unblock_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unblock_user_from_moai"("p_user_id" "uuid", "p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."unpin_moai_posts"("moai_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unpin_moai_posts"("moai_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unpin_moai_posts"("moai_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_activity_count_and_badges"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_activity_count_and_badges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_activity_count_and_badges"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_credit_history_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_credit_history_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_credit_history_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_moai_member_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_moai_member_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_moai_member_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_moai_tier_progression"("p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_moai_tier_progression"("p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_moai_tier_progression"("p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_weekly_activity_and_fire_badges"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_weekly_activity_and_fire_badges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_weekly_activity_and_fire_badges"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_weekly_commitment_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_weekly_commitment_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_weekly_commitment_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_active_subscription"("p_user_id" "uuid", "p_moai_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_active_subscription"("p_user_id" "uuid", "p_moai_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_active_subscription"("p_user_id" "uuid", "p_moai_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_global_role"("p_user_id" "uuid", "p_role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_global_role"("p_user_id" "uuid", "p_role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_global_role"("p_user_id" "uuid", "p_role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_tagged_in_activity_log"("activity_log_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_tagged_in_activity_log"("activity_log_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_tagged_in_activity_log"("activity_log_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."users_share_moai"("user1_id" "uuid", "user2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."users_share_moai"("user1_id" "uuid", "user2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."users_share_moai"("user1_id" "uuid", "user2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_and_consume_invite"("p_invite_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_and_consume_invite"("p_invite_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_and_consume_invite"("p_invite_code" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."activity_reactions" TO "anon";
GRANT ALL ON TABLE "public"."activity_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."activity_tags" TO "anon";
GRANT ALL ON TABLE "public"."activity_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_tags" TO "service_role";



GRANT ALL ON TABLE "public"."buddy_chat_channels" TO "anon";
GRANT ALL ON TABLE "public"."buddy_chat_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."buddy_chat_channels" TO "service_role";



GRANT ALL ON TABLE "public"."buddy_cycle_pairings" TO "anon";
GRANT ALL ON TABLE "public"."buddy_cycle_pairings" TO "authenticated";
GRANT ALL ON TABLE "public"."buddy_cycle_pairings" TO "service_role";



GRANT ALL ON TABLE "public"."buddy_cycles" TO "anon";
GRANT ALL ON TABLE "public"."buddy_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."buddy_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."buddy_interactions" TO "anon";
GRANT ALL ON TABLE "public"."buddy_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."buddy_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."buddy_nudges" TO "anon";
GRANT ALL ON TABLE "public"."buddy_nudges" TO "authenticated";
GRANT ALL ON TABLE "public"."buddy_nudges" TO "service_role";



GRANT ALL ON TABLE "public"."buddy_prompt_templates" TO "anon";
GRANT ALL ON TABLE "public"."buddy_prompt_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."buddy_prompt_templates" TO "service_role";



GRANT ALL ON TABLE "public"."coach_alerts" TO "anon";
GRANT ALL ON TABLE "public"."coach_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."coach_announcements" TO "anon";
GRANT ALL ON TABLE "public"."coach_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."coach_bulletins" TO "anon";
GRANT ALL ON TABLE "public"."coach_bulletins" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_bulletins" TO "service_role";



GRANT ALL ON TABLE "public"."coach_calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."coach_calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."coach_member_checkins" TO "anon";
GRANT ALL ON TABLE "public"."coach_member_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_member_checkins" TO "service_role";



GRANT ALL ON TABLE "public"."coach_member_insights" TO "anon";
GRANT ALL ON TABLE "public"."coach_member_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_member_insights" TO "service_role";



GRANT ALL ON TABLE "public"."coach_member_notes" TO "anon";
GRANT ALL ON TABLE "public"."coach_member_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_member_notes" TO "service_role";



GRANT ALL ON TABLE "public"."coach_member_tags" TO "anon";
GRANT ALL ON TABLE "public"."coach_member_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_member_tags" TO "service_role";



GRANT ALL ON TABLE "public"."coach_messages" TO "anon";
GRANT ALL ON TABLE "public"."coach_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_messages" TO "service_role";



GRANT ALL ON TABLE "public"."coach_notes" TO "anon";
GRANT ALL ON TABLE "public"."coach_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_notes" TO "service_role";



GRANT ALL ON TABLE "public"."coach_private_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."coach_private_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_private_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."coach_private_chats" TO "anon";
GRANT ALL ON TABLE "public"."coach_private_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_private_chats" TO "service_role";



GRANT ALL ON TABLE "public"."coach_program_audio" TO "anon";
GRANT ALL ON TABLE "public"."coach_program_audio" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_program_audio" TO "service_role";



GRANT ALL ON TABLE "public"."coach_relationships" TO "anon";
GRANT ALL ON TABLE "public"."coach_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."coach_resources" TO "anon";
GRANT ALL ON TABLE "public"."coach_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_resources" TO "service_role";



GRANT ALL ON TABLE "public"."coach_sessions" TO "anon";
GRANT ALL ON TABLE "public"."coach_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."coach_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."coach_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."coach_workout_audio" TO "anon";
GRANT ALL ON TABLE "public"."coach_workout_audio" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_workout_audio" TO "service_role";



GRANT ALL ON TABLE "public"."coaches" TO "anon";
GRANT ALL ON TABLE "public"."coaches" TO "authenticated";
GRANT ALL ON TABLE "public"."coaches" TO "service_role";



GRANT ALL ON TABLE "public"."coaching_questionnaires" TO "anon";
GRANT ALL ON TABLE "public"."coaching_questionnaires" TO "authenticated";
GRANT ALL ON TABLE "public"."coaching_questionnaires" TO "service_role";



GRANT ALL ON TABLE "public"."collaborative_workout_exercises" TO "anon";
GRANT ALL ON TABLE "public"."collaborative_workout_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborative_workout_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."collaborative_workout_participants" TO "anon";
GRANT ALL ON TABLE "public"."collaborative_workout_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborative_workout_participants" TO "service_role";



GRANT ALL ON TABLE "public"."collaborative_workout_progress" TO "anon";
GRANT ALL ON TABLE "public"."collaborative_workout_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborative_workout_progress" TO "service_role";



GRANT ALL ON TABLE "public"."collaborative_workout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."collaborative_workout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborative_workout_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."commitment_check_ins" TO "anon";
GRANT ALL ON TABLE "public"."commitment_check_ins" TO "authenticated";
GRANT ALL ON TABLE "public"."commitment_check_ins" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts" TO "anon";
GRANT ALL ON TABLE "public"."community_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts" TO "service_role";



GRANT ALL ON TABLE "public"."credit_history" TO "anon";
GRANT ALL ON TABLE "public"."credit_history" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_history" TO "service_role";



GRANT ALL ON TABLE "public"."daily_checkin_responses" TO "anon";
GRANT ALL ON TABLE "public"."daily_checkin_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_checkin_responses" TO "service_role";



GRANT ALL ON TABLE "public"."daily_checkins" TO "anon";
GRANT ALL ON TABLE "public"."daily_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_checkins" TO "service_role";



GRANT ALL ON TABLE "public"."elite_week_tracker" TO "anon";
GRANT ALL ON TABLE "public"."elite_week_tracker" TO "authenticated";
GRANT ALL ON TABLE "public"."elite_week_tracker" TO "service_role";



GRANT ALL ON TABLE "public"."event_approvals" TO "anon";
GRANT ALL ON TABLE "public"."event_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."event_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."event_rsvps" TO "anon";
GRANT ALL ON TABLE "public"."event_rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."event_rsvps" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_details" TO "anon";
GRANT ALL ON TABLE "public"."exercise_details" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_details" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_library_extended" TO "anon";
GRANT ALL ON TABLE "public"."exercise_library_extended" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_library_extended" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_logs" TO "anon";
GRANT ALL ON TABLE "public"."exercise_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_logs" TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON TABLE "public"."goal_types" TO "anon";
GRANT ALL ON TABLE "public"."goal_types" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_types" TO "service_role";



GRANT ALL ON TABLE "public"."group_statuses" TO "anon";
GRANT ALL ON TABLE "public"."group_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."group_statuses" TO "service_role";



GRANT ALL ON TABLE "public"."group_stones" TO "anon";
GRANT ALL ON TABLE "public"."group_stones" TO "authenticated";
GRANT ALL ON TABLE "public"."group_stones" TO "service_role";



GRANT ALL ON TABLE "public"."hobbies" TO "anon";
GRANT ALL ON TABLE "public"."hobbies" TO "authenticated";
GRANT ALL ON TABLE "public"."hobbies" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON TABLE "public"."member_check_ins" TO "anon";
GRANT ALL ON TABLE "public"."member_check_ins" TO "authenticated";
GRANT ALL ON TABLE "public"."member_check_ins" TO "service_role";



GRANT ALL ON TABLE "public"."member_milestones" TO "anon";
GRANT ALL ON TABLE "public"."member_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."member_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."message_read_receipts" TO "anon";
GRANT ALL ON TABLE "public"."message_read_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."message_read_receipts" TO "service_role";



GRANT ALL ON TABLE "public"."message_replies" TO "anon";
GRANT ALL ON TABLE "public"."message_replies" TO "authenticated";
GRANT ALL ON TABLE "public"."message_replies" TO "service_role";



GRANT ALL ON TABLE "public"."message_templates" TO "anon";
GRANT ALL ON TABLE "public"."message_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."message_templates" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."moai_album_photos" TO "anon";
GRANT ALL ON TABLE "public"."moai_album_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_album_photos" TO "service_role";



GRANT ALL ON TABLE "public"."moai_blocklist" TO "anon";
GRANT ALL ON TABLE "public"."moai_blocklist" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_blocklist" TO "service_role";



GRANT ALL ON TABLE "public"."moai_coaching_chats" TO "anon";
GRANT ALL ON TABLE "public"."moai_coaching_chats" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_coaching_chats" TO "service_role";



GRANT ALL ON TABLE "public"."moai_invitations" TO "anon";
GRANT ALL ON TABLE "public"."moai_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."moai_members" TO "anon";
GRANT ALL ON TABLE "public"."moai_members" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_members" TO "service_role";



GRANT ALL ON TABLE "public"."moai_permissions" TO "anon";
GRANT ALL ON TABLE "public"."moai_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."moai_photo_tags" TO "anon";
GRANT ALL ON TABLE "public"."moai_photo_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_photo_tags" TO "service_role";



GRANT ALL ON TABLE "public"."moai_program_history" TO "anon";
GRANT ALL ON TABLE "public"."moai_program_history" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_program_history" TO "service_role";



GRANT ALL ON TABLE "public"."moai_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."moai_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."moai_user_invitations" TO "anon";
GRANT ALL ON TABLE "public"."moai_user_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_user_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."moai_weekly_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."moai_weekly_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."moai_weekly_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."moais" TO "anon";
GRANT ALL ON TABLE "public"."moais" TO "authenticated";
GRANT ALL ON TABLE "public"."moais" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."nudge_templates" TO "anon";
GRANT ALL ON TABLE "public"."nudge_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."nudge_templates" TO "service_role";



GRANT ALL ON TABLE "public"."performance_trends" TO "anon";
GRANT ALL ON TABLE "public"."performance_trends" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_trends" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."plan_workouts" TO "anon";
GRANT ALL ON TABLE "public"."plan_workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_workouts" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."program_templates" TO "anon";
GRANT ALL ON TABLE "public"."program_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."program_templates" TO "service_role";



GRANT ALL ON TABLE "public"."program_weeks" TO "anon";
GRANT ALL ON TABLE "public"."program_weeks" TO "authenticated";
GRANT ALL ON TABLE "public"."program_weeks" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."story_views" TO "anon";
GRANT ALL ON TABLE "public"."story_views" TO "authenticated";
GRANT ALL ON TABLE "public"."story_views" TO "service_role";



GRANT ALL ON TABLE "public"."unread_message_counts" TO "anon";
GRANT ALL ON TABLE "public"."unread_message_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."unread_message_counts" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_commitments" TO "anon";
GRANT ALL ON TABLE "public"."user_commitments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_commitments" TO "service_role";



GRANT ALL ON TABLE "public"."user_program_assignments" TO "anon";
GRANT ALL ON TABLE "public"."user_program_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_program_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_status" TO "anon";
GRANT ALL ON TABLE "public"."user_status" TO "authenticated";
GRANT ALL ON TABLE "public"."user_status" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_submissions" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_activity_summary" TO "anon";
GRANT ALL ON TABLE "public"."weekly_activity_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_activity_summary" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_buddy_pairings" TO "anon";
GRANT ALL ON TABLE "public"."weekly_buddy_pairings" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_buddy_pairings" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_commitments" TO "anon";
GRANT ALL ON TABLE "public"."weekly_commitments" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_commitments" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_member_commitments" TO "anon";
GRANT ALL ON TABLE "public"."weekly_member_commitments" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_member_commitments" TO "service_role";



GRANT ALL ON TABLE "public"."workout_analytics" TO "anon";
GRANT ALL ON TABLE "public"."workout_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."workout_comments" TO "anon";
GRANT ALL ON TABLE "public"."workout_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_comments" TO "service_role";



GRANT ALL ON TABLE "public"."workout_completions" TO "anon";
GRANT ALL ON TABLE "public"."workout_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_completions" TO "service_role";



GRANT ALL ON TABLE "public"."workout_exercises" TO "anon";
GRANT ALL ON TABLE "public"."workout_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."workout_programs" TO "anon";
GRANT ALL ON TABLE "public"."workout_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_programs" TO "service_role";



GRANT ALL ON TABLE "public"."workouts" TO "anon";
GRANT ALL ON TABLE "public"."workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."workouts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
