export default {
    computed: {
        system_color() {
            let color = this.$store.state.colorLight
            if (this.$vuetify.theme.dark)
                color = this.$store.state.colorDark

            color = color.replace('#', '')
            let r = parseInt(color.substring(0, 2), 16)
            let g = parseInt(color.substring(2, 4), 16)
            let b = parseInt(color.substring(4, 6), 16)
            let result = 'rgba(' + r + ',' + g + ',' + b + ',' + this.$store.state.transparent_card / 100 + ')'
            return result
        },
        nav_color(){
            let color = this.$store.state.colorLight
            if (this.$vuetify.theme.dark)
                color = this.$store.state.colorDark

            color = color.replace('#', '')
            let r = parseInt(color.substring(0, 2), 16)
            let g = parseInt(color.substring(2, 4), 16)
            let b = parseInt(color.substring(4, 6), 16)
            let result = 'rgba(' + r + ',' + g + ',' + b + ',' + this.$store.state.transparent_control / 100 + ')'
            return result
        },
        dialog_color(){
            let color = this.$store.state.colorLight
            if (this.$vuetify.theme.dark)
                color = this.$store.state.colorDark

            color = color.replace('#', '')
            let r = parseInt(color.substring(0, 2), 16)
            let g = parseInt(color.substring(2, 4), 16)
            let b = parseInt(color.substring(4, 6), 16)
            let result = 'rgba(' + r + ',' + g + ',' + b + ',' + this.$store.state.transparent_dialog / 100 + ')'
            return result
        }
    },
}