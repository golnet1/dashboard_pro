<template>
  <v-bottom-sheet v-model="console" inset>
    <v-sheet height="400px">
      <v-card height="100%">
      <v-card-title class="py-1">{{$t('console')}}</v-card-title>
      <v-card-text class="pb-1">
        <v-textarea v-if="!result" v-model="code" height="300" solo no-resize hide-details outlined :label="$t('code')" ></v-textarea>
        <v-textarea v-else v-model="result" height="300" :label="$t('result')" readonly no-resize hide-details outlined></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="!result" class="ml-3" color="success" @click="runCode">
          {{$t("run")}}
        </v-btn>
        <v-btn v-else class="ml-3" color="success" @click="result =''">
          {{$t("clear")}}
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn class="mr-3" color="error" @click="console = !console">
          {{$t("close")}}
        </v-btn>
      </v-card-actions>
      </v-card>
    </v-sheet>
  </v-bottom-sheet>
</template>

<script>
import axios from "axios"
export default {
  name: "Console",
  data: () => ({
    code:"",
    result:""
  }),
  methods:{
    async runCode() {
      try {
            const response = await axios.get('/api/module/mboard_' + process.env.VUE_APP_TYPE + '/console', {
                params: {
                    command: this.code
                }
            });
            if (this.$store.state.debug) console.log(response.data)
            var res = ""
            response.data.apiHandleResult.forEach(element => {
              if (element.result!="")
                res += element.result + "\n"
            });
            this.result = res
        } catch (e) {
            if (this.$store.state.debug) console.log(e)
            this.result = e
        }
      this.code = ""
    },
  },
  computed: {
    console: {
      get() {
        return this.$store.state.console;
      },
      set(value) {
        this.$store.state.console = value;
      },
    },
  },
};
</script>