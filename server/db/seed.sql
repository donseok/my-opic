-- OPIc Master 초기 데이터
-- 서베이 주제 10개, 레벨 9개, 질문 50개+, 사용자 설정 1개

-- =============================================
-- 1. 서베이 주제 (10개)
-- =============================================
INSERT OR IGNORE INTO survey_topics (id, name, name_en, icon, is_selected) VALUES
(1,  '자기소개',     'Self-Introduction',    '👤', 0),
(2,  '집/이웃',      'Home & Neighborhood',  '🏠', 0),
(3,  '여가활동',     'Leisure Activities',    '🎯', 0),
(4,  '여행',         'Travel',               '✈️', 0),
(5,  '운동/스포츠',  'Sports & Exercise',     '⚽', 0),
(6,  '음악/영화',    'Music & Movies',        '🎬', 0),
(7,  '요리/음식',    'Cooking & Food',        '🍳', 0),
(8,  '기술/인터넷',  'Technology & Internet',  '💻', 0),
(9,  '교육',         'Education',             '📚', 0),
(10, '직장/업무',    'Work & Career',         '💼', 0);

-- =============================================
-- 2. OPIc 레벨 (9단계)
-- =============================================
INSERT OR IGNORE INTO levels (id, code, name, description, min_words, order_index) VALUES
(1, 'NL',  'Novice Low',          '기본적인 단어나 구를 사용할 수 있는 단계',                  20, 0),
(2, 'NM',  'Novice Mid',          '암기한 단어와 구를 사용하여 최소한의 의사소통이 가능한 단계', 30, 1),
(3, 'NH',  'Novice High',         '간단한 문장을 만들 수 있으나 불완전한 단계',                 40, 2),
(4, 'IL',  'Intermediate Low',    '일상적인 주제에 대해 문장으로 말할 수 있는 단계',            50, 3),
(5, 'IM1', 'Intermediate Mid 1',  '익숙한 주제에 대해 문장을 나열할 수 있는 단계',              60, 4),
(6, 'IM2', 'Intermediate Mid 2',  '다양한 주제에 대해 문장을 연결할 수 있는 단계',              70, 5),
(7, 'IM3', 'Intermediate Mid 3',  '문단 수준으로 말할 수 있으며 상세한 설명이 가능한 단계',      80, 6),
(8, 'IH',  'Intermediate High',   '복잡한 상황에서도 논리적으로 설명할 수 있는 단계',           110, 7),
(9, 'AL',  'Advanced Low',        '추상적인 주제에 대해서도 유창하게 토론할 수 있는 단계',       130, 8);

-- =============================================
-- 3. 사용자 설정 기본값
-- =============================================
INSERT OR IGNORE INTO user_settings (id, current_level, target_level, updated_at) VALUES
(1, NULL, NULL, NULL);

-- =============================================
-- 4. 질문 데이터 (주제당 5개+, 총 55개)
-- =============================================

-- 주제 1: 자기소개
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(1,  1, 'Tell me about yourself. What do you do and what are your interests?', 'survey', 'easy'),
(2,  1, 'Describe your daily routine from morning to night.', 'survey', 'medium'),
(3,  1, 'What are your hobbies and how did you get interested in them?', 'survey', 'medium'),
(4,  1, 'Tell me about your family members and what they do.', 'combo', 'medium'),
(5,  1, 'Imagine you are meeting someone for the first time at a party. Introduce yourself and ask about them.', 'roleplay', 'hard'),
(6,  1, 'What kind of person are you? Describe your personality.', 'survey', 'easy');

-- 주제 2: 집/이웃
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(7,  2, 'Describe your home. What does it look like and how many rooms does it have?', 'survey', 'easy'),
(8,  2, 'Tell me about your neighborhood. What is it like?', 'survey', 'medium'),
(9,  2, 'What do you like most about your home? Is there anything you would like to change?', 'combo', 'medium'),
(10, 2, 'Describe a memorable experience you had with your neighbors.', 'survey', 'hard'),
(11, 2, 'Your neighbor is playing loud music late at night. Call them and ask them to turn it down.', 'roleplay', 'hard');

-- 주제 3: 여가활동
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(12, 3, 'What do you usually do in your free time?', 'survey', 'easy'),
(13, 3, 'Tell me about a hobby you recently started. Why did you start it?', 'survey', 'medium'),
(14, 3, 'Describe a memorable leisure activity you did last weekend.', 'survey', 'medium'),
(15, 3, 'How has your way of spending free time changed over the years?', 'combo', 'hard'),
(16, 3, 'You want to invite a friend to join a new activity. Call them and convince them to come.', 'roleplay', 'hard');

-- 주제 4: 여행
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(17, 4, 'Tell me about a trip you took recently. Where did you go and what did you do?', 'survey', 'medium'),
(18, 4, 'What do you usually do to prepare for a trip?', 'survey', 'easy'),
(19, 4, 'Describe the most memorable trip you have ever taken and explain why it was special.', 'combo', 'hard'),
(20, 4, 'Compare traveling domestically and traveling abroad. Which do you prefer?', 'survey', 'hard'),
(21, 4, 'You are at a hotel and there is a problem with your room. Call the front desk and explain the issue.', 'roleplay', 'hard');

-- 주제 5: 운동/스포츠
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(22, 5, 'What kind of exercise or sports do you enjoy? How often do you do it?', 'survey', 'easy'),
(23, 5, 'Tell me about a sports event you watched recently.', 'survey', 'medium'),
(24, 5, 'Describe the place where you usually exercise. What is it like?', 'survey', 'medium'),
(25, 5, 'How has your exercise routine changed compared to a few years ago?', 'combo', 'hard'),
(26, 5, 'You want to sign up for a gym. Call the gym and ask about membership options.', 'roleplay', 'hard');

-- 주제 6: 음악/영화
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(27, 6, 'What kind of music do you like to listen to? Who is your favorite artist?', 'survey', 'easy'),
(28, 6, 'Tell me about a movie you watched recently. What was it about?', 'survey', 'medium'),
(29, 6, 'How do you usually listen to music or watch movies?', 'survey', 'easy'),
(30, 6, 'Describe a concert or a movie experience that was memorable to you.', 'combo', 'hard'),
(31, 6, 'You want to book movie tickets. Call the theater and ask about available showtimes.', 'roleplay', 'hard');

-- 주제 7: 요리/음식
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(32, 7, 'Do you like cooking? What kind of food do you usually cook?', 'survey', 'easy'),
(33, 7, 'Tell me about your favorite restaurant. What do you usually order there?', 'survey', 'medium'),
(34, 7, 'Describe a time when you tried to cook something new. How did it turn out?', 'survey', 'medium'),
(35, 7, 'How have your eating habits changed over the years?', 'combo', 'hard'),
(36, 7, 'You are at a restaurant and your order is wrong. Talk to the waiter and resolve the issue.', 'roleplay', 'hard');

-- 주제 8: 기술/인터넷
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(37, 8, 'What kind of technology do you use in your daily life?', 'survey', 'easy'),
(38, 8, 'How do you use the internet? What websites or apps do you use most often?', 'survey', 'medium'),
(39, 8, 'Tell me about a time when technology caused a problem for you.', 'survey', 'medium'),
(40, 8, 'How has technology changed the way people communicate compared to the past?', 'combo', 'hard'),
(41, 8, 'Your computer is not working properly. Call tech support and describe the problem.', 'roleplay', 'hard');

-- 주제 9: 교육
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(42, 9, 'Tell me about your school or educational background.', 'survey', 'easy'),
(43, 9, 'What was your favorite subject in school? Why did you like it?', 'survey', 'medium'),
(44, 9, 'Describe a teacher who had a big influence on you.', 'survey', 'medium'),
(45, 9, 'How is education today different from education in the past?', 'combo', 'hard'),
(46, 9, 'You want to enroll in a language course. Call the school and ask about classes.', 'roleplay', 'hard');

-- 주제 10: 직장/업무
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(47, 10, 'Tell me about your job. What do you do at work?', 'survey', 'easy'),
(48, 10, 'Describe a typical day at your workplace.', 'survey', 'medium'),
(49, 10, 'What do you like and dislike about your job?', 'combo', 'medium'),
(50, 10, 'Tell me about a challenging project you worked on. How did you handle it?', 'survey', 'hard'),
(51, 10, 'You need to request a day off from your manager. Call them and explain why.', 'roleplay', 'hard');

-- 돌발 질문 (주제 무관)
INSERT OR IGNORE INTO questions (id, topic_id, question_text, type, difficulty) VALUES
(52, 1, 'Tell me about a recent purchase you made. Why did you buy it?', 'unexpected', 'medium'),
(53, 3, 'Describe the weather in your country. How does it affect your daily life?', 'unexpected', 'medium'),
(54, 5, 'Tell me about a health issue you or someone you know experienced.', 'unexpected', 'hard'),
(55, 8, 'What changes would you like to see in your community?', 'unexpected', 'hard');
