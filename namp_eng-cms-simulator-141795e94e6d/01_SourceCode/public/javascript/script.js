new function () {
	var qrcode = new QRCode(document.getElementById("qrcode"), {
		width : 100,
		height : 100
	});

	console.log($('#cpID').text()+"_"+$('#connID').text());
	qrcode.makeCode($('#cpID').text()+"_"+$('#connID').text());
}