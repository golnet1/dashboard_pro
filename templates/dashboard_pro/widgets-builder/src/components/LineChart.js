// eslint-disable-next-line no-unused-vars
import { Line, mixins } from 'vue-chartjs'
import zoom from 'chartjs-plugin-zoom';
const { reactiveProp } = mixins

export default {
  extends: Line,
  mixins: [reactiveProp],
  props: ['chartData','options'],
  methods:{
    resetZoom(){
      this.$data._chart.resetZoom();
    },
  },
  mounted() {
    this.addPlugin(zoom);
    // this.chartData создаётся внутри миксина.
    // Если вы хотите передать опции, создайте локальный объект options
    this.renderChart(this.chartData, this.options)
  },
  
}