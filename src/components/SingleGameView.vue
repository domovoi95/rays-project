<template>
  <div class="game-details-container">
    <h2>Game Details</h2>

    <div class="game-info">

      <div class="game-header">
        <h3>{{ formatDate(game.date) }}</h3>
        <p class="series-info">{{ game.seriesDescription }}</p>
      </div>

      <div class="pitchers-row">
        <div class="pitcher-container">
          <div class="team-name">{{ game.isHome ? raysOrg.name : game.opponent }}</div>
          <div class="pitcher-image-container">
            <img
                v-if="game.raysPitcherId"
                :src="`https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${game.raysPitcherId}/headshot/67/current`"
                :alt="game.raysPitcher || 'Starting pitcher'"
                class="pitcher-image"
                @error="handleImageError"
            >
            <img
                v-else
                src="https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/undefined/headshot/67/current"
                alt="Pitcher image not available"
                class="pitcher-image"
            >
          </div>
          <div class="pitcher-info">
            <div class="pitcher-name">{{ game.raysPitcher || 'TBD' }}</div>
            <div class="pitcher-subtitle">Starting Pitcher</div>
          </div>
        </div>

        <div class="vs">vs</div>

        <div class="pitcher-container">
          <div class="team-name">{{ game.isHome ? game.opponent : raysOrg.name }}</div>
          <div class="pitcher-image-container">
            <img
                v-if="game.opposingPitcherId"
                :src="`https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${game.opposingPitcherId}/headshot/67/current`"
                :alt="game.opposingPitcher || 'Opponent starting pitcher'"
                class="pitcher-image"
                @error="handleImageError"
            >
            <img
                v-else0
                src="https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/undefined/headshot/67/current"
                alt="Pitcher image not available"
                class="pitcher-image"
            >
          </div>
          <div class="pitcher-info">
            <div class="pitcher-name">{{ game.opposingPitcher || 'TBD' }}</div>
            <div class="pitcher-subtitle">Starting Pitcher</div>
          </div>
        </div>
      </div>

      <div class="game-result">
        <h3>Final Score: {{ game.score }}</h3>
        <p v-if="game.status === 'Final'" class="outcome">
          Result:
          <span :class="{
            'win-box': game.raysWon && !game.isTie,
            'loss-box': !game.raysWon && !game.isTie,
            'tie-box': game.isTie
          }">
            {{ game.raysWon && !game.isTie ? raysOrg.teamShort + ' Win' :
              !game.raysWon && !game.isTie ? raysOrg.teamShort + ' Loss' : 'Tie' }}
          </span>
        </p>
        <p v-else>Status: {{ game.status }}</p>
      </div>

      <h3 v-if="linescore" class="linescore-title">Linescore</h3>
      <div v-if="linescore" class="linescore-container">
        <div class="linescore-wrapper">
          <table class="linescore-table">
            <thead>
            <tr>
              <th class="team-cell"></th>
              <th
                  v-for="inning in linescore.innings"
                  :key="inning.num"
                  class="inning-header"
              >
                {{ inning.num }}
              </th>
              <th class="total-header">R</th>
              <th class="total-header">H</th>
              <th class="total-header">E</th>
            </tr>
            </thead>
            <tbody>
            <tr class="team-row">
              <td class="team-cell away-team">
                {{ game.isHome ? game.opponent : raysOrg.name }}
              </td>
              <td
                  v-for="inning in linescore.innings"
                  :key="'away-' + inning.num"
                  class="inning-cell"
              >
                {{ inning.away.runs }}
              </td>
              <td class="total-cell">{{ linescore.teams.away.runs }}</td>
              <td class="total-cell">{{ linescore.teams.away.hits }}</td>
              <td class="total-cell">{{ linescore.teams.away.errors }}</td>
            </tr>
            <tr class="team-row">
              <td class="team-cell home-team">
                {{ game.isHome ? raysOrg.name : game.opponent }}
              </td>
              <td
                  v-for="inning in linescore.innings"
                  :key="'home-' + inning.num"
                  class="inning-cell"
              >
                {{ inning.home.runs }}
              </td>
              <td class="total-cell">{{ linescore.teams.home.runs }}</td>
              <td class="total-cell">{{ linescore.teams.home.hits }}</td>
              <td class="total-cell">{{ linescore.teams.home.errors }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="loadingLinescore" class="loading-linescore">
        Loading linescore...
      </div>
      <div v-else-if="linescoreError" class="error-linescore">
        {{ linescoreError }}
      </div>

      <div v-if="game.raysPitcherStats || game.opposingPitcherStats" class="stats-comparison">
        <h3>Starting Pitching Comparison</h3>
        <div class="comparison-table">
          <div class="comparison-row header">
            <div class="pitcher-stat rays">{{ raysOrg.name }}</div>
            <div class="stat-name"></div>
            <div class="pitcher-stat opponent">{{ game.opponent }}</div>
          </div>

          <div v-for="stat in displayedStats" :key="stat.key" class="comparison-row">
            <div class="pitcher-stat rays">
              {{ formatStat(game.raysPitcherStats, stat.key) }}
            </div>
            <div class="stat-name">{{ stat.displayName }}</div>
            <div class="pitcher-stat opponent">
              {{ formatStat(game.opposingPitcherStats, stat.key) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SingleGameView',
  props: {
    game: {
      type: Object,
      required: true,
      default: () => ({
        isHome: false,
        raysPitcher: null,
        raysPitcherId: null,
        raysPitcherStats: null,
        opposingPitcher: null,
        opposingPitcherId: null,
        opposingPitcherStats: null,
        status: '',
        score: '',
        date: '',
        seriesDescription: '',
        opponent: '',
        gamePk: null,
        raysWon: false,
        isTie: false
      })
    },
    raysOrg: {
      type: Object,
      required: true,
      default: () => ({
        id: 139,
        name: 'Tampa Bay Rays',
        sportId: 1,
        teamShort: 'Rays'
      })
    }
  },
  data() {
    return {
      linescore: null,
      loadingLinescore: false,
      linescoreError: null,
      displayedStats: [
        { key: 'inningsPitched', displayName: 'IP' },
        { key: 'era', displayName: 'ERA' },
        { key: 'numberOfPitches', displayName: 'Pitches' },
        { key: 'strikes', displayName: 'Strikes' },
        { key: 'balls', displayName: 'Balls' },
        { key: 'strikeOuts', displayName: 'SO' },
        { key: 'baseOnBalls', displayName: 'BB' },
        { key: 'hits', displayName: 'Hits' },
        { key: 'earnedRuns', displayName: 'ER' },
        { key: 'homeRuns', displayName: 'HR' }
      ]
    }
  },
  methods: {
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString + "T00:00:00").toDateString(undefined, options);
    },
    formatStat(stats, key) {
      if (!stats || stats[key] === undefined || stats[key] === null) return '-';
      if (key === 'era') return stats[key];
      if (key === 'inningsPitched') return stats[key];
      return Number.isInteger(stats[key]) ? stats[key] : parseFloat(stats[key]).toFixed(1);
    },
    handleImageError(event) {
      event.target.src = 'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/undefined/headshot/67/current';
    },
    async fetchLinescore() {
      if (!this.game.gamePk) return;

      this.loadingLinescore = true;
      this.linescoreError = null;

      try {
        const response = await fetch(
            `https://statsapi.mlb.com/api/v1/game/${this.game.gamePk}/linescore`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        this.linescore = await response.json();
      } catch (err) {
        this.linescoreError = `Failed to fetch linescore: Please try again later or contact the Baseball Systems Applications team at totallyrealemail@raysbaseball.com`;
        console.error('Error fetching linescore:', err);
      } finally {
        this.loadingLinescore = false;
      }
    }
  },
  mounted() {
    this.fetchLinescore();
  }
};
</script>

<style scoped>
.game-details-container {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: 20px;
}

.game-header {
  margin-bottom: 20px;
}

.series-info {
  font-style: italic;
  color: #666;
}

.pitchers-row {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  margin: 30px 0;
  flex-wrap: wrap;
}

.pitcher-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
}

.team-name {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
}

.pitcher-image-container {
  width: 120px;
  height: 160px;
  margin-bottom: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pitcher-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pitcher-info {
  text-align: center;
}

.pitcher-name {
  font-weight: 500;
  font-size: 1.1rem;
}

.pitcher-subtitle {
  color: #666;
  font-size: 0.9rem;
}

.vs {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  align-self: center;
  margin: 0 10px;
}

.game-result {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.outcome span {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.win-box {
  background-color: rgba(46, 125, 50, 0.2);
  color: #2e7d32;
}

.loss-box {
  background-color: rgba(198, 40, 40, 0.2);
  color: #c62828;
}

.tie-box {
  background-color: rgba(255, 143, 0, 0.2);
  color: #ff8f00;
}

.linescore-container {
  margin: 30px auto 0;
  max-width: 800px;
  padding: 0 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.linescore-title {
  text-align: center;
  margin-bottom: 15px;
  color: #333;
  font-size: 1.5rem;
}

.linescore-wrapper {
  display: inline-block;
  justify-content: center;
  overflow-x: auto;
  padding: 10px 0;
  position: relative;
}

.linescore-table {
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

.inning-header{
  background-color: #092C5C;
  color: white;
  padding: 8px 12px;
  font-weight: 500;
  text-align: center;
  min-width: 36px;
}

.total-header {
  background-color: #1D428A;
  color: white;
  padding: 8px 12px;
  font-weight: 500;
  text-align: center;
  min-width: 36px;
}

.team-cell {
  padding: 10px 15px;
  text-align: left;
  font-weight: bold;
  background-color: #f8f8f8;
  white-space: nowrap;
}

.away-team {
  border-right: 2px solid #e0e0e0;
}

.home-team {
  border-right: 2px solid #e0e0e0;
  border-top: 1px solid #e0e0e0;
}

.inning-cell {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.total-cell {
  padding: 10px 12px;
  text-align: center;
  font-weight: bold;
  background-color: #f8f8f8;
}

.stats-comparison {
  margin-top: 30px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comparison-table {
  display: flex;
  flex-direction: column;
  margin-top: 15px;
}

.comparison-row {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.comparison-row.header {
  font-weight: bold;
  background-color: #f5f5f5;
}

.pitcher-stat {
  flex: 1;
  padding: 0 10px;
}

.rays {
  color: #092C5C;
  font-weight: 500;
}

.opponent {
  color: #7F0028;
  font-weight: 500;
}

.stat-name {
  flex: 1;
  padding: 0 10px;
}

.loading-linescore{
  margin-top: 15px;
  padding: 10px;
  text-align: center;
}

.error-linescore {
  color: #c62828;
  background-color: rgba(198, 40, 40, 0.1);
  margin-top: 15px;
  padding: 10px;
  text-align: center;
}

@media (max-width: 680px) {
  .pitchers-row {
    gap: 20px;
  }

  .pitcher-container {
    min-width: 160px;
  }

  .pitcher-image-container {
    width: 100px;
    height: 140px;
  }

  .pitchers-row {
    flex-direction: column;
    align-items: normal;
    gap: 10px;
  }

  .pitcher-image-container {
    width: 80px;
    height: 120px;
  }

  .vs {
    margin: 10px 0;
  }

  .inning-header, .total-header {
    padding: 6px 8px;
    min-width: 26px;
    font-size: 0.8rem;
  }

  .team-cell {
    padding: 6px 8px;
    font-size: 0.8rem;
  }

  .inning-cell, .total-cell {
    padding: 6px 8px;
  }
}
</style>