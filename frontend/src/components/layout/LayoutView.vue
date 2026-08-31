<template>
  <AppLayout>
    <router-view v-slot="{ Component, route }">
      <UserRouteTransition :route-path="route.path">
        <component :is="Component" :key="route.path" />
      </UserRouteTransition>
    </router-view>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from './AppLayout.vue'
import UserRouteTransition from './UserRouteTransition.vue'
</script>
