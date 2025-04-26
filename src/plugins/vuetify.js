import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import 'vuetify/styles'

const myCustomTheme = {
    dark: false,
    colors: {
        primary: '#1867C0',
        secondary: '#5CBBF6',
    }
}

export default createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'myCustomTheme',
        themes: {
            myCustomTheme,
        }
    }
})