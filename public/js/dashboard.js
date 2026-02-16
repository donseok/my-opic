// 대시보드 모듈 (FR-027~030)
const DashboardModule = {
  chart: null, // Chart.js 인스턴스

  /**
   * 대시보드 화면 렌더링
   */
  async render(container) {
    container.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '학습 대시보드';
    container.appendChild(title);

    try {
      const [stats, trends, sessions] = await Promise.all([
        apiGet('/dashboard/stats'),
        apiGet('/dashboard/trends'),
        apiGet('/exam/sessions')
      ]);

      if (stats.total_exams === 0) {
        container.innerHTML += `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <p class="empty-state-text">아직 학습 데이터가 없습니다.<br>모의시험을 진행한 후 대시보드를 확인하세요.</p>
          </div>`;
        return;
      }

      // 통계 요약 카드
      const statsGrid = document.createElement('div');
      statsGrid.className = 'dashboard-stats';

      const statItems = [
        { label: '총 시험 횟수', value: stats.total_exams + '회' },
        { label: '최근 예상 등급', value: stats.latest_level || '-' },
        { label: '평균 문법', value: stats.avg_grammar + '점' },
        { label: '평균 유창성', value: stats.avg_fluency + '점' }
      ];

      statItems.forEach(s => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `<div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div>`;
        statsGrid.appendChild(card);
      });

      container.appendChild(statsGrid);

      // 점수 추이 차트
      if (trends.length > 0) {
        const chartSection = document.createElement('div');
        chartSection.className = 'dashboard-chart';
        chartSection.innerHTML = '<div class="chart-title">📈 점수 추이</div>';

        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        const canvas = document.createElement('canvas');
        canvas.id = 'score-chart';
        chartContainer.appendChild(canvas);
        chartSection.appendChild(chartContainer);
        container.appendChild(chartSection);

        // Chart.js 렌더링
        this.renderChart(canvas, trends);
      }

      // 레벨 진행률
      const levelProgress = document.createElement('div');
      levelProgress.className = 'dashboard-level-progress';
      levelProgress.innerHTML = '<div class="chart-title">🎯 레벨 진행률</div>';

      const allLevels = ['NL', 'NM', 'NH', 'IL', 'IM1', 'IM2', 'IM3', 'IH', 'AL'];
      const currentIdx = allLevels.indexOf(stats.current_level);
      const targetIdx = allLevels.indexOf(stats.target_level);
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
      labels.innerHTML = `
        <span>현재: ${stats.current_level || '-'}</span>
        <span style="color: var(--warning)">예상: ${stats.latest_level || '-'}</span>
        <span style="color: var(--accent)">목표: ${stats.target_level || '-'}</span>
      `;
      levelProgress.appendChild(labels);
      container.appendChild(levelProgress);

      // 최근 시험 이력
      if (sessions.length > 0) {
        const historySection = document.createElement('div');
        historySection.className = 'dashboard-history';
        historySection.innerHTML = '<div class="chart-title">📋 최근 시험 이력</div>';

        sessions.slice(0, 10).forEach(s => {
          const item = document.createElement('div');
          item.className = 'history-item';

          const date = new Date(s.started_at).toLocaleDateString('ko-KR');
          item.innerHTML = `
            <span class="history-date">${date}</span>
            <span class="history-level">${s.predicted_level || '-'}</span>
            <span class="history-scores">문법 ${s.grammar_score || '-'} · 유창성 ${s.fluency_score || '-'} · 어휘 ${s.vocabulary_score || '-'}</span>
          `;

          item.addEventListener('click', () => {
            if (s.predicted_level) {
              FeedbackModule.lastSessionId = s.id;
              apiGet(`/feedback/${s.id}`).then(fb => {
                FeedbackModule.lastFeedback = fb;
                window.location.hash = '#feedback';
              }).catch(() => {});
            }
          });

          historySection.appendChild(item);
        });

        container.appendChild(historySection);
      }

    } catch (err) {
      container.innerHTML += '<div class="empty-state"><p class="empty-state-text">데이터를 불러올 수 없습니다.</p></div>';
    }
  },

  /**
   * Chart.js 라인 차트 렌더링
   */
  renderChart(canvas, trends) {
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = trends.map((t, idx) => `시험 ${idx + 1}`);

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '문법',
            data: trends.map(t => t.grammar_score),
            borderColor: '#60A5FA',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            tension: 0.3,
            fill: false
          },
          {
            label: '유창성',
            data: trends.map(t => t.fluency_score),
            borderColor: '#2DD4BF',
            backgroundColor: 'rgba(45, 212, 191, 0.1)',
            tension: 0.3,
            fill: false
          },
          {
            label: '어휘',
            data: trends.map(t => t.vocabulary_score),
            borderColor: '#A78BFA',
            backgroundColor: 'rgba(167, 139, 250, 0.1)',
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
            labels: { color: '#94A3B8', font: { size: 12 } }
          },
          tooltip: {
            backgroundColor: '#1E293B',
            titleColor: '#F1F5F9',
            bodyColor: '#F1F5F9',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#64748B' },
            grid: { color: 'rgba(51, 65, 85, 0.3)' }
          },
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#64748B' },
            grid: { color: 'rgba(51, 65, 85, 0.3)' }
          }
        }
      }
    });
  }
};
