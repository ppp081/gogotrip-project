-- =========================
-- MOCK RATINGS DATA
-- =========================

INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '776d7593-6ddc-470e-964f-50e11a2bf76f',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    2,
    5000,
    'confirmed',
    NOW()x
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'df3fe520-6fde-48c0-83c1-ca6e337f70ac',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    '776d7593-6ddc-470e-964f-50e11a2bf76f',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    3,
    3,
    '(piti) โอเคครับ สมราคา',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '88d6325a-42e6-461f-b7f5-f46cc0a369ce',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'e51c4f1f-b1d5-463f-bc3e-5c96b25c453b',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    '88d6325a-42e6-461f-b7f5-f46cc0a369ce',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    0,
    0,
    '(piti) บริการห่วยแตก ไม่แนะนำ',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'f4e16a32-0736-430a-99f7-50d7675ec1ff',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '6c31ea03-b884-498b-b5b2-8cafd7036043',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    'f4e16a32-0736-430a-99f7-50d7675ec1ff',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    5,
    5,
    '(john) ทริปนี้สนุกมาก ประทับใจสุดๆ',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '228a03c9-63a5-4f61-b8ea-b2431e940f24',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '0d757514-96de-44c6-93bf-8c4f0f83171f',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    '228a03c9-63a5-4f61-b8ea-b2431e940f24',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    0,
    0,
    '(piti) โดนเท เวลาไม่ตรง ไม่โอเค',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '747dbd2b-65ec-4a5b-91b3-dd02983695eb',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'c4f61c07-f40b-484a-bd38-af139697792a',
    'f528b017-d2b8-4ba7-be43-f3b52dedc9de',
    '747dbd2b-65ec-4a5b-91b3-dd02983695eb',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    2,
    2,
    '(clark) บริการไม่ค่อยดี',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '097e9c6a-c78d-4ee4-9169-011a8bb9d7d8',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '356ae734-f97f-4ba6-a081-a67ea0a753fc',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '097e9c6a-c78d-4ee4-9169-011a8bb9d7d8',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    3,
    3,
    '(clark) Average experience.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '97ef1d9f-ec64-40ae-bb82-81252cbd8e30',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '725a5ead-dc41-4d7b-a53e-3a853ab0c01c',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '97ef1d9f-ec64-40ae-bb82-81252cbd8e30',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    4,
    4,
    '(piti) Overall ดีมากครับ',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'a6ab2a20-de78-4ba9-ba39-fe3fcde7f66b',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '51cc30f4-ce44-489f-9cc5-bc0955ea4e1e',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    'a6ab2a20-de78-4ba9-ba39-fe3fcde7f66b',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    1,
    1,
    '(john) โดนเท เวลาไม่ตรง ไม่โอเค',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '32b13443-51a2-43b1-80ac-e2d65b58ded7',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '09a19dad-ba53-4c7f-9359-556fe69309f7',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '32b13443-51a2-43b1-80ac-e2d65b58ded7',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    4,
    4,
    '(emma) ดีครับ แต่คนเยอะไปนิด',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '178a364a-9547-4392-9ad9-48520d1a7c5b',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    'fe26b83a-0cd3-4df2-bfaa-c59511f094a8',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'f4633fae-d393-46db-9b07-3ae72580257f',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '178a364a-9547-4392-9ad9-48520d1a7c5b',
    'fe26b83a-0cd3-4df2-bfaa-c59511f094a8',
    4,
    4,
    '(jane) ดีครับ แต่คนเยอะไปนิด',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '3e15fb4b-6545-4ba0-80a2-1536ac017ac3',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '265e60d9-4213-4bd8-a809-717de503901d',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '3e15fb4b-6545-4ba0-80a2-1536ac017ac3',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    3,
    3,
    '(piti) โอเคครับ สมราคา',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '7409d3df-2354-4b62-b5f0-2b289f4eec15',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '6b95a2b4-a5c1-4f7e-8493-4cebce2fb2d2',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '7409d3df-2354-4b62-b5f0-2b289f4eec15',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    5,
    5,
    '(piti) คุ้มค่ามากครับ แนะนำเลย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '3d57d0d1-e071-4cd6-8a6d-93fcc00246c1',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '24c916f5-213f-47cd-b29b-8e6eb8eaa9b9',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'fd6e31cf-9fd1-4f6a-ae8c-99a077cdb024',
    'eda6fb32-caaa-477e-8efd-217f5ac30168',
    '3d57d0d1-e071-4cd6-8a6d-93fcc00246c1',
    '24c916f5-213f-47cd-b29b-8e6eb8eaa9b9',
    3,
    3,
    '(bruce) Average experience.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '4619b7db-0232-41ce-ae1e-80028ce8cde6',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    'fe26b83a-0cd3-4df2-bfaa-c59511f094a8',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '83d67690-e6ca-4cae-bba1-bcde464a55c6',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    '4619b7db-0232-41ce-ae1e-80028ce8cde6',
    'fe26b83a-0cd3-4df2-bfaa-c59511f094a8',
    5,
    5,
    '(jane) คุ้มค่ามากครับ แนะนำเลย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'a2e0255a-60e8-4ed1-a563-92c37af7c398',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '36c5df6d-6e34-4df3-9091-de3e4837d494',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    'a2e0255a-60e8-4ed1-a563-92c37af7c398',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    4,
    4,
    '(emma) ดีครับ แต่คนเยอะไปนิด',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'a494bbe3-a742-41bf-bf52-1554cd8f4d74',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '3111530d-f72e-4642-aeea-8fc3a0bfebe7',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    'a494bbe3-a742-41bf-bf52-1554cd8f4d74',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    3,
    3,
    '(piti) โอเคครับ สมราคา',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'b9559105-b963-440f-a114-b1e8abf7a8bc',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'db3839f4-8b7b-4004-93ac-97851a5316a4',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    'b9559105-b963-440f-a114-b1e8abf7a8bc',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    5,
    5,
    '(chujai) Amazing trip. Highly recommended.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'a3c48fc6-5cd1-4480-b66a-024f7f2eb4ac',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'da5dde37-c076-4ab3-83a1-877ef4e176b6',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    'a3c48fc6-5cd1-4480-b66a-024f7f2eb4ac',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    3,
    3,
    '(chujai) Average experience.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '5c418b24-7fc2-4943-8aa9-3cde0cc026c3',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'acedf519-963f-401d-88c0-ada0a8220e76',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    '5c418b24-7fc2-4943-8aa9-3cde0cc026c3',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    3,
    3,
    '(clark) อาหารน้อยไปหน่อย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '045aac43-1937-47c9-9fb3-41eb835d8c48',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    '24c916f5-213f-47cd-b29b-8e6eb8eaa9b9',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '17242514-76a6-476e-8a90-2ac5f518af99',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    '045aac43-1937-47c9-9fb3-41eb835d8c48',
    '24c916f5-213f-47cd-b29b-8e6eb8eaa9b9',
    0,
    0,
    '(bruce) Worst trip ever. Never again.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'f30573cc-04b0-41f9-8464-84b74ed35bb0',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'a17d0660-51d2-4556-8579-a2be8e421031',
    'e491c123-42ff-43ea-a4d0-47823b8c4790',
    'f30573cc-04b0-41f9-8464-84b74ed35bb0',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    3,
    3,
    '(manee) เฉยๆ ไม่ได้ว้าวมาก',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '598bce1f-6493-4a59-aa69-1a514f4951e0',
    'd5b44f71-83dc-4d5e-8918-0c05fe044ed2',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '1e36ef78-bb1c-4741-88ae-6727cc11fe4d',
    'd5b44f71-83dc-4d5e-8918-0c05fe044ed2',
    '598bce1f-6493-4a59-aa69-1a514f4951e0',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    5,
    5,
    '(john) สนุกมากครับ เพื่อนร่วมทริปน่ารัก',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '1feb18ed-5cc9-4377-bcf8-353a6394bc42',
    'd5b44f71-83dc-4d5e-8918-0c05fe044ed2',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'ff290d8b-1083-42e5-b676-f04a17bf4332',
    'd5b44f71-83dc-4d5e-8918-0c05fe044ed2',
    '1feb18ed-5cc9-4377-bcf8-353a6394bc42',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    5,
    5,
    '(clark) Amazing trip. Highly recommended.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'f9f74503-6c3c-4281-a3e1-316a4ef592fb',
    'd5b44f71-83dc-4d5e-8918-0c05fe044ed2',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '917ced50-b03f-429d-8faf-ebd27e1c2394',
    'd5b44f71-83dc-4d5e-8918-0c05fe044ed2',
    'f9f74503-6c3c-4281-a3e1-316a4ef592fb',
    '6b668b8d-adab-417e-847c-48ee9102a20a',
    5,
    5,
    '(piti) จัดการดีมากครับ ไกด์เก่ง',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '4a42c62e-7082-4722-9e05-f0eb12147b02',
    'd5b44f71-83dc-4d5e-8918-0c05fe044ed2',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '14500fda-97a6-468f-935c-d73a6c89d0b3',
    'd5b44f71-83dc-4d5e-8918-0c05fe044ed2',
    '4a42c62e-7082-4722-9e05-f0eb12147b02',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    5,
    5,
    '(clark) สนุกมากครับ เพื่อนร่วมทริปน่ารัก',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '44767d46-b15a-48d1-8982-8159cfcfe3b0',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '9f1a8956-4b32-47db-9e19-162b8c04c026',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '44767d46-b15a-48d1-8982-8159cfcfe3b0',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    2,
    2,
    '(emma) Not great experience.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'c2e68c93-e7b7-4234-9086-8b152dd67b40',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '5d7abf63-4aac-4250-9bae-923b82dd48e2',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    'c2e68c93-e7b7-4234-9086-8b152dd67b40',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    0,
    0,
    '(chujai) Worst trip ever. Never again.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '21f240cc-b5c2-4cb0-9f84-aeb843fe8309',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '20118cc9-7bc8-4e53-a74c-197db94e83ba',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '21f240cc-b5c2-4cb0-9f84-aeb843fe8309',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    1,
    1,
    '(manee) แย่มาก ไม่ประทับใจเลย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'ab6e8f18-338d-48ea-9a5f-023932b8f75b',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '73a6bd9b-4c94-4d22-a285-2e330741606d',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '38c97f0e-7a6a-44fb-83d4-892f791a1c00',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    'ab6e8f18-338d-48ea-9a5f-023932b8f75b',
    '73a6bd9b-4c94-4d22-a285-2e330741606d',
    4,
    4,
    '(mario) วิวสวยแต่แดดแรงไปหน่อย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '4206a3e8-ab2c-4737-ab94-b918e44e047e',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '24c916f5-213f-47cd-b29b-8e6eb8eaa9b9',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '754055aa-c74e-4059-b3f3-7aa1d5263e66',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '4206a3e8-ab2c-4737-ab94-b918e44e047e',
    '24c916f5-213f-47cd-b29b-8e6eb8eaa9b9',
    4,
    4,
    '(bruce) Good trip but slightly crowded.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'b1d745b7-11bf-4471-90a0-137dd44c27c2',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'a1a2fbe9-b93a-4968-852b-78cfb71e7efd',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    'b1d745b7-11bf-4471-90a0-137dd44c27c2',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    5,
    5,
    '(chujai) บริการดีมาก ทุกอย่างราบรื่น',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '5ea0de96-e9f5-4f47-b8d0-aaef4f18583b',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    'f8201334-5d5c-47c3-ace4-d433188fd40e',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '74fe0e34-eca6-401b-bf47-e583b9e6b4e4',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '5ea0de96-e9f5-4f47-b8d0-aaef4f18583b',
    'f8201334-5d5c-47c3-ace4-d433188fd40e',
    3,
    3,
    '(somchai) อาหารน้อยไปหน่อย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '049da3ab-9b06-419c-8cd0-db42edff1daa',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'fbe3704f-c14b-4b27-818b-07f767feb3bd',
    'bb92951d-a2e0-4512-9365-fae01e9c2e77',
    '049da3ab-9b06-419c-8cd0-db42edff1daa',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    5,
    5,
    '(emma) วิวสวยมาก ไกด์ดูแลดีมาก',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '849788e1-cd87-4b24-b092-d3627dee134b',
    '276533c1-5845-4213-b971-eef2592ad79c',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '1fd8ae23-680f-479b-854f-e9d3733eeb73',
    '276533c1-5845-4213-b971-eef2592ad79c',
    '849788e1-cd87-4b24-b092-d3627dee134b',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    3,
    3,
    '(john) โอเคครับ สมราคา',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'c6d77600-f2bd-4d62-ad9d-0b279ea1e4c7',
    '276533c1-5845-4213-b971-eef2592ad79c',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '406ae8d7-5fdb-4c1d-bca2-be4aa976f3df',
    '276533c1-5845-4213-b971-eef2592ad79c',
    'c6d77600-f2bd-4d62-ad9d-0b279ea1e4c7',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    1,
    1,
    '(manee) แย่มาก ไม่ประทับใจเลย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '4d718559-e76b-4f09-a7fb-543ca9c41afb',
    '276533c1-5845-4213-b971-eef2592ad79c',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'f69f531d-bbb7-41b1-bbc6-05e46df1cd9c',
    '276533c1-5845-4213-b971-eef2592ad79c',
    '4d718559-e76b-4f09-a7fb-543ca9c41afb',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    5,
    5,
    '(emma) บริการดีมาก ทุกอย่างราบรื่น',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'fb1e0713-73ec-43f0-8651-6d0f51d3803f',
    '276533c1-5845-4213-b971-eef2592ad79c',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'fa9d55e6-9ff9-450e-99e0-9740fbb9ac82',
    '276533c1-5845-4213-b971-eef2592ad79c',
    'fb1e0713-73ec-43f0-8651-6d0f51d3803f',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    0,
    0,
    '(chujai) Worst trip ever. Never again.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '344adb40-186b-435e-a763-449e9a519527',
    '074ca658-a456-47cc-a387-cf3106382f09',
    'fe26b83a-0cd3-4df2-bfaa-c59511f094a8',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '7ed4f9c4-d2ba-4b89-8d80-dc78d055f93a',
    '074ca658-a456-47cc-a387-cf3106382f09',
    '344adb40-186b-435e-a763-449e9a519527',
    'fe26b83a-0cd3-4df2-bfaa-c59511f094a8',
    3,
    3,
    '(jane) อาหารน้อยไปหน่อย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'bfe18273-be6e-46da-bc84-d5dbd93f7610',
    '074ca658-a456-47cc-a387-cf3106382f09',
    '24c916f5-213f-47cd-b29b-8e6eb8eaa9b9',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '986ad2cc-5603-49c6-b03d-e514223b20bc',
    '074ca658-a456-47cc-a387-cf3106382f09',
    'bfe18273-be6e-46da-bc84-d5dbd93f7610',
    '24c916f5-213f-47cd-b29b-8e6eb8eaa9b9',
    5,
    5,
    '(bruce) คุ้มค่ามากครับ แนะนำเลย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '96e3873a-9926-4a18-85c9-9210e2d5ba56',
    '074ca658-a456-47cc-a387-cf3106382f09',
    'fe26b83a-0cd3-4df2-bfaa-c59511f094a8',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '41b6bc16-c616-4f79-89be-8ed8bb005b7b',
    '074ca658-a456-47cc-a387-cf3106382f09',
    '96e3873a-9926-4a18-85c9-9210e2d5ba56',
    'fe26b83a-0cd3-4df2-bfaa-c59511f094a8',
    4,
    4,
    '(jane) ดีครับ แต่คนเยอะไปนิด',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '81a299db-0c45-41a2-bc51-c33751fb2108',
    '074ca658-a456-47cc-a387-cf3106382f09',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '32a3bfec-bf53-4f5a-a8ac-bfecc3ff88f2',
    '074ca658-a456-47cc-a387-cf3106382f09',
    '81a299db-0c45-41a2-bc51-c33751fb2108',
    '45583d65-9628-40c0-8c2d-d4457ef6484c',
    4,
    4,
    '(chujai) Overall ดีมากครับ',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '5337a46e-4ca9-489f-9f1c-76244f4ae48a',
    '074ca658-a456-47cc-a387-cf3106382f09',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '2fa9a0e6-e98e-4704-ad8f-e3c220a881a9',
    '074ca658-a456-47cc-a387-cf3106382f09',
    '5337a46e-4ca9-489f-9f1c-76244f4ae48a',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    2,
    2,
    '(manee) Not great experience.',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '16b1ad6c-bb07-43d5-b417-84bb9241744c',
    '0051b6a0-d3b4-4669-bc50-ef8fd691e47a',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '9898b149-a1d7-434a-85ae-9d87eec230cf',
    '0051b6a0-d3b4-4669-bc50-ef8fd691e47a',
    '16b1ad6c-bb07-43d5-b417-84bb9241744c',
    '4f64d037-a159-4e8e-9391-e0afd7d3a44f',
    5,
    5,
    '(emma) บริการดีมาก ทุกอย่างราบรื่น',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '950e826d-0e6d-4af7-ba9d-9008ebcc9108',
    '0051b6a0-d3b4-4669-bc50-ef8fd691e47a',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '0848576f-bc68-4a7c-92b4-cac075094649',
    '0051b6a0-d3b4-4669-bc50-ef8fd691e47a',
    '950e826d-0e6d-4af7-ba9d-9008ebcc9108',
    'dd10a2c8-9694-42c5-a617-5ebf11c84848',
    4,
    4,
    '(manee) ดีครับ แต่คนเยอะไปนิด',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    'd5ac35d0-2733-41b6-b1d1-d32393e4b2f0',
    '0051b6a0-d3b4-4669-bc50-ef8fd691e47a',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    'fb6fd842-a9b3-4d69-95ff-fb4fa3dcf9d7',
    '0051b6a0-d3b4-4669-bc50-ef8fd691e47a',
    'd5ac35d0-2733-41b6-b1d1-d32393e4b2f0',
    'fdafce2b-9a89-43a2-994a-f713dd3fb607',
    4,
    4,
    '(john) วิวสวยแต่แดดแรงไปหน่อย',
    NOW()
);


INSERT INTO public.chat_booking (
    id,
    trip_id,
    customer_id,
    group_size,
    total_price,
    status,
    created_at
) VALUES (
    '209c3632-1fc6-4db3-8c93-9d236714cf53',
    '0051b6a0-d3b4-4669-bc50-ef8fd691e47a',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    2,
    5000,
    'confirmed',
    NOW()
);


INSERT INTO public.chat_rating (
    id,
    trip_id,
    booking_id,
    user_id,
    trip_rating,
    service_rating,
    comment,
    created_at
) VALUES (
    '7a2e376d-816c-4bc3-b954-d17217072c5d',
    '0051b6a0-d3b4-4669-bc50-ef8fd691e47a',
    '209c3632-1fc6-4db3-8c93-9d236714cf53',
    'd6be780e-7b69-4fce-a6bc-50fe5036cd0b',
    4,
    4,
    '(clark) ไกด์ดีครับ แต่รถแอร์ไม่เย็น',
    NOW()
);
