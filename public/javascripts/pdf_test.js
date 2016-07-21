var $textarea = $('#textarea');
var $input = $('#input');

$textarea.val(localStorage.tmp_html || '<h1>test</h1>');
$input.val(localStorage.tmp_url || location.host);

$('#createByPost').click(function() {
  var v = $textarea.val();
  $.post('/html2pdf', v, function(data) {
    localStorage.tmp_html = v;
    location = '/pdf_tmp/' + data.data + '.pdf';
  });
});

$('#createByUrl').click(function() {
  var v = $input.val();
  if (!v) {
    return;
  }
  $.post('/html2pdf?url=' + v, function(data) {
    localStorage.tmp_url = v;
    location = '/pdf_tmp/' + data.data + '.pdf';
  });
});