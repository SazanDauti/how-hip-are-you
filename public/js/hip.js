
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
      setupDataView()
      plotData(response)
    }
  })
}

let plotData = (songs) => {
  data = new Array(100).fill(5)
  for (var i = 0; i < songs.length; i++) {
    index = songs[i].popularity
    if (index != 0) {
      data[index - 1] += 1
    }
  }

  let height = $('#data-plot').height()
  let paddedHeight = height - 40
  let width = $('#data-plot').width()
  let paddedWidth = width - 50

  let graph = d3.select('#data-plot').append('svg')
    .attr('height','100%')
    .attr('width','100%')

  graph.selectAll('rect')
    .data(data)
    .enter().append('rect')
    .attr('height', (data, index) => {
      return paddedHeight * (data / 100)
    })
    .attr('width', (data, index) => {
      return paddedWidth / 100
    })
    .attr('x', (data, index) => {
      return paddedWidth / 100 * index + 40
    })
    .attr('y', (data, index) => {
      return paddedHeight * (1 - data / 100)
    })
    .attr('stroke', 'black')
    .attr('stroke-width', '1')
  graph.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate('+ (18) +','+(height/2)+')rotate(-90)')
    .text('song popularity');
  graph.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate('+ (width/2) +','+(height-(10))+')')
    .text('number of songs');
}

let setupDataView = (songs) => {
  $('#data-title').text(window.location.href.split('/hip/')[1] + '\'s library popularity')
}

let showLoadingDiv = () => {
  $('#loading-div').show()
  var bar = new ProgressBar.Line('#loading-bar', { easing: 'easeInOut', strokeWidth: 0.5, duration: 2500, color: '#000000' })
  bar.animate(1)
  setTimeout(() => {
    $('#loading-div').hide()
  }, 2500)
}

let run = () => {
  getSongData()
  showLoadingDiv()
}

run()
