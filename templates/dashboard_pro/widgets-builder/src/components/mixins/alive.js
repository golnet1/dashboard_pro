export default {
    computed: {
        alive() {
            if (this.widget.object_alive) {
                var alive = this.$store.getters.getData(this.widget.object_alive)
                if (alive)
                  if (alive.value != undefined)
                    return alive.value != '1';
            }
            return false;
        },
    },
}