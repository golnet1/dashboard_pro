export default {
    props: {
        transparent: Boolean,
    },
    computed: {
        card_color() {
            //return "rgb(00,30,30,"+this.$store.state.transparent_card/100+")"
            var alpha = this.$store.state.transparent_card / 100
            if (this.transparent)
                alpha -= alpha/3*2
            let color = this.$store.state.colorLight
            if (this.$vuetify.theme.dark)
                color = this.$store.state.colorDark
            if (this.widget.color) {
                if (this.widget.color.type != 'default') {
                    if (this.widget.color.color)
                        color = this.widget.color.color
                    if (this.widget.color.type == 'property') {
                        this.$store.dispatch("requestData", this.widget.color.object);
                        let obj_color = this.$store.getters.getData(this.widget.color.object)
                        if (obj_color) {
                            console.log(obj_color)
                            if (obj_color.value != undefined)
                                color = obj_color.value
                        }
                    }
                    color = color.replace('#', '')
                    let r = parseInt(color.substring(0, 2), 16)
                    let g = parseInt(color.substring(2, 4), 16)
                    let b = parseInt(color.substring(4, 6), 16)
                    if (this.widget.color.type == 'color') {
                        let result = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
                        return result
                    }
                    if (this.widget.color.type == 'property') {
                        let result = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
                        return result
                    }
                }
            }
            if (this.transparent)
                return 'rgba(0,0,0,0)'
            color = color.replace('#', '')
            let r = parseInt(color.substring(0, 2), 16)
            let g = parseInt(color.substring(2, 4), 16)
            let b = parseInt(color.substring(4, 6), 16)
            let result = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
            return result

        },
    },
}