-- อัปเดต start/end ของทุกทริปใน chat_trip
-- สุ่มวันเริ่มระหว่าง 20 มีนาคม 2026 ถึง 31 ธันวาคม 2026 โดยคงความยาวทริปเดิม (end - start)
-- ถ้าทริปยาวเกินช่วง วันเริ่มจะอยู่ที่ 20 มี.ค. 2026 (ช่วงสุ่ม = 0)

UPDATE public.chat_trip AS t
SET
    start_date = s.new_start,
    end_date = s.new_start + (t.end_date - t.start_date)
FROM (
    SELECT
        ct.id,
        date_trunc(
            'minute',
            timestamp '2026-03-20 00:00:00'
            + random() * GREATEST(
                interval '0',
                (
                    timestamp '2026-12-31 23:59:59'
                    - (ct.end_date - ct.start_date)
                )
                - timestamp '2026-03-20 00:00:00'
            )
        ) AS new_start
    FROM public.chat_trip AS ct
) AS s
WHERE t.id = s.id;
