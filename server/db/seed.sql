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

-- =============================================
-- 5. 답변 가이드 (주제별 대표 질문, 레벨별 가이드)
-- =============================================

-- 자기소개 (질문 1) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(1, 1, 'IM1', '1. 인사 및 이름 소개\n2. 직업 또는 학교 소개\n3. 취미와 관심사 1~2개\n4. 간단한 마무리', '["Let me tell you about myself","I am currently working as","In my free time, I enjoy","That is a little bit about me"]', 60);

-- 자기소개 (질문 1) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(2, 1, 'IM2', '1. 자연스러운 인사와 소개\n2. 직업/전공 상세 설명\n3. 취미와 관심사 2~3개 (이유 포함)\n4. 성격 또는 가치관 언급\n5. 마무리', '["I would like to introduce myself","I have been working in the field of","What I really enjoy doing is","I consider myself to be"]', 70);

-- 자기소개 (질문 1) - IH
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(3, 1, 'IH', '1. 매력적인 도입부\n2. 직업/전공과 경력 상세\n3. 다양한 관심사와 그 배경\n4. 성격과 가치관\n5. 미래 계획\n6. 인상적인 마무리', '["To give you a complete picture of who I am","Throughout my career, I have developed","What truly drives me is","Looking ahead, I aspire to"]', 110);

-- 집/이웃 (질문 7) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(4, 7, 'IM1', '1. 집 유형 소개 (아파트/주택)\n2. 방 개수와 구조\n3. 좋아하는 공간\n4. 마무리', '["I live in a","It has about","My favorite room is","I really like my home because"]', 60);

-- 집/이웃 (질문 7) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(5, 7, 'IM2', '1. 집 위치와 유형\n2. 구조와 인테리어 설명\n3. 주변 환경\n4. 좋아하는 점과 아쉬운 점\n5. 마무리', '["My home is located in","The layout includes","What I appreciate most about my home is","If I could change one thing"]', 70);

-- 여가활동 (질문 12) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(6, 12, 'IM1', '1. 여가 시간 소개\n2. 주요 활동 1~2개\n3. 활동하는 빈도\n4. 좋아하는 이유', '["In my free time","I usually spend time","I do this about","I enjoy it because"]', 60);

-- 여가활동 (질문 12) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(7, 12, 'IM2', '1. 여가 시간의 중요성\n2. 주요 활동 2~3개 상세 설명\n3. 최근 경험 에피소드\n4. 여가 활동이 주는 혜택\n5. 마무리', '["I believe free time is essential for","My go-to activities include","Recently, I had a great time when","These activities help me to"]', 70);

-- 여행 (질문 17) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(8, 17, 'IM1', '1. 최근 여행지 소개\n2. 누구와 갔는지\n3. 한 활동들\n4. 느낀 점', '["I recently went to","I traveled with","While I was there, I","It was a great experience because"]', 60);

-- 여행 (질문 17) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(9, 17, 'IM2', '1. 여행 배경과 동기\n2. 여행지 상세 설명\n3. 주요 활동과 경험\n4. 기억에 남는 에피소드\n5. 전체 소감과 마무리', '["The reason I chose to visit","The destination was known for","One of the highlights of the trip was","Overall, this trip taught me"]', 70);

-- 운동/스포츠 (질문 22) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(10, 22, 'IM1', '1. 좋아하는 운동 소개\n2. 운동 빈도와 장소\n3. 운동을 좋아하는 이유\n4. 마무리', '["My favorite exercise is","I usually work out","I do this about","I enjoy it because it helps me"]', 60);

-- 운동/스포츠 (질문 22) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(11, 22, 'IM2', '1. 운동 습관 소개\n2. 좋아하는 운동의 매력\n3. 운동 루틴 상세 설명\n4. 건강에 미치는 영향\n5. 마무리', '["I have always been passionate about","What attracts me to this sport is","My typical routine involves","Since I started, I have noticed"]', 70);

-- 음악/영화 (질문 27) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(12, 27, 'IM1', '1. 좋아하는 음악 장르\n2. 좋아하는 아티스트\n3. 음악을 듣는 시간/방법\n4. 마무리', '["I really enjoy listening to","My favorite artist is","I usually listen to music when","Music makes me feel"]', 60);

-- 음악/영화 (질문 27) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(13, 27, 'IM2', '1. 음악 취향 소개\n2. 좋아하는 아티스트와 그 이유\n3. 음악이 생활에 미치는 영향\n4. 최근 들은 음악 에피소드\n5. 마무리', '["I have a diverse taste in music","The reason I admire this artist is","Music plays an important role in my life","Recently, I discovered a song that"]', 70);

-- 요리/음식 (질문 32) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(14, 32, 'IM1', '1. 요리 여부와 빈도\n2. 자주 만드는 음식\n3. 좋아하는 이유\n4. 마무리', '["I like cooking","I usually make","My specialty is","I enjoy cooking because"]', 60);

-- 요리/음식 (질문 32) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(15, 32, 'IM2', '1. 요리에 대한 관심도\n2. 자주 만드는 음식과 방법\n3. 요리를 시작한 계기\n4. 최근 요리 경험\n5. 마무리', '["Cooking has become one of my hobbies","I often prepare dishes such as","I first got interested in cooking when","One memorable cooking experience was"]', 70);

-- 기술/인터넷 (질문 37) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(16, 37, 'IM1', '1. 사용하는 기기 소개\n2. 주로 사용하는 용도\n3. 가장 유용한 기술\n4. 마무리', '["I use technology every day","My most used device is","I mainly use it for","Technology makes my life easier because"]', 60);

-- 기술/인터넷 (질문 37) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(17, 37, 'IM2', '1. 일상 속 기술 활용\n2. 주요 기기와 앱 소개\n3. 기술이 가져온 변화\n4. 기술에 대한 생각\n5. 마무리', '["Technology is deeply integrated into my daily routine","The devices I rely on most are","What has changed significantly thanks to technology is","I believe technology will continue to"]', 70);

-- 교육 (질문 42) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(18, 42, 'IM1', '1. 학교/학력 소개\n2. 전공 또는 관심 분야\n3. 학교 생활 경험\n4. 마무리', '["I studied at","My major was","During my school years","I learned a lot about"]', 60);

-- 교육 (질문 42) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(19, 42, 'IM2', '1. 교육 배경 소개\n2. 전공 선택 이유\n3. 인상 깊었던 수업이나 경험\n4. 교육이 현재에 미친 영향\n5. 마무리', '["My educational background includes","I chose to study this field because","One of the most impactful experiences was","Looking back, my education has shaped"]', 70);

-- 직장/업무 (질문 47) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(20, 47, 'IM1', '1. 직업 소개\n2. 주요 업무 설명\n3. 직장의 좋은 점\n4. 마무리', '["I work as a","My main responsibilities include","What I like about my job is","Overall, I enjoy my work"]', 60);

-- 직장/업무 (질문 47) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(21, 47, 'IM2', '1. 회사와 직무 소개\n2. 일과와 주요 업무 상세\n3. 직장에서 배운 점\n4. 향후 커리어 계획\n5. 마무리', '["I am currently employed at","On a typical day, I handle tasks such as","Through my work, I have gained valuable experience in","In the future, I hope to advance my career by"]', 70);
