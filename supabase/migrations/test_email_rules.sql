-- ==============================================================================
-- DEVSTUDIO — TEST SCRIPT FOR EMAIL DOMAIN RULES
-- Run this in the SQL Editor to verify the email rules.
-- ==============================================================================

DO $$
DECLARE
  v_test_cases text[] := ARRAY[
    'devilknight2534@gmail.com', -- 1. Admin
    'Devilknight2534@Gmail.com', -- 2. Admin (casing)
    '4mt24cs078@mite.ac.in', -- 3. Valid student
    'STUDENT@MITE.AC.IN', -- 4. Uppercase domain
    'x@mite.ac.in.evil.com', -- 5. Invalid suffix spoof
    'x@notmite.ac.in', -- 6. Invalid suffix spoof 2
    '@mite.ac.in', -- 7. No username before @
    'karthikprabhu2534@gmail.com', -- 8. Plain gmail
    null -- 9. Null
  ];
  v_expected boolean[] := ARRAY[
    true, true, true, true, false, false, false, false, false
  ];
  v_result boolean;
  v_email text;
  v_all_passed boolean := true;
BEGIN
  RAISE NOTICE '================ RUNNING SQL TESTS ================';
  
  FOR i IN 1..array_length(v_test_cases, 1) LOOP
    v_email := v_test_cases[i];
    v_result := public.is_email_allowed(v_email, true);
    
    IF v_result != v_expected[i] THEN
      RAISE EXCEPTION 'TEST FAILED: % (Expected %, got %)', v_email, v_expected[i], v_result;
      v_all_passed := false;
    ELSE
      RAISE NOTICE 'TEST PASSED: % -> %', COALESCE(v_email, 'NULL'), v_result;
    END IF;
  END LOOP;

  -- Test unverified email
  v_result := public.is_email_allowed('4mt24cs078@mite.ac.in', false);
  IF v_result != false THEN
    RAISE EXCEPTION 'TEST FAILED: Unverified email should be false';
  ELSE
    RAISE NOTICE 'TEST PASSED: Unverified email -> %', v_result;
  END IF;

  IF v_all_passed THEN
    RAISE NOTICE 'ALL TESTS PASSED SUCCESSFULLY! ✅';
  END IF;
  RAISE NOTICE '=================================================';
END $$;
