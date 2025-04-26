<template>
  <img alt="Skateray" src="./assets/skateray.png">
  <GameHistoryTable></GameHistoryTable>
</template>

<script>
import GameHistoryTable from "@/components/GameHistoryTable.vue";

export default {
  name: 'App',
  components: {
    GameHistoryTable,
  }
}
</script>

<style>
#app {
  font-family: Helvetica-Neue, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
