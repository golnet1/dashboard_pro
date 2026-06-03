<template>
  <div>
    <v-col class="pa-0">
      <v-select
        :items="types"
        item-text="title"
        item-value="name"
        :label="title ? title : $t('option.type_color_background')"
        :value="local.type"
        @input="update('type', $event)"
      ></v-select>
    </v-col>
    <v-col v-if="local.type == 'color' || local.type == 'status'" class="pa-0">
        {{$t('option.color')}}<color-input :value="local.color" viewInput  @input="update('color', $event)"/>
    </v-col>
    <v-col v-if="local.type == 'property'" class="pa-0">
      <select-objectproperty :label="$t('option.object_color')" :value="local.object" @input="update('object', $event)" />
    </v-col>
  </div>
</template>

<script>
export default {
  props: ['value','title'],
  data: () => ({
    types: [
      { title: "Default", name: "default" },
      { title: "Color", name: "color" },
      { title: "Property color", name: "property" },
      //{ title: "Status", name: "status" },
    ],
    color: '',
  }),
  computed: {
    local() {
      return this.value ? this.value : { type: 'default', color: '#000000'}
    },
    swatchStyle() {
      const { color, menu } = this
      return {
        backgroundColor: color,
        cursor: 'pointer',
        height: '30px',
        width: '30px',
        borderRadius: menu ? '50%' : '4px',
        transition: 'border-radius 200ms ease-in-out'
      }
    }
  },
  methods: {
    update(key, value) {
      console.log(key,value)
      this.local[key]=value
      this.$emit('input', { ...this.local, [key]: value })
    },
  },
  watch: {
    //value(value) {
       // this.type = value.type
       // this.color = value.color
       //this.$emit("input", value);
    //},
  },
  created() {
    this.types[0].title = this.$t('type_color_background.default')
    this.types[1].title = this.$t('type_color_background.color')
    this.types[2].title = this.$t('type_color_background.property')
  },
};
</script>