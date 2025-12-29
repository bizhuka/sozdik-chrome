/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify, { initializeTheme } from './vuetify'
// import initSqlJs from 'sql.js'

export async function registerPlugins(app) {
  app.use(vuetify)
  await initializeTheme(vuetify)

  // const config = {
  //   locateFile: filename => `/js/sql/${filename}`
  // }

  // initSqlJs(config).then(function (sql) {
  //   window.SQL = sql
  // }).catch(err => {
  //   console.error("Error initializing sql.js:", err)
  // })
}
