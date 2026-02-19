// 대시보드 모듈 — 학습 통계, 레이더 차트, 스트릭, 학습시간, 점수 추이
const DashboardModule = {
  chart: null,
  radarChart: null,

  /**
   * 대시보드 화면 렌더링
   */
  async render(container) {
    container.replaceChildren();

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '학습 대시보드';
    container.appendChild(title);

    try {
      const [stats, trends, sessions, skills, streak, weekly, attendance] = await Promise.all([
        apiGet('/dashboard/stats'),
        apiGet('/dashboard/trends'),
        apiGet('/exam/sessions'),
        apiGet('/dashboard/skills').catch(() => null),
        apiGet('/dashboard/streak').catch(() => null),
        apiGet('/dashboard/weekly').catch(() => null),
        apiGet('/attendance/status').catch(() => null)
      ]);

      // 출석 체크 카드 (항상 최상단에 표시)
      this.renderAttendanceCard(container, attendance);

      if (stats.total_exams === 0 && (!streak || streak.current_streak === 0)) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        const emptyIcon = document.createElement('div');
        emptyIcon.className = 'empty-state-icon';
        emptyIcon.textContent = '📊';
        const emptyText = document.createElement('p');
        emptyText.className = 'empty-state-text';
        emptyText.textContent = '아직 학습 데이터가 없습니다. 모의시험을 진행한 후 대시보드를 확인하세요.';
        empty.appendChild(emptyIcon);
        empty.appendChild(emptyText);
        container.appendChild(empty);
        return;
      }

      // 스트릭 + 주간 요약
      if (streak || weekly) {
        this.renderStreakSection(container, streak, weekly);
      }

      // 통계 요약 카드
      const statsGrid = document.createElement('div');
      statsGrid.className = 'dashboard-stats';

      const statItems = [
        { label: '총 시험 횟수', value: stats.total_exams + '회' },
        { label: '최근 예상 등급', value: stats.latest_level || '-' },
        { label: '평균 문법', value: stats.avg_grammar + '점' },
        { label: '평균 유창성', value: stats.avg_fluency + '점' },
        { label: '평균 어휘', value: stats.avg_vocabulary + '점' }
      ];

      statItems.forEach(s => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        const valDiv = document.createElement('div');
        valDiv.className = 'stat-value';
        valDiv.textContent = s.value;
        const lblDiv = document.createElement('div');
        lblDiv.className = 'stat-label';
        lblDiv.textContent = s.label;
        card.appendChild(valDiv);
        card.appendChild(lblDiv);
        statsGrid.appendChild(card);
      });

      container.appendChild(statsGrid);

      // 5축 스킬 레이더 차트
      if (skills && (skills.this_week.grammar > 0 || skills.last_week.grammar > 0)) {
        this.renderRadarChart(container, skills);
      }

      // 점수 추이 차트
      if (trends.length > 0) {
        const chartSection = document.createElement('div');
        chartSection.className = 'dashboard-chart';
        const chartTitle = document.createElement('div');
        chartTitle.className = 'chart-title';
        chartTitle.textContent = '📈 점수 추이';
        chartSection.appendChild(chartTitle);

        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        const canvas = document.createElement('canvas');
        canvas.id = 'score-chart';
        chartContainer.appendChild(canvas);
        chartSection.appendChild(chartContainer);
        container.appendChild(chartSection);

        this.renderLineChart(canvas, trends);
      }

      // 히트맵 캘린더
      if (streak && streak.heatmap) {
        this.renderHeatmap(container, streak.heatmap);
      }

      // 레벨 진행률
      this.renderLevelProgress(container, stats);

      // 최근 시험 이력
      if (sessions.length > 0) {
        this.renderHistory(container, sessions);
      }

    } catch (err) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const p = document.createElement('p');
      p.className = 'empty-state-text';
      p.textContent = '데이터를 불러올 수 없습니다.';
      empty.appendChild(p);
      container.appendChild(empty);
    }
  },

  /**
   * 스트릭 + 주간 요약 섹션
   */
  renderStreakSection(container, streak, weekly) {
    const section = document.createElement('div');
    section.className = 'dashboard-streak';

    const header = document.createElement('div');
    header.className = 'streak-header';

    const titleDiv = document.createElement('div');
    const streakTitle = document.createElement('div');
    streakTitle.className = 'chart-title';
    streakTitle.textContent = '🔥 학습 스트릭';
    titleDiv.appendChild(streakTitle);

    const countDiv = document.createElement('div');
    const count = document.createElement('span');
    count.className = 'streak-count';
    count.textContent = (streak?.current_streak || 0) + '일';
    const label = document.createElement('div');
    label.className = 'streak-label';
    label.textContent = '연속 학습';
    countDiv.appendChild(count);
    countDiv.appendChild(label);

    header.appendChild(titleDiv);
    header.appendChild(countDiv);
    section.appendChild(header);

    // 주간 요약
    if (weekly) {
      const weeklyGrid = document.createElement('div');
      weeklyGrid.className = 'weekly-stats';

      const items = [
        { label: '이번 주 학습', value: Math.round((weekly.study_time_seconds || 0) / 60) + '분' },
        { label: '시험 횟수', value: (weekly.exam_count || 0) + '회' },
        { label: '완료 태스크', value: (weekly.completed_tasks || 0) + '개' },
        { label: '전체 태스크', value: (weekly.total_tasks || 0) + '개' }
      ];

      items.forEach(item => {
        const stat = document.createElement('div');
        stat.className = 'weekly-stat';
        const val = document.createElement('div');
        val.className = 'weekly-stat-value';
        val.textContent = item.value;
        const lbl = document.createElement('div');
        lbl.className = 'weekly-stat-label';
        lbl.textContent = item.label;
        stat.appendChild(val);
        stat.appendChild(lbl);
        weeklyGrid.appendChild(stat);
      });

      section.appendChild(weeklyGrid);
    }

    container.appendChild(section);
  },

  /**
   * 5축 스킬 레이더 차트
   */
  renderRadarChart(container, skills) {
    const section = document.createElement('div');
    section.className = 'dashboard-radar';
    const title = document.createElement('div');
    title.className = 'chart-title';
    title.textContent = '🎯 스킬 레이더 (이번주 vs 지난주)';
    section.appendChild(title);

    const chartContainer = document.createElement('div');
    chartContainer.className = 'radar-container';
    const canvas = document.createElement('canvas');
    canvas.id = 'radar-chart';
    chartContainer.appendChild(canvas);
    section.appendChild(chartContainer);
    container.appendChild(section);

    if (this.radarChart) this.radarChart.destroy();

    this.radarChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Grammar', 'Vocabulary', 'Fluency', 'Pronunciation', 'Organization'],
        datasets: [
          {
            label: '이번 주',
            data: [
              skills.this_week.grammar,
              skills.this_week.vocabulary,
              skills.this_week.fluency,
              skills.this_week.pronunciation,
              skills.this_week.organization
            ],
            borderColor: '#0284C7',
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            pointBackgroundColor: '#0284C7',
            borderWidth: 2
          },
          {
            label: '지난 주',
            data: [
              skills.last_week.grammar,
              skills.last_week.vocabulary,
              skills.last_week.fluency,
              skills.last_week.pronunciation,
              skills.last_week.organization
            ],
            borderColor: '#94A3B8',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            pointBackgroundColor: '#94A3B8',
            borderWidth: 1,
            borderDash: [4, 4]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: '#94A3B8',
              backdropColor: 'transparent'
            },
            grid: {
              color: 'rgba(226, 232, 240, 0.5)'
            },
            pointLabels: {
              color: '#475569',
              font: { size: 12 }
            }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#475569', font: { size: 12 } }
          }
        }
      }
    });
  },

  /**
   * 히트맵 캘린더
   */
  renderHeatmap(container, heatmapData) {
    const section = document.createElement('div');
    section.className = 'dashboard-chart';
    const title = document.createElement('div');
    title.className = 'chart-title';
    title.textContent = '📅 학습 캘린더 (최근 12주)';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';

    // 최근 84일 셀 생성
    const today = new Date();
    const dataMap = {};
    heatmapData.forEach(h => { dataMap[h.date] = h.minutes; });

    // 요일 라벨 행 (일~토 시작점 맞추기)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83);
    // 시작일의 요일에 맞춰 빈 셀 추가
    const startDay = startDate.getDay();
    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement('div');
      empty.style.visibility = 'hidden';
      grid.appendChild(empty);
    }

    for (let i = 0; i < 84; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const minutes = dataMap[dateStr] || 0;

      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      if (minutes > 0 && minutes <= 15) cell.classList.add('level-1');
      else if (minutes > 15 && minutes <= 45) cell.classList.add('level-2');
      else if (minutes > 45) cell.classList.add('level-3');

      if (dateStr === today.toISOString().split('T')[0]) {
        cell.classList.add('today');
      }

      cell.title = dateStr + ': ' + minutes + '분';
      grid.appendChild(cell);
    }

    section.appendChild(grid);

    // 범례
    const labels = document.createElement('div');
    labels.className = 'heatmap-labels';
    labels.innerHTML = '<span>적음</span><span style="display:flex;gap:3px;align-items:center;"><span class="heatmap-cell level-1" style="width:12px;height:12px;display:inline-block;"></span><span class="heatmap-cell level-2" style="width:12px;height:12px;display:inline-block;"></span><span class="heatmap-cell level-3" style="width:12px;height:12px;display:inline-block;"></span></span><span>많음</span>';
    section.appendChild(labels);

    container.appendChild(section);
  },

  /**
   * 레벨 진행률
   */
  renderLevelProgress(container, stats) {
    const levelProgress = document.createElement('div');
    levelProgress.className = 'dashboard-level-progress';
    const levelTitle = document.createElement('div');
    levelTitle.className = 'chart-title';
    levelTitle.textContent = '🎯 레벨 진행률';
    levelProgress.appendChild(levelTitle);

    const allLevels = ['NL', 'NM', 'NH', 'IL', 'IM1', 'IM2', 'IM3', 'IH', 'AL'];
    const currentIdx = allLevels.indexOf(stats.current_level);
    const predictedIdx = allLevels.indexOf(stats.latest_level);

    const progressBar = document.createElement('div');
    progressBar.className = 'level-progress-bar';

    allLevels.forEach((lv, idx) => {
      const dot = document.createElement('div');
      dot.className = 'level-dot';
      if (idx <= currentIdx) dot.classList.add('filled');
      if (idx === predictedIdx) dot.classList.add('predicted');
      dot.title = lv;
      progressBar.appendChild(dot);
    });

    levelProgress.appendChild(progressBar);

    const labels = document.createElement('div');
    labels.className = 'level-progress-labels';

    const currentLabel = document.createElement('span');
    currentLabel.textContent = '현재: ' + (stats.current_level || '-');
    const predictedLabel = document.createElement('span');
    predictedLabel.style.color = 'var(--warning)';
    predictedLabel.textContent = '예상: ' + (stats.latest_level || '-');
    const targetLabel = document.createElement('span');
    targetLabel.style.color = 'var(--accent)';
    targetLabel.textContent = '목표: ' + (stats.target_level || '-');

    labels.appendChild(currentLabel);
    labels.appendChild(predictedLabel);
    labels.appendChild(targetLabel);
    levelProgress.appendChild(labels);
    container.appendChild(levelProgress);
  },

  /**
   * 시험 이력
   */
  renderHistory(container, sessions) {
    const historySection = document.createElement('div');
    historySection.className = 'dashboard-history';
    const historyTitle = document.createElement('div');
    historyTitle.className = 'chart-title';
    historyTitle.textContent = '📋 최근 시험 이력';
    historySection.appendChild(historyTitle);

    sessions.slice(0, 10).forEach(s => {
      const item = document.createElement('div');
      item.className = 'history-item';

      const date = new Date(s.started_at).toLocaleDateString('ko-KR');
      const dateSpan = document.createElement('span');
      dateSpan.className = 'history-date';
      dateSpan.textContent = date;

      const levelSpan = document.createElement('span');
      levelSpan.className = 'history-level';
      levelSpan.textContent = s.predicted_level || '-';

      const scoresSpan = document.createElement('span');
      scoresSpan.className = 'history-scores';
      scoresSpan.textContent = '문법 ' + (s.grammar_score || '-') + ' · 유창성 ' + (s.fluency_score || '-') + ' · 어휘 ' + (s.vocabulary_score || '-');

      item.appendChild(dateSpan);
      item.appendChild(levelSpan);
      item.appendChild(scoresSpan);

      item.addEventListener('click', () => {
        if (s.predicted_level) {
          FeedbackModule.lastSessionId = s.id;
          apiGet('/feedback/' + s.id).then(fb => {
            FeedbackModule.lastFeedback = fb;
            window.location.hash = '#feedback';
          }).catch(() => {
                showToast('피드백을 불러올 수 없습니다', 'error');
              });
        }
      });

      historySection.appendChild(item);
    });

    container.appendChild(historySection);
  },

  /**
   * Chart.js 라인 차트 렌더링
   */
  renderLineChart(canvas, trends) {
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = trends.map((t, idx) => '시험 ' + (idx + 1));

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '문법',
            data: trends.map(t => t.grammar_score),
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.3,
            fill: false
          },
          {
            label: '유창성',
            data: trends.map(t => t.fluency_score),
            borderColor: '#0284C7',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            tension: 0.3,
            fill: false
          },
          {
            label: '어휘',
            data: trends.map(t => t.vocabulary_score),
            borderColor: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            tension: 0.3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#475569', font: { size: 12 } }
          },
          tooltip: {
            backgroundColor: '#FFFFFF',
            titleColor: '#0F172A',
            bodyColor: '#0F172A',
            borderColor: '#E2E8F0',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#94A3B8' },
            grid: { color: 'rgba(226, 232, 240, 0.5)' }
          },
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#94A3B8' },
            grid: { color: 'rgba(226, 232, 240, 0.5)' }
          }
        }
      }
    });
  },

  /**
   * 출석 체크 카드 렌더링
   */
  async renderAttendanceCard(container, attendance) {
    const card = document.createElement('div');
    card.className = 'attendance-card' + (attendance?.checked_today ? ' checked' : '');

    // 왼쪽: 제목 + 스트릭
    const left = document.createElement('div');
    left.className = 'attendance-left';

    const titleEl = document.createElement('div');
    titleEl.className = 'attendance-title';
    titleEl.textContent = attendance?.checked_today ? '✅ 출석 완료!' : '🔥 오늘의 출석 체크';
    left.appendChild(titleEl);

    const streakEl = document.createElement('div');
    streakEl.className = 'attendance-streak';
    streakEl.textContent = (attendance?.current_streak || 0) + '일 연속 학습 중';
    left.appendChild(streakEl);

    // 미니 캘린더 (최근 7일)
    const miniCal = document.createElement('div');
    miniCal.className = 'attendance-mini-calendar';
    try {
      const calendar = await apiGet('/attendance/calendar');
      const calDates = calendar.map(c => c.check_date);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dateStr = d.toISOString().split('T')[0];
        const dot = document.createElement('div');
        dot.className = 'day-dot' + (calDates.includes(dateStr) ? ' active' : '');
        dot.title = dateStr;
        miniCal.appendChild(dot);
      }
    } catch {
      // 캘린더 로드 실패해도 카드는 표시
    }
    left.appendChild(miniCal);
    card.appendChild(left);

    // 오른쪽: 포인트 + 체크인 버튼
    const right = document.createElement('div');
    right.className = 'attendance-right';

    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'attendance-points';
    const pointsVal = document.createElement('div');
    pointsVal.className = 'points-value';
    pointsVal.textContent = (attendance?.total_points || 0);
    const pointsLbl = document.createElement('div');
    pointsLbl.className = 'points-label';
    pointsLbl.textContent = '포인트';
    pointsDiv.appendChild(pointsVal);
    pointsDiv.appendChild(pointsLbl);
    right.appendChild(pointsDiv);

    const btn = document.createElement('button');
    btn.className = 'check-in-btn' + (attendance?.checked_today ? ' checked' : '');
    btn.textContent = attendance?.checked_today ? '체크 완료 ✓' : '출석 체크';
    btn.disabled = attendance?.checked_today;

    if (!attendance?.checked_today) {
      btn.addEventListener('click', async () => {
        try {
          btn.disabled = true;
          btn.textContent = '체크 중...';
          const result = await apiPost('/attendance/check-in');

          // 성공 애니메이션
          card.classList.add('checked');
          btn.className = 'check-in-btn checked';
          btn.textContent = '체크 완료 ✓';
          titleEl.textContent = '✅ 출석 완료!';
          streakEl.textContent = result.current_streak + '일 연속 학습 중';
          pointsVal.textContent = (attendance?.total_points || 0) + result.total_today;

          // 포인트 팝업 애니메이션
          const popup = document.createElement('div');
          popup.className = 'points-popup';
          popup.textContent = '+' + result.total_today + 'pt';
          if (result.streak_bonus > 0) {
            popup.textContent += ' (보너스 +' + result.streak_bonus + ')';
          }
          document.body.appendChild(popup);
          setTimeout(() => popup.remove(), 1600);

          showToast('출석 체크 완료! +' + result.total_today + 'pt', 'success');
        } catch (err) {
          btn.disabled = false;
          btn.textContent = '출석 체크';
          showToast(err.message || '출석 체크 실패', 'error');
        }
      });
    }

    right.appendChild(btn);
    card.appendChild(right);
    container.appendChild(card);
  }
};
