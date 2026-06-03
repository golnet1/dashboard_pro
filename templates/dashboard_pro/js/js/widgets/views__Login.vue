/** * Created by vouill on 11/13/17. */

<template>
  <v-card :light="!themeDark" class="pa-3" width="400">
    <v-card-text>
      <div class="layout column align-center">
        <img src="img/icon.png" alt="Mboard" width="180" height="180" />
        <h1 class="flex my-4 primary--text">MBoard</h1>
      </div>
        <v-text-field
          append-icon="fas fa-user"
          name="login"
          :label="$t('login.user')"
          type="text"
          v-model="userLogin"
          :error="error"
          :rules="[rules.required]"
        />
        <v-text-field
          :type="hidePassword ? 'password' : 'text'"
          :append-icon="hidePassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
          name="password"
          :label="$t('login.password')"
          id="password"
          :rules="[rules.required]"
          v-model="password"
          :error="error"
          @click:append="hidePassword = !hidePassword"
        />
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn block color="primary" @click="login" :loading="loading">{{$t("login.login")}}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { AUTH_REQUEST } from "../store/modules/auth";

export default {
  data() {
    return {
      loading: false,
      userLogin: "",
      password: "",
      hidePassword: true,
      error: false,
      rules: {
        required: (value) => !!value || "Required.",
      },
    };
  },
  computed: {
    themeDark() {
      return this.$vuetify.theme.dark;
    },
  },
  methods: {
    login() {
      const vm = this;
      // check login pass
      if (!vm.userLogin || !vm.password) {
        this.$store.dispatch("viewNotify", {text:this.$t("login.required")});
        return;
      }

      this.loading = true;
      this.$store
        .dispatch(AUTH_REQUEST, { user: vm.userLogin, password: vm.password })
        .then(() => {
          this.$store.dispatch("viewNotify", {text:this.$t("login.success")})
          this.loading = false
        })
        .catch(() => {
          //vm.error = true;
          if (this.$store.getters.authStatus != 'error')
          this.$store.dispatch("viewNotify", {text:this.$t("login.failed")})
          else
          this.$store.dispatch("viewNotify", {text:this.$store.getters.authError})
          this.loading = false
        })
    },
  },
};
</script>

