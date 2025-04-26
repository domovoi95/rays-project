<template>
  <div class="table-container">
    <h1>Tampa Bay Rays Game History</h1>

    <div v-if="!selectedGame" class="controls">
      <span class="left-filter-container">
      <v-label class="left-filter-label">Hide Spring Training Games</v-label>
      <v-switch
          v-model="hideSpringTraining"
          density="compact"
          hide-details
          class="left-filter"
      ></v-switch>
      </span>

      <v-select
          v-model="selectedTeam"
          :items="teamOptions"
          item-title="name"
          item-value="id"
          label="Select Team"
          dense
          outlined
          return-object
          class="filter-select"
      ></v-select>

      <v-select
          v-model="selectedOutcome"
          :items="outcomeOptions"
          item-title="text"
          item-value="value"
          label="Game Outcome"
          clearable
          dense
          outlined
          return-object
          class="filter-select"
      ></v-select>

      <v-combobox
          v-model="selectedPitcher"
          :items="raysPitchers"
          label="Starting Pitcher"
          clearable
          dense
          outlined
          class="filter-select"
      ></v-combobox>

      <v-combobox
          v-model="selectedOpponents"
          :items="opponents"
          label="Opponent"
          multiple
          clearable
          dense
          outlined
          class="filter-select"
      >
        <template v-slot:selection="{index}" v-if="selectedOpponents.length > 1">
          <span v-if="index === 0">
          {{ selectedOpponents.length }} Teams Selected
          </span>
        </template>
      </v-combobox>

      <v-btn
          @click="clearAllFilters"
          color="secondary"
          variant="outlined"
          class="reset-button"
      >
        Reset Filters
      </v-btn>
    </div>

    <!-- I'd love to add a spinning baseball while loading, but i'm running out of time and load times are short as is-->
    <div v-if="loading">Loading data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="selectedGame" class="game-details-view">
      <v-btn @click="selectedGame = null" color="primary">
        Back to Game List
      </v-btn>

      <single-game-view :game="selectedGame" :raysOrg = "selectedTeam" />
    </div>
    <div v-else-if="filteredData.length > 0">
      <v-table>
        <thead>
        <tr>
          <th @click="sortBy('date')">
            Date
            <v-icon v-if="sortKey === 'date'">
              {{ sortOrder === 1 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </th>
          <th @click="sortBy('opponent')">
            Opponent
            <v-icon v-if="sortKey === 'opponent'">
              {{ sortOrder === 1 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </th>
          <th class="no-sort">Score</th>
          <th @click="sortBy('raysPitcher')">
            SP
            <v-icon v-if="sortKey === 'raysPitcher'">
              {{ sortOrder === 1 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </th>
          <th @click="sortBy('opposingPitcher')">
            Opponent SP
            <v-icon v-if="sortKey === 'opposingPitcher'">
              {{ sortOrder === 1 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="(game, index) in sortedData"
            :key="index"
            :class="{
              'win-row': game.raysWon && game.status === 'Final',
              'loss-row': !game.raysWon && !game.isTie && game.status === 'Final',
              'tie-row': game.isTie
            }"
        >
          <td @click="openGameView(game)" class="clickable-date">
            {{ formatDate(game.date) }}
          </td>
          <td> <span v-if="!game.isHome">@</span>{{ game.opponent }}</td>
          <td>{{ game.score }}</td>
          <td>{{ game.raysPitcher?.fullName || game.raysPitcher || 'TBD' }}</td>
          <td>{{ game.opposingPitcher?.fullName || game.opposingPitcher || 'TBD' }}</td>
        </tr>
        </tbody>
      </v-table>
    </div>
    <div v-else>No games found matching your filters.</div>
  </div>
</template>

<script>
import SingleGameView from "@/components/SingleGameView.vue";

export default {
  name: 'GameHistoryTable',
  components: {
    SingleGameView
  },
  data() {
    return {
      data: null,
      loading: false,
      error: null,
      hideSpringTraining: false,
      selectedOutcome: null,
      selectedPitcher: null,
      selectedOpponents: [],
      sortKey: 'date',
      sortOrder: 1,
      selectedGame: null,
      selectedTeam: { id: 139, name: 'Tampa Bay Rays', sportId: 1, teamShort: 'Rays' },
      startDate: '2025-03-01',
      endDate: new Date().toISOString().split('T')[0],
      // If this were a full application, I would likely pull team info from a database. In this case, we'll hard code it for ease of access
      // If this application were used by more than the MLB club, i'd also add a login and store user preference for which org level loads first
      teamOptions: [
        { id: 139, name: 'Tampa Bay Rays', sportId: 1, teamShort: 'Rays' },
        { id: 234, name: 'Durham Bulls', sportId: 11, teamShort: 'Bulls' },
        { id: 421, name: 'Montgomery Biscuits', sportId: 12, teamShort: 'Biscuits' },
        { id: 2498, name: 'Bowling Green Hot Rods', sportId: 13, teamShort: 'Hot Rods' },
        { id: 233, name: 'Charleston RiverDogs', sportId: 14, teamShort: 'RiverDogs' },
        { id: 2003, name: 'FCL Rays', sportId: 16, teamShort: 'Rays' },
        { id: 1611, name: 'DSL Rays', sportId: 16, teamShort: 'Rays' },
        { id: 5086, name: 'DSL Tampa Bay', sportId: 16, teamShort: 'Tampa Bay' }
      ],
      outcomeOptions: [
        { text: 'Won', value: 'win' },
        { text: 'Lost', value: 'loss' },
        { text: 'Tied', value: 'tie' }
      ]
    }
  },
  watch: {
    selectedTeam() {
      this.fetchData();
    }
  },
  computed: {
    selectedTeamId() {
      return this.selectedTeam.id;
    },
    selectedSportId() {
      return this.selectedTeam.sportId;
    },
    tableData() {
      if (!this.data) return [];

      return this.data.dates.flatMap(date => {
        return date.games.map(game => {
          const isHome = game.teams.home.team.id === this.selectedTeamId;
          const homeTeam = game.teams.home;
          const awayTeam = game.teams.away;

          const raysTeam = isHome ? homeTeam : awayTeam;
          const opponentTeam = isHome ? awayTeam : homeTeam;
          const gamePk = game.gamePk;

          const homeScore = homeTeam.score;
          const awayScore = awayTeam.score;
          const score = (homeScore != null && awayScore != null) ? `${awayScore}-${homeScore}` : "TBD";

          const getPitcherStats = (pitcher) => {
            if (!pitcher) return null;

            const pitchingStats = pitcher.stats?.find(
                s => s.group?.displayName === 'pitching' && s.type?.displayName === 'gameLog'
            );

            return {
              id: pitcher.id,
              fullName: pitcher.fullName,
              stats: pitchingStats?.stats || null
            };
          };

          const raysPitcher = getPitcherStats(raysTeam.probablePitcher);
          const opposingPitcher = getPitcherStats(opponentTeam.probablePitcher);

          let raysWon = false;
          let isTie = game.isTie || false;

          if (game.status.abstractGameState === 'Final') {
            raysWon = raysTeam.isWinner;
            isTie = game.isTie || (homeTeam.score === awayTeam.score);
          }

          return {
            date: date.date,
            opponent: opponentTeam.team.name,
            score,
            raysPitcher: raysPitcher?.fullName || raysPitcher || null,
            raysPitcherId: raysPitcher?.id || null,
            raysPitcherStats: raysPitcher?.stats || null,
            opposingPitcher: opposingPitcher?.fullName || opposingPitcher || null,
            opposingPitcherId: opposingPitcher?.id || null,
            opposingPitcherStats: opposingPitcher?.stats || null,
            raysWon,
            isTie,
            isHome,
            status: game.status.abstractGameState,
            seriesDescription: game.seriesDescription,
            gamePk
          };
        });
      });
    },
    raysPitchers() {
      if (!this.tableData) return [];
      const pitchers = new Set();
      this.tableData.forEach(game => {
        if (game.raysPitcher) {
          pitchers.add(game.raysPitcher);
        }
      });
      return Array.from(pitchers).sort((a, b) => a.localeCompare(b));
    },
    // I was considering adding all 30 MLB teams to this, but I would either have to load and filter through the teams API or hard code it. This implementation ended up working with no additional logic for the minor league teams which was really cool
    opponents() {
      if (!this.tableData) return [];
      const opponentSet = new Set();
      this.tableData.forEach(game => {
        opponentSet.add(game.opponent);
      });
      return Array.from(opponentSet).sort((a, b) => a.localeCompare(b));
    },
    filteredData() {
      if (!this.tableData) return [];

      return this.tableData.filter(game => {

        // Games after today are already filtered out, but this filters out today's game if it hasn't started yet as it's technically 'in the future' per the requirements. Once games have started, they will pass this check
        if(game.status === "Preview"){
          return false;
        }
        // Spring training filter
        if (this.hideSpringTraining && game.seriesDescription === "Spring Training") {
          return false;
        }

        // Outcome Filter
        if (this.selectedOutcome !== null) {
          // Games that are not completed do not have an outcome
          if (game.status !== 'Final') return false;

          if (this.selectedOutcome.value === 'win' && !(game.raysWon && !game.isTie)) return false;
          if (this.selectedOutcome.value === 'loss' && !(!game.raysWon && !game.isTie)) return false;
          if (this.selectedOutcome.value === 'tie' && !game.isTie) return false;
        }

        // Rays Pitcher Filter
        if (this.selectedPitcher && game.raysPitcher !== this.selectedPitcher) {
          return false;
        }

        // Opposing Pitcher Filter
        if (this.selectedOpponents.length > 0 && !this.selectedOpponents.includes(game.opponent)) {
          return false;
        }

        return true;
      });
    },
    sortedData() {
      if (!this.filteredData) return [];

      return [...this.filteredData].sort((a, b) => {
        return a[this.sortKey].localeCompare(b[this.sortKey]) * this.sortOrder;
      });
    }
  },
  methods: {
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, options);
    },
    openGameView(game) {
      this.selectedGame = game;
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder *= -1;
      } else {
        this.sortKey = key;
        this.sortOrder = 1;
      }
    },
    clearAllFilters() {
      this.hideSpringTraining = false;
      this.selectedOutcome = null;
      this.selectedPitcher = null;
      this.selectedOpponents = [];
      // If I had a login with saved preferences for org level, I would reset this to their preference. For now let's default to the MLB club
      this.selectedTeam = { id: 139, name: 'Tampa Bay Rays', sportId: 1, teamShort: 'Rays' };
    },
    async fetchData() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(
            `https://statsapi.mlb.com/api/v1/schedule?sportId=${this.selectedSportId}&teamId=${this.selectedTeamId}&hydrate=probablePitcher,stats&startDate=${this.startDate}&endDate=${this.endDate}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        this.data = await response.json();
      } catch (err) {
        this.error = `Failed to fetch data. Please try again later or contact the Baseball Systems Applications team at totallyrealemail@raysbaseball.com`;
        console.error('Error fetching data:', err);
      } finally {
        this.loading = false;
      }
    }
  },
  created() {
    this.fetchData();
  }
};
</script>

<style>
.error {
  color: red;
}

.reset-button{
  text-transform: unset !important;
  margin-left: 8px;
}
.v-table td:first-child {
  cursor: pointer;
  color: #1976D2;
  text-decoration: underline;
}

.v-table td:first-child:hover {
  color: #0D47A1;
}

.table-container{
  padding-left: 20px;
  padding-right: 20px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-bottom: 12px;
  padding-top: 20px;
}

.filter-select {
  min-width: 200px;
  max-width: 250px;
  padding-right: 4px;
}

.v-table th, .v-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.v-table th {
  background-color: #f2f2f2;
  user-select: none;
}

.v-table th:not(.no-sort) {
  cursor: pointer;
}

.v-table th:not(.no-sort):hover {
  background-color: #e6e6e6;
}

.v-table th {
  margin-left: 4px;
  font-size: 16px;
}

.no-sort {
  cursor: default !important;
}

.win-row {
  background-color: rgba(144, 238, 144, 0.3);
}

.loss-row {
  background-color: rgba(255, 182, 193, 0.3);
}

.tie-row {
  background-color: rgba(255, 255, 0, 0.3);
}

.game-details-view {
  padding: 20px;
}

.clickable-date {
  cursor: pointer;
  color: #1976D2;
  text-decoration: underline;
}

.clickable-date:hover {
  color: #0D47A1;
}

.left-filter{
  padding-left: 12px;
  max-width: 48px;
  padding-right: 8px;
}

.left-filter-label{
  padding-left: 12px;
}

.left-filter-container{
  display:flex;
  overflow: hidden;
}

@media (max-width: 960px) {
  .controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-select {
    width: 100%;
    max-width: 100%;
  }
}
</style>