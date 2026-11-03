/**
 * Canonical PLUS JSX snippets used by Storybook Overview `parameters.docs.source`.
 * These examples mirror how components/forms are implemented and consumed in this repo.
 */

const snippet = (lines) => lines.join('\n');

export const webAppSourceSnippets = {
    accordion: snippet([
        '<Accordion',
        '  items={[',
        '    { eventKey: "0", header: "Accordion Item #1", body: "This is the first accordion item\'s content." },',
        '    { eventKey: "1", header: "Accordion Item #2", body: "This is the second accordion item\'s content." },',
        '    { eventKey: "2", header: "Accordion Item #3", body: "This is the third accordion item\'s content." },',
        '  ]}',
        '  defaultActiveKey="0"',
        '/>'
    ]),
    alert: snippet([
        '<Alert',
        '  style="primary"',
        '  title="With Title"',
        '  dismissable',
        '>',
        '  Alert with title and message text.',
        '</Alert>'
    ]),
    badge: snippet([
        '<StatusTag appearance="info">Primary</StatusTag>'
    ]),
    breadcrumb: snippet([
        '<Breadcrumb',
        '  items={[',
        '    { text: "Home", href: "/" },',
        '    { text: "Training", href: "/training" },',
        '    { text: "Lessons", href: "/lessons" },',
        '    { text: "Current Page" },',
        '  ]}',
        '/>'
    ]),
    button: snippet([
        '<Button',
        '  text="Button"',
        '  appearance="primary"',
        '/>'
    ]),
    splitButton: snippet([
        '<SplitButton',
        '  text="Save"',
        '  menuLabel="More save options"',
        '/>'
    ]),
    filterButton: snippet([
        '<FilterButton',
        '  text="Status"',
        '  trailingMetric={2}',
        '/>'
    ]),
    verticalButton: snippet([
        '<VerticalButton',
        '  icon="user-gear"',
        '  label="Admin"',
        '/>'
    ]),
    iconButton: snippet([
        '<IconButton',
        '  icon="pen"',
        '  label="Edit page"',
        '/>'
    ]),
    linkButton: snippet([
        '<LinkButton',
        '  href="/sessions"',
        '  text="View sessions"',
        '/>'
    ]),
    linkIconButton: snippet([
        '<LinkIconButton',
        '  href="/help"',
        '  icon="circle-question"',
        '  label="Open Help Center"',
        '/>'
    ]),
    buttonGroup: snippet([
        '<ButtonGroup',
        '  appearance="default"',
        '  vertical={false}',
        '  buttons={[',
        '    { text: "Left" },',
        '    { text: "Center" },',
        '    { text: "Right" },',
        '  ]}',
        '/>'
    ]),
    card: snippet([
        '<Card',
        '  title="Card Title"',
        '  body="Some quick example text to build on the card title and make up the bulk of the card\'s content."',
        '/>'
    ]),
    carousel: snippet([
        '<Carousel',
        '  controls',
        '  indicators',
        '  interval={0}',
        '  slides={[',
        '    { content: <div>First Slide</div> },',
        '    { content: <div>Second Slide</div> },',
        '    { content: <div>Third Slide</div> },',
        '  ]}',
        '/>'
    ]),
    collapse: snippet([
        '<Collapse',
        '  id="overview-collapse"',
        '  trigger="Toggle Content"',
        '  triggerClass="btn btn-primary"',
        '  defaultOpen={false}',
        '>',
        '  <Card',
        '    body="Some placeholder content for the collapse component."',
        '    className="mt-2"',
        '    showBorder',
        '  />',
        '</Collapse>'
    ]),
    divider: snippet([
        '<div style={{ width: "100%", maxWidth: "600px" }}>',
        '  <p className="plus-body-1">Section above</p>',
        '  <Divider size="md" style="light" />',
        '  <p className="plus-body-1">Section below</p>',
        '</div>'
    ]),
    dropdown: snippet([
        '<Dropdown',
        '  buttonText="Dropdown"',
        '  style="primary"',
        '  items={[',
        '    { text: "Action" },',
        '    { text: "Another action" },',
        '    { text: "Something else here" },',
        '  ]}',
        '/>'
    ]),
    jumbotron: snippet([
        '<Jumbotron',
        '  title="Plan your next session"',
        '  description="See who is on your roster, review their progress and join the call from one place."',
        '  actions={<>',
        '    <Button text="Get started" appearance="primary" />',
        '    <Button text="Learn more" />',
        '  </>}',
        '/>'
    ]),
    listGroup: snippet([
        '<ListGroup>',
        '  <ListGroup.Item>List item 1</ListGroup.Item>',
        '  <ListGroup.Item>List item 2</ListGroup.Item>',
        '  <ListGroup.Item>List item 3</ListGroup.Item>',
        '</ListGroup>'
    ]),
    mediaObject: snippet([
        '<MediaObject',
        '  media={<div style={{ width: 64, height: 64 }} />}',
        '  heading="Media heading"',
        '>',
        '  Will you do the same for me? It\'s time to face the music.',
        '</MediaObject>'
    ]),
    modal: snippet([
        '<Modal',
        '  show',
        '  renderAs="inline"',
        '  title="Modal title"',
        '  body="Modal body text goes here."',
        '  width="sm"',
        '  height="hug"',
        '  showBottomButtons',
        '  primaryButton={{ text: "Primary", appearance: "primary" }}',
        '  secondaryButton={{ text: "Secondary" }}',
        '  onClose={() => {}}',
        '/>'
    ]),
    navPills: snippet([
        '<NavPills defaultActiveKey="1">',
        '  <NavPills.Item eventKey="1">Home</NavPills.Item>',
        '  <NavPills.Item eventKey="2">Profile</NavPills.Item>',
        '  <NavPills.Item eventKey="3">Messages</NavPills.Item>',
        '</NavPills>'
    ]),
    navTabs: snippet([
        '<NavTabs defaultActiveKey="1">',
        '  <NavTabs.Item eventKey="1">Home</NavTabs.Item>',
        '  <NavTabs.Item eventKey="2">Profile</NavTabs.Item>',
        '  <NavTabs.Item eventKey="3">Messages</NavTabs.Item>',
        '</NavTabs>'
    ]),
    pagination: snippet([
        '<Pagination',
        '  currentPage={5}',
        '  totalPages={10}',
        '  type="icon"',
        '  size="default"',
        '  maxVisible={5}',
        '  onPageChange={(page) => setPage(page)}',
        '/>'
    ]),
    popover: snippet([
        '<div className="plus-popover-overview-static">',
        '  <Button type="button" text="Toggle popover" appearance="primary" />',
        '  <RBPopover className="plus-popover" placement="right">',
        '    <RBPopover.Header className="plus-popover-title">Popover title</RBPopover.Header>',
        '    <RBPopover.Body className="plus-popover-body">',
        '      Body content appears below the title.',
        '    </RBPopover.Body>',
        '  </RBPopover>',
        '</div>'
    ]),
    progress: snippet([
        '<Progress value={50} style="primary" size="medium" showLabel />'
    ]),
    richTextEditor: snippet([
        '<RichTextEditor',
        '  placeholder="Type something..."',
        '  minHeight={150}',
        '/>'
    ]),
    scrollspy: snippet([
        '<Scrollspy',
        '  id="scrollspy-docs-overview-nav"',
        '  brand="Navbar"',
        '  items={[{ text: "@fat", href: "#scrollspy-docs-overview-fat" }]}',
        '  contentId="scrollspy-docs-overview-content"',
        '  offset={10}',
        '/>',
        '<ScrollspyContent id="scrollspy-docs-overview-content" height="500px">',
        '  <section id="scrollspy-docs-overview-fat">',
        '    <h4 className="h4">@fat</h4>',
        '  </section>',
        '</ScrollspyContent>'
    ]),
    sidebarTab: snippet([
        '<SidebarTab',
        '  text="Dashboard"',
        '  icon="home"',
        '  state="enabled"',
        '/>'
    ]),
    spinner: snippet([
        '<Spinner variant="border" />'
    ]),
    toast: snippet([
        '<ToastContainer className="p-3" style={{ position: "static" }}>',
        '  <Toast title="Secondary Toast" style="secondary" timestamp="Just now">',
        '    This is a secondary toast (default).',
        '  </Toast>',
        '</ToastContainer>'
    ]),
    tooltip: snippet([
        '<Tooltip',
        '  text="Tooltip text"',
        '  placement="top"',
        '  size="default"',
        '  show',
        '>',
        '  <Button appearance="primary" text="Hover me" />',
        '</Tooltip>'
    ]),
    formTextField: snippet([
        '<TextField',
        '  id="text-field-overview"',
        '  label="Label"',
        '  placeholder="Placeholder"',
        '  value=""',
        '  isRequired',
        '  elemAfter={<i className="fa-solid fa-icons" aria-hidden="true" />}',
        '/>'
    ]),
    formTextArea: snippet([
        '<TextArea',
        '  id="text-area-overview"',
        '  label="Label"',
        '  placeholder="Enter text..."',
        '  rows={3}',
        '/>'
    ]),
    formSelect: snippet([
        '<Select',
        '  options={sampleOptions}',
        '  placeholder="Select (a/an) {value} from below"',
        '/>'
    ]),
    formCheckbox: snippet([
        '<Checkbox',
        '  id="cb-overview"',
        '  name="cb-overview"',
        '  label="Option"',
        '  defaultChecked',
        '/>'
    ]),
    formRadio: snippet([
        '<>',
        '  <Radio id="radio-overview-1" name="radio-overview" label="Option 1" value="option1" isChecked/>',
        '  <Radio id="radio-overview-2" name="radio-overview" label="Option 2" value="option2"/>',
        '</>'
    ]),
    formToggle: snippet([
        '<Toggle',
        '  id="toggle-overview"',
        '  name="toggle-overview"',
        '  label="Wi-Fi"',
        '  defaultChecked',
        '/>'
    ]),
    formFile: snippet([
        '<FileUpload',
        '  id="file-upload-overview"',
        '  label="Upload files"',
        '  acceptedFormats={formats}',
        '  buttonText="Choose a file"',
        '/>'
    ]),
    formNumberField: snippet([
        '<TextField',
        '  id="number-field-overview"',
        '  type="number"',
        '  label="Number of sessions"',
        '  placeholder="Number"',
        '/>'
    ]),
    formRange: snippet([
        'const [value, setValue] = useState(50);',
        '',
        '<Range',
        '  id="range-overview"',
        '  min={0}',
        '  max={100}',
        '  value={value}',
        '  onChange={(next) => setValue(next)}',
        '/>'
    ]),
    formRating: snippet([
        'const [value, setValue] = useState(3);',
        '',
        '<Rating',
        '  id="rating-overview"',
        '  label="Rating"',
        '  required',
        '  value={value}',
        '  variant="comments"',
        '  onChange={setValue}',
        '/>'
    ]),
    formCascader: snippet([
        'const [value, setValue] = useState([]);',
        '',
        '<Cascader',
        '  id="cascader-overview"',
        '  value={value}',
        '  options={sampleOptions}',
        '  onChange={setValue}',
        '  placeholder="Please select"',
        '/>'
    ]),
    formChoiceGrid: snippet([
        'const [radioValues, setRadioValues] = useState({ "row-1": "col-2" });',
        '',
        '<ChoiceGrid',
        '  id="choice-grid-overview"',
        '  name="choice-grid-overview"',
        '  type="radio"',
        '  rows={[{ id: "row-1", label: "Row 1" }]}',
        '  columns={[',
        '    { id: "col-1", label: "Column 1" },',
        '    { id: "col-2", label: "Column 2" },',
        '    { id: "col-3", label: "Column 3" },',
        '  ]}',
        '  values={radioValues}',
        '  onChange={(rowId, columnId) => setRadioValues({ ...radioValues, [rowId]: columnId })}',
        '/>'
    ]),
    formChoiceGroup: snippet([
        'const [value, setValue] = useState(null);',
        '',
        '<ChoiceGroup',
        '  id="cg-overview"',
        '  name="cg-overview"',
        '  legend="Which subject did you tutor?"',
        '  options={[',
        '    { value: "math", label: "Math" },',
        '    { value: "reading", label: "Reading" },',
        '    { value: "science", label: "Science" },',
        '  ]}',
        '  value={value}',
        '  onChange={setValue}',
        '/>'
    ]),
    formLabelCaption: snippet([
        '<div style={{ display: "flex", flexDirection: "column", gap: "var(--size-element-gap-xs)" }}>',
        '  <Label text="Field label" required />',
        '  <Caption text="Helper or validation copy beneath the label." state="default" icon="square-plus" />',
        '</div>'
    ]),
    formDatePicker: snippet([
        '<DatePicker',
        '  placeholder="Select a date"',
        '/>'
    ]),
    formDateTime: snippet([
        '<DateTimePicker',
        '  id="datetime-overview"',
        '  label="Month"',
        '  isRequired',
        '  showSectionLabels={false}',
        '/>'
    ]),
    formTextFieldAffix: snippet([
        'const [value, setValue] = useState("");',
        '',
        '<TextField',
        '  id="text-field-affix-overview"',
        '  label="Website"',
        '  placeholder="Placeholder"',
        '  elemBefore="https://"',
        '  elemAfter={<i className="fa-solid fa-link" aria-hidden="true" />}',
        '  value={value}',
        '  onChange={(e) => setValue(e.target.value)}',
        '/>'
    ])
};
