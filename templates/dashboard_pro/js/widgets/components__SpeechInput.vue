<template>
          <v-btn
            dark
            :disabled="error"
            @click.stop="toggle ? endSpeechRecognition() : startSpeechRecognition()"
            icon
            :color="!toggle ? 'grey' : (speaking ? 'red' : 'red darken-3')"
            :class="{'animated infinite pulse': toggle}"
          >
            <!-- <v-icon>{{ toggle ? 'mdi-download' : 'Start Recording' }}</v-icon> -->
            <v-icon v-if="toggle">mdi-microphone-off</v-icon>
            <v-icon v-else>mdi-microphone</v-icon>
          </v-btn>
</template>

<script>
let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
let recognition = SpeechRecognition? new SpeechRecognition() : false

export default {
  name: 'SpeechInput',
  props: {
    lang: {
      type: String,
      default: 'en-US'
    },
    text: {
      type: [String, null],
      required: false
    }
  },
  data () {
    return {
      error: false,
      speaking: false,
      toggle: false,
      runtimeTranscription: '',
      sentences: [],
    }
  },
  methods: {
    checkCompatibility () {
      if (!recognition) {
        this.error = 'Speech Recognition is not available on this browser. Please use Chrome or Firefox'
        console.log(this.error);
        this.error = true
      }
    },
    endSpeechRecognition () {
      recognition.stop()
      this.toggle = false
      this.$emit('speechend', {
        sentences: this.sentences,
        text: this.sentences[this.sentences.length-1]
      })
    },
    startSpeechRecognition () {
      if (!recognition) {
        this.error = 'Speech Recognition is not available on this browser. Please use Chrome or Firefox'
        return false
      }
      this.toggle = true
      recognition.lang = this.lang
      recognition.interimResults = true

      // eslint-disable-next-line no-unused-vars
      recognition.addEventListener('speechstart', event => {
        this.speaking = true
      })

      // eslint-disable-next-line no-unused-vars
      recognition.addEventListener('speechend', event => {
        this.speaking = false
        //this.toggle = false
      })

      recognition.addEventListener('result', event => {
        const text = Array.from(event.results).map(result => result[0]).map(result => result.transcript).join('')
        this.runtimeTranscription = text
      })

      recognition.addEventListener('end', () => {
        if (this.runtimeTranscription !== '') {
          this.sentences.push(this.capitalizeFirstLetter(this.runtimeTranscription))
          this.endSpeechRecognition ()
          this.$emit('update:text', `${this.text}${this.sentences.slice(-1)[0]}. `)
        }
        this.runtimeTranscription = ''
        recognition.stop()
        if (this.toggle) {
          // keep it going.
          recognition.start()
        }
      })
      recognition.start()
    },
    capitalizeFirstLetter (string) {
      return string.charAt(0).toUpperCase() + string.slice(1)
    }
  },
  mounted () {
    this.checkCompatibility()
  }
}
</script>

<style>

</style>