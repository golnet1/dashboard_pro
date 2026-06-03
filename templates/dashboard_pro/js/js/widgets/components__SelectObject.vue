<template>
      <v-autocomplete
        v-model="select"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        hide-no-data
        hide-selected
        hide-details
        item-text="Description"
        item-value="TITLE"
        :placeholder="$t('select.object')"
        :label="label"
        return-object
      ></v-autocomplete>
</template>

<script>
  export default {
    props: {
      value: String,
      label: String,
    },
    data: () => ({
      descriptionLimit: 60,
      entries: [],
      isLoading: false,
      select: [],
      search: null,
    }),

    computed: {
      items () {
        return this.entries.map(entry => {
          var Description = entry.TITLE + " - " + (entry.DESCRIPTION  || '...')
          return Object.assign({}, entry, { Description })
        })
      },
    },
    created() {
        if (this.value)
            this.setValue(this.value)
        else
            this.preloading()
    },
    methods: {
      setValue(id) {
        if (!id) {
          this.select = null;
        } else if (!this.select || this.select.value !== id) {
          const item = this.getItemById(id);
          if (item) {
            this.select = item;
          } else {
            this.preloading();
          }
        }
      },
      getItemById(id) {
        return this.entries.find(item => item.TITLE === id);
      },
      preloading() {
        // Items have already been requested
        if (this.isLoading) return

        this.isLoading = true

        // Lazily load input items
        fetch('/api/module/mboard_'+process.env.VUE_APP_TYPE+'/objects')
          .then(res => res.json())
          .then(res => {
            //console.log(res.objects)
            this.entries = res.apiHandleResult
            this.count = this.entries.length
            if (this.count > 0)
                this.setValue(this.value)
          })
          .catch(err => {
            console.log(err)
          })
          .finally(() => (this.isLoading = false))
      }
    },
    watch: {
      select(value) {
        //console.log(value)
        this.$emit('input', value ? value.TITLE : null);
      },
      value(value) {
        this.setValue(value);
      },
      // eslint-disable-next-line no-unused-vars
      search (val) {

      },
    },
  }
</script>