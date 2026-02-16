// 대시보드 모듈 (FR-027~030)
// 학습 통계, 점수 추이 차트, 레벨 진행률, 시험 이력
const DashboardModule = {
  chart: null, // Chart.js 인스턴스

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
      const [stats, trends, sessions] = await Promise.all([
        apiGet('/dashboard/stats'),
        apiGet('/dashboard/trends'),
        apiGet('/exam/sessions')
      ]);

      if (stats.total_exams === 0) {
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

        // Chart.js 렌더링
        this.renderChart(canvas, trends);
      }

      // 레벨 진행률
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

      // 레벨 라벨
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

      // 최근 시험 이력
      if (sessions.length > 0) {
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
              }).catch(() => {});
            }
          });

          historySection.appendChild(item);
        });

        container.appendChild(historySection);
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
   * Chart.js 라인 차트 렌더링
   */
  renderChart(canvas, trends) {
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
