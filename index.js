const client = new dsteem.Client('https://api.steemit.com');

const log = v => (console.log(v), v)

const getInfo = data =>
	client.call('condenser_api', 'get_content', [data.account, data.permlink])

const escapeHtml = unsafe =>
	unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		// .replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

const isJson = str => {
    try {
        var json = JSON.stringify(str);
        var obj = JSON.parse(json);
        if(typeof(str) == 'string')
            if(str.length == 0)
                return false;
    }
    catch(e){
        return false;
    }
    return true;
}

const forbidObjects = el =>
	typeof el === "object" ? JSON.stringify(el, null, 2) : el

const breakLines = el =>
	typeof el === 'string' ? el.replace(/\n/g, '<br>') : el

const codifyJson = el =>
	typeof el === 'string'
		&& (el.startsWith('{')	|| el.startsWith('['))
		&& isJson(el)
			? '<pre><code class="json">' + escapeHtml(JSON.stringify(JSON.parse(el), null, 2))  + '</code></pre>'
			: el

const processEntry = R.pipe(
	forbidObjects,
	codifyJson,
	breakLines)

const jsonToDt = R.pipe(
	JSON.parse,
	Object.entries,
	R.map(pair =>
	`<dt>${pair[0]}</dt>\n<dd>${processEntry(pair[1])}</dd>`),
	R.join('\n'))

const jsonToDl = json =>
	`<dl class="dl-horizontal">${jsonToDt(json)}</dl>`

jQuery.fn.extend({
	disable: function() {
		this.siblings().removeClass('disabled')
		return this.addClass('disabled')
	},
	showAlone: function() {
		this.siblings().hide()
		return this.show()
	}
})

$('#blist').click(() => {
	$('#bcopy').hide()
	$('#blist').disable()
	$('#datalist').showAlone()
})

$('#bjson').click(() => {
	$('#bcopy').show()
	$('#bjson').disable()
	$('#json-container').showAlone()
})

$('#bvotes').click(() => {
	$('#bcopy').hide()
	$('#bvotes').disable()
	$('#votes_wrapper').showAlone()
})

const clipboard = new ClipboardJS('#bcopy');

clipboard.on('success', e =>
	(log(e), $('#copy-success').show().delay(5000).fadeOut()))

let initialised = false;

const votesFromRes = res =>
	res.active_votes.map(obj => Object.values(obj))

const initialiseTable = res =>
	$('#votes').DataTable({
		data: votesFromRes(res),
		columns: [
			{ title: "Voter" },
			{ title: "Weight" },
			{ title: "RShares" },
			{ title: "Percent" },
			{ title: "Reputation" },
			{ title: "Time" }
		]
	})

$('#form').alpaca({
	schema: {
		title: "What post do you want to look into?",
		type: "object",
		properties: {
			account: {
				type: "string",
				title: "Account Name"
			},
			permlink: {
				type: "string",
				title: "Post Permlink"
			}
		}
	},
	options: {
		form: {
			buttons: {
				submit: {
					title: "Get results",
					click: function () {
						this.refreshValidationState(true);
						if (this.isValid(true)) {
							getInfo(this.getValue())
								.then(res => {
									const json = escapeHtml(JSON.stringify(res, null, 2))
									$('#json').html(json)
									$('#datalist').html(jsonToDl(json))
									if (!initialised) {
										initialised = true
										initialiseTable(res)
									} else {
										const datatable = $('#votes').DataTable()
								    datatable.clear();
								    datatable.rows.add(votesFromRes(res));
								    datatable.draw();
									}
									$('#result-container').show()
								})
						}
					},
					styles: "btn btn-primary"
				}
			}
		}
	}
});