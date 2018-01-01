
let percent = 0

let getSongData = () => {
  $.ajax({
    type: 'GET',
    url: window.location.href + '/data',
    xhr: () => {
      let xhr = new window.XMLHttpRequest()
      xhr.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          percent = event.loaded / event.total
        }
      }, false)
      return xhr
    },
    success: (response) => {
      plotData(response)
    }
  })
}

let plotData = (songs) => {
  $('#data-title').text(window.location.href.split('/hip/')[1] + '\'s library popularity')
  $('#data-text').text(JSON.stringify(songs))
}

let showLoadingDiv = () => {
  $('#loading-div').show()
  var bar = new ProgressBar.Line('#loading-bar', { easing: 'easeInOut', strokeWidth: 0.5, duration: 2500, color: '#000000' })
  bar.animate(1)
  setTimeout(() => {
    console.log(percent)
    $('#loading-div').hide()
  }, 2500)
}

let run = () => {
  getSongData()
  showLoadingDiv()
}

run()
