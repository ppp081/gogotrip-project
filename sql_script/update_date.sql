UPDATE public.chat_trip
SET 
    start_date = start_date + INTERVAL '1 year',
    end_date = end_date + INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM start_date) = 2025;
