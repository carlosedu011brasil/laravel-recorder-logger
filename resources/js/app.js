import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { mountRecorder } from './plugins/recorder' //importa aqui

createInertiaApp({
  resolve: name => import(`./Pages/${name}.vue`),
  setup({ el, App, props, plugin }) {
    const vueApp = createApp({ render: () => h(App, props) })
    vueApp.use(plugin)
    vueApp.mount(el)

    mountRecorder() //monta o componente global
  },
})
