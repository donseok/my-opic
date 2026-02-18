// 출석 체크 & 학습 포인트 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// 연속 출석 보너스 규칙
const STREAK_BONUSES = [
    { days: 30, bonus: 50, label: '30일 연속 출석' },
    { days: 7, bonus: 15, label: '7일 연속 출석' },
    { days: 3, bonus: 5, label: '3일 연속 출석' }
];

/**
 * 연속 출석 일수 계산 (오늘 포함)
 */
function calculateStreak(db, includeToday = true) {
    const dates = db.prepare(
        `SELECT check_date FROM daily_attendance
     ORDER BY check_date DESC LIMIT 120`
    ).all().map(r => r.check_date);

    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let streak = 0;
    let checkDate;

    if (includeToday && dates.includes(today)) {
        checkDate = new Date();
    } else if (dates.includes(yesterday)) {
        checkDate = new Date(Date.now() - 86400000);
    } else if (includeToday && dates[0] === today) {
        checkDate = new Date();
    } else {
        return 0;
    }

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dates.includes(dateStr)) {
            streak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * 포인트 적립 헬퍼
 */
function addPoints(db, points, reason, description) {
    const now = new Date().toISOString();
    db.prepare(
        'INSERT INTO point_history (points, reason, description, created_at) VALUES (?, ?, ?, ?)'
    ).run(points, reason, description, now);
}

// POST /api/v1/attendance/check-in — 오늘 출석 체크
router.post('/check-in', (req, res, next) => {
    try {
        const db = getDatabase();
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        // 이미 출석 체크했는지 확인
        const existing = db.prepare(
            'SELECT * FROM daily_attendance WHERE check_date = ?'
        ).get(today);

        if (existing) {
            return res.json({
                already_checked: true,
                message: '오늘 이미 출석 체크했습니다!',
                check_date: today,
                points_earned: existing.points_earned,
                streak_bonus: existing.streak_bonus
            });
        }

        // 출석 체크 트랜잭션
        const checkIn = db.transaction(() => {
            const basePoints = 10;
            let streakBonus = 0;

            // 출석 기록 저장
            db.prepare(
                'INSERT INTO daily_attendance (check_date, points_earned, streak_bonus, checked_at) VALUES (?, ?, ?, ?)'
            ).run(today, basePoints, 0, now);

            // 기본 포인트 적립
            addPoints(db, basePoints, 'attendance', `${today} 출석 체크`);

            // 연속 출석 보너스 계산 (오늘 포함)
            const streak = calculateStreak(db, true);

            for (const rule of STREAK_BONUSES) {
                if (streak >= rule.days && streak % rule.days === 0) {
                    streakBonus = rule.bonus;
                    addPoints(db, rule.bonus, 'streak_bonus', `${rule.label} 보너스 (${streak}일)`);
                    break;
                }
            }

            // 보너스 업데이트
            if (streakBonus > 0) {
                db.prepare(
                    'UPDATE daily_attendance SET streak_bonus = ? WHERE check_date = ?'
                ).run(streakBonus, today);
            }

            return { basePoints, streakBonus, streak };
        });

        const result = checkIn();

        res.json({
            already_checked: false,
            message: '출석 체크 완료!',
            check_date: today,
            points_earned: result.basePoints,
            streak_bonus: result.streakBonus,
            current_streak: result.streak,
            total_today: result.basePoints + result.streakBonus
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/attendance/status — 오늘 출석 여부 + 연속 출석 일수
router.get('/status', (req, res, next) => {
    try {
        const db = getDatabase();
        const today = new Date().toISOString().split('T')[0];

        const todayCheck = db.prepare(
            'SELECT * FROM daily_attendance WHERE check_date = ?'
        ).get(today);

        const streak = calculateStreak(db, todayCheck != null);

        // 총 포인트
        const totalPoints = db.prepare(
            'SELECT COALESCE(SUM(points), 0) as total FROM point_history'
        ).get().total;

        res.json({
            checked_today: !!todayCheck,
            current_streak: streak,
            total_points: totalPoints,
            checked_at: todayCheck?.checked_at || null
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/attendance/calendar — 최근 30일 출석 캘린더
router.get('/calendar', (req, res, next) => {
    try {
        const db = getDatabase();

        const records = db.prepare(
            `SELECT check_date, points_earned, streak_bonus
       FROM daily_attendance
       WHERE check_date >= date('now', '-30 days')
       ORDER BY check_date DESC`
        ).all();

        res.json(records);
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/attendance/points — 총 포인트 + 최근 이력
router.get('/points', (req, res, next) => {
    try {
        const db = getDatabase();

        const totalPoints = db.prepare(
            'SELECT COALESCE(SUM(points), 0) as total FROM point_history'
        ).get().total;

        const history = db.prepare(
            'SELECT * FROM point_history ORDER BY created_at DESC LIMIT 20'
        ).all();

        res.json({
            total_points: totalPoints,
            history
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
