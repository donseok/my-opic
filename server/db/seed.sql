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

-- =============================================
-- 6. 추가 답변 가이드 (서베이/콤보 질문 보충)
-- =============================================

-- 일상 루틴 (질문 2) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(22, 2, 'IM1', '1. 아침 일과 (기상, 아침식사)\n2. 낮 활동 (학교/직장)\n3. 저녁 일과 (취미, 휴식)\n4. 잠자리 루틴', '["I usually wake up at","After breakfast, I go to","In the evening, I like to","Before going to bed, I usually"]', 60);

-- 취미 (질문 3) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(23, 3, 'IM1', '1. 취미 소개\n2. 시작한 계기\n3. 즐기는 방법\n4. 취미가 주는 즐거움', '["One of my hobbies is","I first got into it when","I usually do this by","It makes me happy because"]', 60);

-- 가족 소개 (질문 4) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(24, 4, 'IM1', '1. 가족 구성원 소개\n2. 부모님 직업/특징\n3. 형제자매 소개\n4. 가족과 함께하는 활동', '["There are four people in my family","My father works as","My mother is","We often spend time together by"]', 60);

-- 이웃 (질문 8) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(25, 8, 'IM1', '1. 동네 위치와 분위기\n2. 주변 시설 소개\n3. 좋아하는 점\n4. 마무리', '["I live in a neighborhood called","There are many facilities nearby such as","What I like about my neighborhood is","Overall, it is a great place to live"]', 60);

-- 집의 좋은 점 (질문 9) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(26, 9, 'IM1', '1. 집에서 가장 좋아하는 점\n2. 그 이유 설명\n3. 바꾸고 싶은 점\n4. 마무리', '["What I like most about my home is","The reason is that","If I could change one thing, it would be","Other than that, I am happy with my home"]', 60);

-- 새로운 취미 (질문 13) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(27, 13, 'IM1', '1. 최근 시작한 취미 소개\n2. 시작한 이유\n3. 하는 방법과 빈도\n4. 느낀 점', '["I recently started","The reason I started was","I do this about","So far, I really enjoy it because"]', 60);

-- 여가 변화 (질문 15) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(28, 15, 'IM2', '1. 과거의 여가 활동\n2. 현재의 여가 활동\n3. 변화의 이유\n4. 현재 여가에 대한 생각\n5. 마무리', '["When I was younger, I used to","These days, I prefer to","The main reason for this change is","I think this shift reflects","Looking back, I appreciate both"]', 70);

-- 여행 준비 (질문 18) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(29, 18, 'IM1', '1. 여행 준비 시작 시기\n2. 숙소/교통 예약\n3. 짐 싸기\n4. 기타 준비사항', '["When I plan a trip, I start by","First, I book the accommodation and transportation","Then, I pack my bags with","I also make sure to"]', 60);

-- 기억에 남는 여행 (질문 19) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(30, 19, 'IM2', '1. 여행지와 시기\n2. 여행의 특별한 이유\n3. 가장 기억에 남는 순간\n4. 여행에서 배운 점\n5. 마무리', '["The most memorable trip I have taken was to","What made this trip special was","The moment I will never forget is when","This experience taught me that","I would love to go back someday"]', 70);

-- 스포츠 경기 관람 (질문 23) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(31, 23, 'IM1', '1. 최근 본 경기 소개\n2. 어디서 봤는지\n3. 경기 내용\n4. 느낀 점', '["I recently watched a","I watched it on","The game was really exciting because","I felt very happy when"]', 60);

-- 운동 습관 변화 (질문 25) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(32, 25, 'IM2', '1. 과거의 운동 습관\n2. 현재의 운동 습관\n3. 변화의 이유\n4. 운동이 삶에 미친 영향\n5. 마무리', '["A few years ago, I used to","Nowadays, my exercise routine includes","The reason for this change was","Exercise has had a positive impact on","I plan to continue improving my fitness"]', 70);

-- 최근 본 영화 (질문 28) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(33, 28, 'IM1', '1. 영화 제목과 장르\n2. 줄거리 간단 소개\n3. 인상 깊었던 장면\n4. 추천 여부', '["I recently watched a movie called","It is about","The part I liked the most was","I would recommend this movie to"]', 60);

-- 콘서트/영화 경험 (질문 30) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(34, 30, 'IM2', '1. 경험 소개 (언제, 어디서)\n2. 특별했던 이유\n3. 기억에 남는 순간\n4. 함께한 사람들과의 추억\n5. 마무리', '["One of the most memorable experiences was when","It was special because","The moment that stood out the most was","I was there with","It is an experience I will always cherish"]', 70);

-- 좋아하는 식당 (질문 33) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(35, 33, 'IM1', '1. 식당 이름과 위치\n2. 자주 시키는 메뉴\n3. 좋아하는 이유\n4. 마무리', '["My favorite restaurant is","I usually order","The food is always","I recommend this place because"]', 60);

-- 식습관 변화 (질문 35) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(36, 35, 'IM2', '1. 과거의 식습관\n2. 현재의 식습관\n3. 변화의 계기\n4. 건강에 미친 영향\n5. 마무리', '["In the past, I used to eat","Now, I try to focus on","The turning point was when","Since changing my diet, I have noticed","I believe healthy eating is important for"]', 70);

-- 인터넷 사용 (질문 38) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(37, 38, 'IM1', '1. 인터넷 사용 빈도\n2. 자주 사용하는 사이트/앱\n3. 주로 하는 활동\n4. 마무리', '["I use the internet every day","The apps I use most often are","I mainly use it to","The internet is very useful for"]', 60);

-- 기술과 소통 변화 (질문 40) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(38, 40, 'IM2', '1. 과거의 소통 방식\n2. 현재의 소통 방식\n3. 기술이 가져온 긍정적 변화\n4. 부정적 측면\n5. 마무리', '["In the past, people mainly communicated through","Today, technology has made it possible to","One positive change is that","However, some drawbacks include","Overall, I think technology has transformed"]', 70);

-- 좋아했던 과목 (질문 43) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(39, 43, 'IM1', '1. 좋아했던 과목 소개\n2. 좋아한 이유\n3. 기억에 남는 수업/활동\n4. 마무리', '["My favorite subject was","I liked it because","I remember one time when","This subject helped me to"]', 60);

-- 교육 변화 (질문 45) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(40, 45, 'IM2', '1. 과거의 교육 방식\n2. 현재의 교육 방식\n3. 주요 차이점\n4. 변화에 대한 의견\n5. 마무리', '["Education in the past was focused on","Nowadays, education has shifted toward","One major difference is that","I believe this change is beneficial because","However, there are also challenges such as"]', 70);

-- 직장에서의 하루 (질문 48) - IM1
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(41, 48, 'IM1', '1. 출근 시간과 방법\n2. 오전 업무\n3. 점심시간\n4. 오후 업무와 퇴근', '["I usually start work at","In the morning, I handle","During lunch, I usually","In the afternoon, I focus on"]', 60);

-- 직장의 장단점 (질문 49) - IM2
INSERT OR IGNORE INTO answer_guides (id, question_id, level_code, structure, key_phrases, target_words) VALUES
(42, 49, 'IM2', '1. 직장의 좋은 점 2~3개\n2. 아쉬운 점 1~2개\n3. 전체적인 만족도\n4. 개선하고 싶은 점\n5. 마무리', '["What I like about my job is","Another advantage is that","On the other hand, one thing I dislike is","Overall, I am quite satisfied with","If I could improve one thing, it would be"]', 70);
