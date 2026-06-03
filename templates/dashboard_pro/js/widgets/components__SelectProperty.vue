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
        :placeholder="$t('select.property')"
        return-object
      ></v-autocomplete>
</template>

<script>
  export default {
    props: {
      value: String,
      objectName: String,
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
      this.setValue(this.value)
    },
    methods: {
      setValue(id) {
        //console.log(id)
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
        return this.items.find(item => item.TITLE === id);
      },
      preloading() {
        if (!this.objectName) return
        // Items have already been requested
        if (this.isLoading) return

        this.isLoading = true

        // Lazily load input items
        fetch('/api/module/mboard_'+process.env.VUE_APP_TYPE+'/properties/'+this.objectName)
          .then(res => res.json())
          .then(res => {
            //console.log(res.data)
            this.entries = res.apiHandleResult
            this.count = this.entries.length
            if (this.count > 0)
              this.setValue(this.value)

          })
          .catch(err => {
            console.log(err)
            this.entries = []
          })
          .finally(() => (this.isLoading = false))
      }
    },
    watch: {
      // eslint-disable-next-line no-unused-vars
      objectName(value)
      {
        //console.log(value)
        this.preloading();
        this.select = null
      },
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