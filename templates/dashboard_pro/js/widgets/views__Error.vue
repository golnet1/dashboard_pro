<template>
  <v-app id="error">
      <v-container fluid fill-height>
        <v-layout align-center justify-center row>
          <div class="text-md-center">
            <h1 class="errorCode" v-if="$route.params.errorCode">{{ $route.params.errorCode }}</h1>
            <h1 class="errorCode" v-else>404</h1>
            <h2 class="my-3 headline" v-if="$route.params.errorMessage">{{ $route.params.errorMessage }}</h2>
            <h2 class="my-3 headline" v-else>Page not found!</h2>
            <div>
              <v-btn color="secondary" @click="$router.push({ name: 'Home' })">Go To home</v-btn>
            </div>
          </div>
        </v-layout>
      </v-container>
  </v-app>
</template>

<script>
export default {};
</script>