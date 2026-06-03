export default {
    computed: {
        info() {
            return this.$store.getters.getData(this.widget.object_info);
        },
    },
}