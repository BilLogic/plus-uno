/**
 * Canonical HTML / JSP patterns aligned with PLUS web-app (Bootstrap 4 in `java/docroot`).
 * Used for Storybook Overview `parameters.docs.source` — essence matches production, not verbatim.
 */

const hdr = (fileHint) =>
    `<!-- PLUS web-app (Bootstrap 4 in JSP). ${fileHint} — attrs/copy vary by screen. -->`;

export const webAppSourceSnippets = {
    accordion: [
        hdr('Collapsible panels, e.g. resource or FAQ sections'),
        '<div class="card">',
        '    <div class="card-header" id="headingOne">',
        '        <h5 class="mb-0">',
        '            <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseOne">',
        '                Section title',
        '            </button>',
        '        </h5>',
        '    </div>',
        '    <div id="collapseOne" class="collapse show" data-parent="#accordion">',
        '        <div class="card-body">Section body</div>',
        '    </div>',
        '</div>'
    ].join('\n'),

    alert: [
        hdr('Flash / inline messages'),
        '<div class="alert alert-primary alert-dismissible fade show" role="alert">',
        '    <strong>Title</strong> Message body',
        '    <button type="button" class="close" data-dismiss="alert" aria-label="Close">',
        '        <span aria-hidden="true">&times;</span>',
        '    </button>',
        '</div>'
    ].join('\n'),

    badge: [
        hdr('Labels and counts'),
        '<span class="badge badge-primary">Label</span>',
        '<span class="badge badge-pill badge-secondary">12</span>'
    ].join('\n'),

    breadcrumb: [
        hdr('nav aria-label="breadcrumb"'),
        '<nav aria-label="breadcrumb">',
        '    <ol class="breadcrumb">',
        '        <li class="breadcrumb-item"><a href="/">Home</a></li>',
        '        <li class="breadcrumb-item active" aria-current="page">Current</li>',
        '    </ol>',
        '</nav>'
    ].join('\n'),

    button: [
        hdr('java/docroot/jsp_pl2_student/resource.jsp pattern'),
        '<button type="button" class="btn btn-primary">Button</button>',
        '',
        '<a href="/your-path" class="btn btn-primary">Button</a>'
    ].join('\n'),

    buttonGroup: [
        hdr('Grouped actions'),
        '<div class="btn-group" role="group">',
        '    <button type="button" class="btn btn-secondary">Left</button>',
        '    <button type="button" class="btn btn-secondary">Right</button>',
        '</div>'
    ].join('\n'),

    card: [
        hdr('Content containers'),
        '<div class="card" style="width: 18rem;">',
        '    <div class="card-body">',
        '        <h5 class="card-title">Card title</h5>',
        '        <p class="card-text">Card body</p>',
        '        <a href="#" class="btn btn-primary">Action</a>',
        '    </div>',
        '</div>'
    ].join('\n'),

    carousel: [
        hdr('Image rotators'),
        '<div id="carousel" class="carousel slide" data-ride="carousel">',
        '    <div class="carousel-inner">',
        '        <div class="carousel-item active"><img class="d-block w-100" src="..." alt=""></div>',
        '    </div>',
        '</div>'
    ].join('\n'),

    collapse: [
        hdr('Expand / collapse regions'),
        '<button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#more">',
        '    Toggle',
        '</button>',
        '<div class="collapse" id="more"><div class="card card-body">Hidden content</div></div>'
    ].join('\n'),

    divider: [
        hdr('Visual separation'),
        '<hr class="my-4">',
        '<div class="dropdown-divider"></div>'
    ].join('\n'),

    dropdown: [
        hdr('Menus on triggers'),
        '<div class="dropdown">',
        '    <button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown">',
        '        Dropdown',
        '    </button>',
        '    <div class="dropdown-menu">',
        '        <a class="dropdown-item" href="#">Item</a>',
        '    </div>',
        '</div>'
    ].join('\n'),

    jumbotron: [
        hdr('Hero / lead blocks (BS4)'),
        '<div class="jumbotron">',
        '    <h1 class="display-4">Title</h1>',
        '    <p class="lead">Supporting copy.</p>',
        '    <a class="btn btn-primary btn-lg" href="#" role="button">Action</a>',
        '</div>'
    ].join('\n'),

    listGroup: [
        hdr('Lists of links or actions'),
        '<ul class="list-group">',
        '    <li class="list-group-item active">Active item</li>',
        '    <li class="list-group-item">Item</li>',
        '</ul>'
    ].join('\n'),

    mediaObject: [
        hdr('Media + body (BS4)'),
        '<div class="media">',
        '    <img class="mr-3" src="..." alt="">',
        '    <div class="media-body"><h5 class="mt-0">Heading</h5>Body</div>',
        '</div>'
    ].join('\n'),

    modal: [
        hdr('Dialogs — markup + Bootstrap modal()'),
        '<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog">',
        '    <div class="modal-dialog" role="document">',
        '        <div class="modal-content">',
        '            <div class="modal-header">',
        '                <h5 class="modal-title">Title</h5>',
        '                <button type="button" class="close" data-dismiss="modal">&times;</button>',
        '            </div>',
        '            <div class="modal-body">Body</div>',
        '            <div class="modal-footer">',
        '                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>',
        '            </div>',
        '        </div>',
        '    </div>',
        '</div>'
    ].join('\n'),

    navPills: [
        hdr('Pill navigation'),
        '<ul class="nav nav-pills">',
        '    <li class="nav-item"><a class="nav-link active" href="#">Active</a></li>',
        '    <li class="nav-item"><a class="nav-link" href="#">Link</a></li>',
        '</ul>'
    ].join('\n'),

    navTabs: [
        hdr('Tab navigation'),
        '<ul class="nav nav-tabs">',
        '    <li class="nav-item"><a class="nav-link active" href="#">Active</a></li>',
        '    <li class="nav-item"><a class="nav-link" href="#">Tab</a></li>',
        '</ul>'
    ].join('\n'),

    pagination: [
        hdr('Page controls'),
        '<nav aria-label="Page navigation">',
        '    <ul class="pagination">',
        '        <li class="page-item disabled"><span class="page-link">Prev</span></li>',
        '        <li class="page-item active"><span class="page-link">1</span></li>',
        '    </ul>',
        '</nav>'
    ].join('\n'),

    popover: [
        hdr('data-toggle="popover" + title/content'),
        '<button type="button" class="btn btn-secondary" data-toggle="popover" title="Title" data-content="Body">',
        '    Toggle popover',
        '</button>'
    ].join('\n'),

    progress: [
        hdr('Progress bars'),
        '<div class="progress">',
        '    <div class="progress-bar" role="progressbar" style="width: 50%;" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">',
        '        50%',
        '    </div>',
        '</div>'
    ].join('\n'),

    richTextEditor: [
        hdr('Often a textarea or third-party editor in JSP'),
        '<textarea class="form-control" rows="4" name="content"></textarea>',
        '<!-- Or rich editor init bound to a field in the page script -->'
    ].join('\n'),

    scrollspy: [
        hdr('Scroll-linked nav (data-spy / nav offsets)'),
        '<body data-spy="scroll" data-target="#navbar" data-offset="0">',
        '    <!-- nav links + sections with ids -->',
        '</body>'
    ].join('\n'),

    sidebarTab: [
        hdr('Side nav — nav-link / list-group styling varies'),
        '<nav class="nav flex-column">',
        '    <a class="nav-link active" href="#">Dashboard</a>',
        '    <a class="nav-link" href="#">Reports</a>',
        '</nav>'
    ].join('\n'),

    spinner: [
        hdr('Loading indicator'),
        '<div class="spinner-border text-primary" role="status">',
        '    <span class="sr-only">Loading...</span>',
        '</div>'
    ].join('\n'),

    toast: [
        hdr('Notifications (BS4.4+ / custom)'),
        '<div class="toast" role="alert">',
        '    <div class="toast-header"><strong class="mr-auto">Title</strong></div>',
        '    <div class="toast-body">Message</div>',
        '</div>'
    ].join('\n'),

    tooltip: [
        hdr('data-toggle="tooltip"'),
        '<button type="button" class="btn btn-secondary" data-toggle="tooltip" title="Tooltip text">',
        '    Hover me',
        '</button>'
    ].join('\n'),

    formInput: [
        hdr('Labeled text field'),
        '<div class="form-group">',
        '    <label for="fieldId">Label <span class="text-danger">*</span></label>',
        '    <input type="text" class="form-control" id="fieldId" name="fieldName" placeholder="Placeholder">',
        '</div>'
    ].join('\n'),

    formTextarea: [
        hdr('Multi-line field'),
        '<div class="form-group">',
        '    <label for="notes">Notes</label>',
        '    <textarea class="form-control" id="notes" name="notes" rows="3" placeholder="Enter text..."></textarea>',
        '</div>'
    ].join('\n'),

    formSelect: [
        hdr('Native select'),
        '<div class="form-group">',
        '    <label for="choice">Choose</label>',
        '    <select class="form-control" id="choice" name="choice">',
        '        <option value="">Select an option</option>',
        '        <option value="1">Option 1</option>',
        '    </select>',
        '</div>'
    ].join('\n'),

    formCheckbox: [
        hdr('Single checkbox'),
        '<div class="form-check">',
        '    <input class="form-check-input" type="checkbox" id="agree" name="agree" value="1">',
        '    <label class="form-check-label" for="agree">I agree</label>',
        '</div>'
    ].join('\n'),

    formRadio: [
        hdr('Radio group — same name'),
        '<div class="form-check">',
        '    <input class="form-check-input" type="radio" name="plan" id="planA" value="a">',
        '    <label class="form-check-label" for="planA">Option A</label>',
        '</div>',
        '<div class="form-check">',
        '    <input class="form-check-input" type="radio" name="plan" id="planB" value="b">',
        '    <label class="form-check-label" for="planB">Option B</label>',
        '</div>'
    ].join('\n'),

    formSwitch: [
        hdr('Custom checkbox as toggle (BS4 pattern)'),
        '<div class="custom-control custom-switch">',
        '    <input type="checkbox" class="custom-control-input" id="toggle">',
        '    <label class="custom-control-label" for="toggle">Enable</label>',
        '</div>'
    ].join('\n'),

    formFile: [
        hdr('File input'),
        '<div class="form-group">',
        '    <label for="file">Upload</label>',
        '    <input type="file" class="form-control-file" id="file" name="file">',
        '</div>'
    ].join('\n'),

    formNumber: [
        hdr('Numeric field'),
        '<div class="form-group">',
        '    <label for="qty">Quantity</label>',
        '    <input type="number" class="form-control" id="qty" name="qty" min="0" step="1" placeholder="0">',
        '</div>'
    ].join('\n'),

    formRange: [
        hdr('Range input'),
        '<label for="volume">Volume</label>',
        '<input type="range" class="custom-range" id="volume" name="volume" min="0" max="100" value="50">'
    ].join('\n'),

    formRating: [
        hdr('Star scale — often custom markup or third-party in JSP'),
        '<div class="form-group" role="group" aria-label="Rating">',
        '    <span>Rating</span> <span class="text-danger">*</span>',
        '    <!-- e.g. radio stars or icon buttons; values posted on submit -->',
        '</div>'
    ].join('\n'),

    formCascader: [
        hdr('Hierarchical pickers — chained selects or custom menu'),
        '<div class="form-group">',
        '    <label>Region</label>',
        '    <select class="form-control" name="region"><option>Choose…</option></select>',
        '    <select class="form-control mt-2" name="city"><option>Choose…</option></select>',
        '</div>'
    ].join('\n'),

    formChoiceGrid: [
        hdr('Matrix of radios/checkboxes'),
        '<table class="table table-bordered">',
        '    <thead><tr><th></th><th>Col A</th><th>Col B</th></tr></thead>',
        '    <tbody>',
        '        <tr><th scope="row">Row 1</th><td><input type="radio" name="r1" value="a"></td><td><input type="radio" name="r1" value="b"></td></tr>',
        '    </tbody>',
        '</table>'
    ].join('\n'),

    formMultipleChoice: [
        hdr('Vertical list of radios or checkboxes'),
        '<div class="form-group">',
        '    <div class="form-check"><input class="form-check-input" type="radio" name="q" id="q1" value="1"><label class="form-check-label" for="q1">One</label></div>',
        '    <div class="form-check"><input class="form-check-input" type="radio" name="q" id="q2" value="2"><label class="form-check-label" for="q2">Two</label></div>',
        '</div>'
    ].join('\n'),

    formScale: [
        hdr('Likert-style inline radios'),
        '<fieldset class="form-group">',
        '    <legend>Scale</legend>',
        '    <div class="form-check form-check-inline"><input class="form-check-input" type="radio" name="scale" id="s1" value="1"><label class="form-check-label" for="s1">1</label></div>',
        '    <div class="form-check form-check-inline"><input class="form-check-input" type="radio" name="scale" id="s2" value="2"><label class="form-check-label" for="s2">2</label></div>',
        '</fieldset>'
    ].join('\n'),

    formLabelCaption: [
        hdr('Label + helper text'),
        '<div class="form-group">',
        '    <label for="email">Email <span class="text-danger">*</span></label>',
        '    <input type="email" class="form-control" id="email" name="email">',
        '    <small class="form-text text-muted">Helper or validation copy.</small>',
        '</div>'
    ].join('\n'),

    formDatePicker: [
        hdr('Date field — often datepicker plugin bound to input'),
        '<div class="form-group">',
        '    <label for="date">Date</label>',
        '    <input type="text" class="form-control" id="date" name="date" placeholder="MM/DD/YYYY" autocomplete="off">',
        '</div>'
    ].join('\n'),

    formDateTime: [
        hdr('Date + time row'),
        '<div class="form-row">',
        '    <div class="form-group col-md-6">',
        '        <label for="d">Date</label>',
        '        <input type="text" class="form-control" id="d" name="date" placeholder="Date">',
        '    </div>',
        '    <div class="form-group col-md-6">',
        '        <label for="t">Time</label>',
        '        <input type="text" class="form-control" id="t" name="time" placeholder="Time">',
        '    </div>',
        '</div>'
    ].join('\n'),

    formInputGroup: [
        hdr('Input group prepend / append'),
        '<div class="input-group">',
        '    <div class="input-group-prepend"><span class="input-group-text">https://</span></div>',
        '    <input type="text" class="form-control" placeholder="example.com">',
        '    <div class="input-group-append"><span class="input-group-text">.com</span></div>',
        '</div>'
    ].join('\n')
};
