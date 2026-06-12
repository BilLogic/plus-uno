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
        '<Badge text="Primary" style="primary" size="b2" />'
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
        '  style="primary"',
        '  fill="filled"',
        '  size="medium"',
        '/>'
    ]),
    buttonGroup: snippet([
        '<ButtonGroup',
        '  size="medium"',
        '  style="primary"',
        '  fill="tonal"',
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
        '  title="Hello, world!"',
        '  children="This is a simple hero unit."',
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
        '  type="default"',
        '  showBottomButtons',
        '  width={340}',
        '  primaryButton={{ text: "Primary", style: "primary", fill: "filled" }}',
        '  secondaryButton={{ text: "Secondary", style: "secondary", fill: "tonal" }}',
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
        '  <Button type="button" text="Toggle popover" style="primary" />',
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
        '  <Button text="Hover me" />',
        '</Tooltip>'
    ]),
    formInput: snippet([
        '<Input',
        '  id="input-overview"',
        '  showLabel',
        '  label="Label"',
        '  placeholder="Placeholder"',
        '  value=""',
        '  required',
        '  trailingVisual="fa-solid fa-icons"',
        '/>'
    ]),
    formTextarea: snippet([
        '<Textarea',
        '  id="textarea-overview"',
        '  label="Label"',
        '  placeholder="Enter text..."',
        '  variant="long"',
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
        '  <Radio id="radio-overview-1" name="radio-overview" label="Option 1" value="option1" checked />',
        '  <Radio id="radio-overview-2" name="radio-overview" label="Option 2" value="option2" />',
        '</>'
    ]),
    formSwitch: snippet([
        '<Switch',
        '  id="switch-overview"',
        '  name="switch-overview"',
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
    formNumber: snippet([
        '<NumberInput',
        '  id="number-input-overview"',
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
        '  onChange={(e) => setValue(parseFloat(e.target.value))}',
        '  size="medium"',
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
    formMultipleChoice: snippet([
        'const [radioValue, setRadioValue] = useState(null);',
        '',
        '<MultipleChoice',
        '  id="multiple-choice-overview"',
        '  name="multiple-choice-overview"',
        '  type="radio"',
        '  options={overviewRadioOptions}',
        '  value={radioValue}',
        '  onChange={setRadioValue}',
        '/>'
    ]),
    formScale: snippet([
        'const [value, setValue] = useState("option2");',
        '',
        '<Scale',
        '  id="scale-overview"',
        '  name="scale-overview"',
        '  label="Confidence"',
        '  lowestLabel="Lowest"',
        '  highestLabel="Highest"',
        '  options={[',
        '    { value: "option1", label: "Text" },',
        '    { value: "option2", label: "Text" },',
        '    { value: "option3", label: "Text" },',
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
        '  size="medium"',
        '/>'
    ]),
    formDateTime: snippet([
        '<DateAndTimePicker',
        '  id="datetime-overview"',
        '  label="Month"',
        '  required',
        '  showSectionLabels={false}',
        '/>'
    ]),
    formInputGroup: snippet([
        'const [value, setValue] = useState("");',
        '',
        '<InputGroup',
        '  id="input-group-overview"',
        '  placeholder="Placeholder"',
        '  leadingVisual={{ type: "text", children: "https://" }}',
        '  trailingVisual="icon"',
        '  value={value}',
        '  onChange={(e) => setValue(e.target.value)}',
        '/>'
    ])
};
