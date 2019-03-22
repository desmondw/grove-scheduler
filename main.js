var parser = require('cron-parser')
var axios = require('axios')
var Vue = require('vue/dist/vue')

var app

function app() {
  app = new Vue({
    el: '#app',
    data: {
      events: []
    }
  })

  // get Web Notifications access
  Notification.requestPermission()

  // pull in schedule and display
  axios.get('https://scheduler-challenge.grove.co')
    .then(function (response) {
      displaySchedule(response.data.data)
    })
    .catch(function (error) {
      console.log(error)
    })
}

function displaySchedule(data) {
  let repeatingTasks = data.map(e => e.attributes)
  let curTime = Date.now()
  let startTime = curTime - (3*60*60*1000) // 3 hours ago
  let endTime = curTime + (24*60*60*1000) // 1 day from now

  app.$data.events = generateSchedule(repeatingTasks, startTime, endTime)

  // set web notifications
  app.$data.events.forEach(event => {
    if (event.date >= Date.now()) {
      let delay = event.date.getTime() - Date.now()
      window.setTimeout(()=>{
        let notification = new Notification(event.name)
      }, delay)
    }
  })
}

// given a list of repeating tasks, a start time, and an end time, generate a
// chronologically-sorted list of all events that will occur in that timeframe
function generateSchedule(repeatingTasks, startTime, endTime) {
  let events = []
  let parserOptions = {
    currentDate: startTime,
    endDate: endTime,
  }
  let interval

  repeatingTasks.forEach(task => {
    try {
      interval = parser.parseExpression(task.cron, parserOptions)
    } catch (err) {
      console.log('Error parsing cron: ' + err.message)
    }
    while (true) {
      try {
        events.push({
          name: task.name,
          date: interval.next().toDate(),
        })
      } catch (e) {
        break // no next date
      }
    }
  })

  events.sort((a, b) => (a.date > b.date) ? 1 : -1)
  return events
}

app()
